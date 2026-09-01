#!/usr/bin/env node
// Sync writeups from the Obsidian vault into the site's content directory.
//
//   node scripts/sync-writeups.mjs            # uses the default vault path
//   VAULT_DIR="/path/to/vault" npm run sync:writeups
//
// It reads only `10_Writeups/**/*.md` (type: writeup), validates the
// frontmatter, redacts CTF flags, resolves [[tool]] links against the
// private `20_Wiki/` notes into a glossary, drops empty template sections,
// and writes:
//
//   content/writeups/<slug>.md   one cleaned, publish-safe file per writeup
//   content/writeups/index.json  metadata + category palette + glossary
//
// The vault is never modified. Validation errors abort the run before any
// file is written, so a broken vault can never publish a partial site.
// Exit code is non-zero on error, which lets it gate a commit or CI.

import { readFile, readdir, writeFile, rm, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, basename, extname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Config — the one place to edit categories, colours, and vocabularies.
// ---------------------------------------------------------------------------

const VAULT_DIR =
  process.env.VAULT_DIR ||
  argVal('--vault') ||
  join(homedir(), 'Documents', 'Obsidian Vault');

const PROJECT_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT_DIR = join(PROJECT_DIR, 'content', 'writeups');

const WRITEUPS_SUBDIR = '10_Writeups'; // published
const WIKI_SUBDIR = '20_Wiki'; // private, mined for the glossary

// The kill-chain palette, tuned against the terracotta section background.
// `order` sorts the category sections down the page; `match` lists the raw
// `category:` strings that fall into each bucket (first token is the label).
const CATEGORIES = [
  { slug: 'recon', label: 'Recon', color: '#4071A3', order: 1, match: ['recon'] },
  { slug: 'exploitation', label: 'Exploitation', color: '#CE4A2C', order: 2, match: ['exploitation', 'web exploitation'] },
  { slug: 'privesc', label: 'Privilege Escalation', color: '#A0559F', order: 3, match: ['privilege escalation', 'privesc'] },
  { slug: 'protocol', label: 'Protocols', color: '#3B683B', order: 4, match: ['protocol', 'protocols'] },
  { slug: 'misc', label: 'Misc', color: '#E1E6E8', order: 5, match: ['misc'] },
];
const FALLBACK_CATEGORY = 'misc';

const DIFFICULTIES = ['very easy', 'easy', 'medium', 'hard', 'insane'];
const STATUSES = ['in-progress', 'complete'];
const SOURCES = ['htb', 'ctf', 'practice'];

// A writeup is openable (a written_book you can click into) once it has this
// much real prose. Below it, the book stays a quill: hover only, nothing to
// open. Empty in-progress stubs (Nibbles today) sit below the line.
const OPENABLE_MIN_WORDS = 20;

// CTF flags to redact on publish. The vault keeps the real flag; the site
// only ever sees the shell.
const FLAG_RE = /\b(HTB|FLAG|CTF|flag)\{[^}]*\}/g;
const FLAG_REDACTION = (brand) => `${brand}{…}`;

// Canonical frontmatter key order for the emitted files.
const FM_ORDER = ['type', 'date', 'source', 'category', 'difficulty', 'status', 'tags'];

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

function argVal(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (extname(e.name) === '.md') out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Frontmatter — a minimal parser for the vault's simple YAML (scalars and
// dash-list values only). Deliberately not a full YAML engine.
// ---------------------------------------------------------------------------

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text, hasFm: false };
  const data = {};
  let key = null;
  for (const raw of m[1].split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (/^\s+-\s+/.test(line)) {
      if (key) (data[key] ||= []).push(line.replace(/^\s+-\s+/, '').trim());
      continue;
    }
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (val === '') data[key] = data[key] ?? null; // list header or empty
    else if (val.startsWith('[') && val.endsWith(']'))
      data[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    else data[key] = val;
  }
  return { data, body: text.slice(m[0].length), hasFm: true };
}

function serializeFrontmatter(data) {
  const lines = ['---'];
  for (const key of FM_ORDER) {
    if (!(key in data) || data[key] == null) continue;
    const v = data[key];
    if (Array.isArray(v)) {
      lines.push(`${key}:`);
      for (const item of v) lines.push(`  - ${item}`);
    } else {
      lines.push(`${key}: ${v}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Glossary — first meaningful line of each 20_Wiki tool note.
// ---------------------------------------------------------------------------

async function buildGlossary() {
  const glossary = {};
  const files = await walk(join(VAULT_DIR, WIKI_SUBDIR));
  for (const file of files) {
    const { data, body } = parseFrontmatter(await readFile(file, 'utf8'));
    if (data.type && data.type !== 'tool') continue;
    const term = basename(file, '.md');
    const def = firstProseLine(body);
    if (!def) continue;
    glossary[slugify(term)] = {
      term,
      definition: def,
      category: data.category || null,
    };
  }
  return glossary;
}

function firstProseLine(body) {
  for (let line of body.split('\n')) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('```')) continue;
    line = line.replace(/^[-*]\s+/, '');
    line = stripInline(line);
    if (line.length < 3) continue;
    // First sentence, capped for a tooltip.
    const sentence = line.split(/(?<=[.!?])\s/)[0];
    return (sentence.length > 160 ? sentence.slice(0, 157).trimEnd() + '…' : sentence).trim();
  }
  return null;
}

function stripInline(s) {
  return s
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1') // wikilinks -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .trim();
}

// ---------------------------------------------------------------------------
// Body cleaning: redact flags, resolve links, drop empty sections.
// ---------------------------------------------------------------------------

function redactFlags(text) {
  return text.replace(FLAG_RE, (_m, brand) => FLAG_REDACTION(brand));
}

// Resolve [[Target]] into a scheme-tagged markdown link the site switches on:
//   glossary term  -> [Gobuster](glossary:gobuster)
//   other writeup  -> [Title](writeup:slug)
//   unknown        -> plain text (recorded as a warning)
function resolveLinks(body, glossary, writeupSlugs, warn) {
  const links = [];
  // Protect fenced blocks and inline code so a [[link]] inside a code span
  // (e.g. `[[searchsploit]] wordpress 5.6.1`) is left exactly as authored.
  const code = [];
  const mask = (m) => `\x00${code.push(m) - 1}\x00`; // null sentinels never occur in markdown
  const masked = body.replace(/```[\s\S]*?```/g, mask).replace(/`[^`\n]*`/g, mask);

  const resolved = masked.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, target, alias) => {
    const label = (alias || target).trim();
    const gslug = slugify(target);
    if (glossary[gslug]) {
      links.push({ type: 'glossary', slug: gslug, label });
      return `[${label}](glossary:${gslug})`;
    }
    if (writeupSlugs.has(gslug)) {
      links.push({ type: 'writeup', slug: gslug, label });
      return `[${label}](writeup:${gslug})`;
    }
    warn(`unresolved link [[${target}]]`);
    return label;
  });

  const out = resolved.replace(/\x00(\d+)\x00/g, (_m, i) => code[Number(i)]);
  return { body: out, links };
}

// Split into sections at `## ` and drop any whose content is empty scaffolding.
function dropEmptySections(body) {
  const parts = body.split(/^(?=## )/m);
  const kept = [];
  for (const part of parts) {
    if (!part.startsWith('## ')) {
      if (part.trim()) kept.push(part.replace(/\s+$/, '') + '\n');
      continue;
    }
    if (sectionHasContent(part)) kept.push(part.replace(/\s+$/, '') + '\n');
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function sectionHasContent(section) {
  const afterHeading = section.replace(/^## .*\n?/, '');
  // Fenced code counts only if the code itself is non-empty.
  let hasCode = false;
  const withoutCode = afterHeading.replace(/```[^\n]*\n([\s\S]*?)```/g, (_m, inner) => {
    if (inner.trim()) hasCode = true;
    return '';
  });
  if (hasCode) return true;
  const leftover = withoutCode
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l !== '-' && l !== '*')
    .map((l) => l.replace(/^[-*]\s+/, '').replace(/^\*\*[^*]+\*\*$/, '')) // bare bullets / bold labels
    .join('')
    .trim();
  return /\S/.test(leftover);
}

function countWords(body) {
  const noCode = body.replace(/```[\s\S]*?```/g, ' ');
  const noHead = noCode.replace(/^#+.*$/gm, ' ');
  const noLabels = noHead.replace(/^\s*\*\*[^*]+\*\*\s*$/gm, ' ');
  const text = stripInline(noLabels.replace(/[-*]\s+/g, ' '));
  return text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
}

function excerpt(cleanBody) {
  const line = firstProseLine(cleanBody.replace(/^## .*$/gm, ''));
  return line || null;
}

// ---------------------------------------------------------------------------
// Category resolution + validation
// ---------------------------------------------------------------------------

const CAT_BY_MATCH = new Map();
for (const cat of CATEGORIES) for (const m of cat.match) CAT_BY_MATCH.set(m.toLowerCase(), cat);

function resolveCategory(raw, warn) {
  const hit = raw ? CAT_BY_MATCH.get(String(raw).toLowerCase().trim()) : null;
  if (hit) return hit;
  if (raw) warn(`unknown category "${raw}" -> ${FALLBACK_CATEGORY}`);
  return CATEGORIES.find((x) => x.slug === FALLBACK_CATEGORY);
}

function validate(data) {
  const errors = [];
  for (const key of ['type', 'date', 'source', 'category', 'difficulty', 'status'])
    if (data[key] == null) errors.push(`missing "${key}"`);
  if (!data.tags || !data.tags.length) errors.push('missing "tags"');
  if (data.date != null && !/^\d{4}-\d{2}-\d{2}$/.test(String(data.date)))
    errors.push(`date "${data.date}" is not ISO YYYY-MM-DD`);
  if (data.difficulty != null && !DIFFICULTIES.includes(data.difficulty))
    errors.push(`difficulty "${data.difficulty}" not one of ${DIFFICULTIES.join(', ')}`);
  if (data.status != null && !STATUSES.includes(data.status))
    errors.push(`status "${data.status}" not one of ${STATUSES.join(', ')}`);
  if (data.source != null && !SOURCES.includes(data.source))
    errors.push(`source "${data.source}" not one of ${SOURCES.join(', ')}`);
  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(c.bold('\nsync:writeups'));
  console.log(c.dim(`  vault  ${VAULT_DIR}`));
  console.log(c.dim(`  out    ${relative(PROJECT_DIR, OUT_DIR)}/\n`));

  if (!existsSync(VAULT_DIR)) fail(`vault not found: ${VAULT_DIR}\n  set VAULT_DIR or pass --vault <path>`);
  const writeupsRoot = join(VAULT_DIR, WRITEUPS_SUBDIR);
  if (!existsSync(writeupsRoot)) fail(`no ${WRITEUPS_SUBDIR}/ in the vault`);

  const glossary = await buildGlossary();
  const files = await walk(writeupsRoot);

  // Pass 1 — parse + validate everything before writing anything.
  const parsed = [];
  const errors = [];
  const slugs = new Set();
  for (const file of files) {
    const rel = relative(VAULT_DIR, file);
    const { data, body, hasFm } = parseFrontmatter(await readFile(file, 'utf8'));
    if (!hasFm || data.type !== 'writeup') continue; // the gate
    const title = basename(file, '.md');
    const slug = slugify(title);
    if (slugs.has(slug)) errors.push(`${rel}: duplicate slug "${slug}"`);
    slugs.add(slug);
    const errs = validate(data);
    if (errs.length) errors.push(`${rel}:\n    - ${errs.join('\n    - ')}`);
    parsed.push({ file, rel, data, body, title, slug });
  }

  if (!parsed.length) fail(`no type:writeup notes under ${WRITEUPS_SUBDIR}/`);
  if (errors.length) {
    console.log(c.red(`✗ validation failed — nothing written\n`));
    for (const e of errors) console.log('  ' + c.red(e));
    console.log('');
    process.exit(1);
  }

  // Validation passed — safe to clean and repopulate the output directory.
  await prepareOutDir();

  // Pass 2 — clean, resolve, and assemble.
  const warnings = [];
  const writeupSlugs = new Set(parsed.map((p) => p.slug));
  const glossaryUsed = new Set();
  let flagsRedacted = 0;
  const entries = [];

  for (const p of parsed) {
    const warn = (msg) => warnings.push(`${p.title}: ${msg}`);

    let body = p.body;
    const flagsBefore = (body.match(FLAG_RE) || []).length;
    body = redactFlags(body);
    flagsRedacted += flagsBefore;

    const resolved = resolveLinks(body, glossary, writeupSlugs, warn);
    body = dropEmptySections(resolved.body);
    for (const l of resolved.links) if (l.type === 'glossary') glossaryUsed.add(l.slug);

    const cat = resolveCategory(p.data.category, warn);
    const words = countWords(body);
    const sprite = p.data.status === 'in-progress' ? 'writable_book' : 'written_book';
    const openable = words >= OPENABLE_MIN_WORDS;
    const sections = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());

    // Emit the cleaned, publish-safe markdown file.
    const outData = { ...p.data };
    const outMd = serializeFrontmatter(outData) + '\n\n' + body;
    await writeFile(join(OUT_DIR, `${p.slug}.md`), outMd);

    entries.push({
      slug: p.slug,
      title: p.title,
      path: `writeups/${p.slug}.md`,
      date: p.data.date,
      source: p.data.source,
      category: p.data.category, // verbatim, for the card
      categorySlug: cat.slug, // bucket, for grouping + colour
      categoryLabel: cat.label,
      color: cat.color,
      difficulty: p.data.difficulty,
      status: p.data.status,
      tags: p.data.tags || [],
      sprite,
      openable,
      wordCount: words,
      sections,
      links: resolved.links,
      excerpt: excerpt(body),
    });
  }

  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));

  // Only the glossary terms actually referenced by a published writeup.
  const glossaryOut = {};
  for (const slug of [...glossaryUsed].sort()) glossaryOut[slug] = glossary[slug];

  const cats = CATEGORIES.map((cat) => ({
    slug: cat.slug,
    label: cat.label,
    color: cat.color,
    order: cat.order,
    count: entries.filter((e) => e.categorySlug === cat.slug).length,
  }));

  const index = {
    generated: new Date().toISOString(),
    counts: {
      writeups: entries.length,
      openable: entries.filter((e) => e.openable).length,
      inProgress: entries.filter((e) => e.status === 'in-progress').length,
      glossaryTerms: Object.keys(glossaryOut).length,
    },
    categories: cats,
    writeups: entries,
    glossary: glossaryOut,
  };
  await writeFile(join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2) + '\n');

  // Report
  console.log(c.bold('  published'));
  for (const e of entries) {
    const dot = e.status === 'in-progress' ? c.yellow('◑') : c.green('●');
    const open = e.openable ? '' : c.dim(' · quill, no page yet');
    console.log(
      `    ${dot} ${e.title}\n` +
        c.dim(`        ${e.date} · ${e.categoryLabel} · ${e.difficulty} · ${e.wordCount}w${open}`),
    );
  }
  console.log('');
  console.log(c.bold('  categories  ') + cats.map((x) => `${x.label} ${x.count}`).join(c.dim(' · ')));
  console.log(
    c.bold('  glossary    ') +
      `${index.counts.glossaryTerms} term(s) resolved` +
      c.dim(` (${[...glossaryUsed].sort().join(', ') || 'none'})`),
  );
  console.log(c.bold('  flags       ') + `${flagsRedacted} redacted`);

  if (warnings.length) {
    console.log('\n  ' + c.yellow(`${warnings.length} warning(s):`));
    for (const w of warnings) console.log('    ' + c.yellow('! ' + w));
  }

  console.log(
    '\n' +
      c.green(`✓ ${entries.length} writeups → ${relative(PROJECT_DIR, OUT_DIR)}/`) +
      c.dim('   (review with git diff, then push)\n'),
  );
}

async function prepareOutDir() {
  // Guard the destructive clean: the path must end where we expect.
  if (!OUT_DIR.replace(/\\/g, '/').endsWith('content/writeups'))
    fail(`refusing to clean unexpected out dir: ${OUT_DIR}`);
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
}

function fail(msg) {
  console.error('\n' + c.red('✗ ' + msg) + '\n');
  process.exit(1);
}

await main().catch((err) => fail(err.stack || String(err)));
