// A small markdown parser for exactly the subset scripts/sync-writeups.mjs
// emits: ## headings, - bullet lists, fenced code, `inline code`, **bold**,
// `-->` result lines, and scheme links [label](glossary:slug) /
// [label](writeup:slug). Not a general markdown engine — it only has to handle
// what the sync produces, which is why it can stay this small and testable.

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'link'; label: string; scheme: 'glossary' | 'writeup' | 'external'; target: string }

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'label'; text: string }
  | { type: 'result'; inline: Inline[] }
  | { type: 'paragraph'; inline: Inline[] }
  | { type: 'list'; items: Inline[][] }
  | { type: 'code'; lang: string; code: string }

const LINK_RE = /\[([^\]]+)\]\((glossary|writeup):([^)]+)\)|\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  // Split on the atomic spans first (code, links, strong), keeping order.
  const TOKEN = /(`[^`]+`)|(\[[^\]]+\]\((?:glossary|writeup):[^)]+\))|(\[[^\]]+\]\(https?:\/\/[^)]+\))|(\*\*[^*]+\*\*)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) })
    const tok = m[0]
    if (tok.startsWith('`')) {
      out.push({ kind: 'code', text: tok.slice(1, -1) })
    } else if (tok.startsWith('**')) {
      out.push({ kind: 'strong', text: tok.slice(2, -2) })
    } else {
      LINK_RE.lastIndex = 0
      const lm = LINK_RE.exec(tok)!
      if (lm[1]) out.push({ kind: 'link', label: lm[1], scheme: lm[2] as 'glossary' | 'writeup', target: lm[3] })
      else out.push({ kind: 'link', label: lm[4], scheme: 'external', target: lm[5] })
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out.filter((t) => !(t.kind === 'text' && t.text === ''))
}

export function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') {
      i++
      continue
    }
    // fenced code
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      const lang = fence[1] || ''
      const body: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++])
      i++ // closing fence
      blocks.push({ type: 'code', lang, code: body.join('\n') })
      continue
    }
    // heading
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', text: line.slice(3).trim() })
      i++
      continue
    }
    // bare bold label on its own line
    const label = line.trim().match(/^\*\*([^*]+)\*\*$/)
    if (label) {
      blocks.push({ type: 'label', text: label[1].trim() })
      i++
      continue
    }
    // result line
    if (line.trim().startsWith('-->')) {
      blocks.push({ type: 'result', inline: parseInline(line.trim().replace(/^-->\s*/, '')) })
      i++
      continue
    }
    // list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: Inline[][] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^\s*[-*]\s+/, '').trim()))
        i++
      }
      blocks.push({ type: 'list', items })
      continue
    }
    // paragraph — gather until blank / structural line
    const para: string[] = [line.trim()]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('## ') &&
      !lines[i].startsWith('```') &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('-->')
    ) {
      para.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'paragraph', inline: parseInline(para.join(' ')) })
  }
  return blocks
}
