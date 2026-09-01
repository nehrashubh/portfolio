import { describe, it, expect } from 'vitest'
import { parseBlocks, parseInline } from './markdown'

describe('parseInline', () => {
  it('splits code, strong, and scheme links in order', () => {
    const out = parseInline('use `curl` then [Gobuster](glossary:gobuster) and **verify**')
    expect(out).toEqual([
      { kind: 'text', text: 'use ' },
      { kind: 'code', text: 'curl' },
      { kind: 'text', text: ' then ' },
      { kind: 'link', label: 'Gobuster', scheme: 'glossary', target: 'gobuster' },
      { kind: 'text', text: ' and ' },
      { kind: 'strong', text: 'verify' },
    ])
  })

  it('parses external links', () => {
    const out = parseInline('see [docs](https://example.com/x)')
    expect(out[1]).toEqual({ kind: 'link', label: 'docs', scheme: 'external', target: 'https://example.com/x' })
  })

  it('leaves a wikilink left inside code untouched', () => {
    const out = parseInline('`[[searchsploit]] wordpress 5.6.1`')
    expect(out).toEqual([{ kind: 'code', text: '[[searchsploit]] wordpress 5.6.1' }])
  })
})

describe('parseBlocks', () => {
  it('parses the section shapes the sync emits', () => {
    const md = [
      '## Recon',
      '',
      '- [whatweb](glossary:whatweb) found wordpress',
      '- ran a scan',
      '',
      '## Exploitation',
      '',
      '```bash',
      'curl -i http://x/api',
      '```',
      '',
      '--> `{"ok":true}`',
      '',
      '## Lessons Learned',
      '',
      '**New tricks**',
      '',
      '- learnt curl',
    ].join('\n')
    const blocks = parseBlocks(md)
    const types = blocks.map((b) => b.type)
    expect(types).toEqual(['heading', 'list', 'heading', 'code', 'result', 'heading', 'label', 'list'])

    const code = blocks.find((b) => b.type === 'code')
    expect(code).toMatchObject({ lang: 'bash', code: 'curl -i http://x/api' })

    const firstList = blocks[1]
    if (firstList.type !== 'list') throw new Error('expected list')
    expect(firstList.items[0][0]).toEqual({ kind: 'link', label: 'whatweb', scheme: 'glossary', target: 'whatweb' })
  })

  it('keeps an empty code fence as an empty code block', () => {
    const blocks = parseBlocks('```bash\n```')
    expect(blocks).toEqual([{ type: 'code', lang: 'bash', code: '' }])
  })
})
