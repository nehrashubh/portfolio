import { Fragment, useState } from 'react'
import { parseBlocks, type Inline } from '../lib/markdown'

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard blocked (e.g. insecure context) — selection still works */
    }
  }
  return (
    <div className="codeblock">
      <div className="codeblock__bar">
        <span className="codeblock__lang">{lang || 'code'}</span>
        <button
          type="button"
          className="codeblock__copy"
          data-copied={copied || undefined}
          onClick={copy}
          aria-label="Copy code to clipboard"
        >
          {copied ? 'copied ✓' : 'copy'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

interface Props {
  markdown: string
  onGlossHover: (slug: string | null, rect: DOMRect | null) => void
  onOpenWriteup: (slug: string) => void
}

function Inlines({
  parts,
  onGlossHover,
  onOpenWriteup,
}: {
  parts: Inline[]
  onGlossHover: Props['onGlossHover']
  onOpenWriteup: Props['onOpenWriteup']
}) {
  return (
    <>
      {parts.map((p, i) => {
        switch (p.kind) {
          case 'text':
            return <Fragment key={i}>{p.text}</Fragment>
          case 'code':
            return <code key={i}>{p.text}</code>
          case 'strong':
            return <strong key={i}>{p.text}</strong>
          case 'link':
            if (p.scheme === 'glossary')
              return (
                <button
                  key={i}
                  type="button"
                  className="gloss"
                  onMouseEnter={(e) => onGlossHover(p.target, e.currentTarget.getBoundingClientRect())}
                  onMouseLeave={() => onGlossHover(null, null)}
                  onFocus={(e) => onGlossHover(p.target, e.currentTarget.getBoundingClientRect())}
                  onBlur={() => onGlossHover(null, null)}
                >
                  {p.label}
                </button>
              )
            if (p.scheme === 'writeup')
              return (
                <button key={i} type="button" className="xref" onClick={() => onOpenWriteup(p.target)}>
                  {p.label}
                </button>
              )
            return (
              <a key={i} href={p.target} target="_blank" rel="noreferrer">
                {p.label}
              </a>
            )
        }
      })}
    </>
  )
}

export default function Markdown({ markdown, onGlossHover, onOpenWriteup }: Props) {
  const blocks = parseBlocks(markdown)
  return (
    <div className="md">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return <h3 key={i}>{b.text}</h3>
          case 'label':
            return (
              <p key={i} className="md__label">
                {b.text}
              </p>
            )
          case 'result':
            return (
              <p key={i} className="md__result">
                <Inlines parts={b.inline} onGlossHover={onGlossHover} onOpenWriteup={onOpenWriteup} />
              </p>
            )
          case 'paragraph':
            return (
              <p key={i}>
                <Inlines parts={b.inline} onGlossHover={onGlossHover} onOpenWriteup={onOpenWriteup} />
              </p>
            )
          case 'list':
            return (
              <ul key={i}>
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Inlines parts={item} onGlossHover={onGlossHover} onOpenWriteup={onOpenWriteup} />
                  </li>
                ))}
              </ul>
            )
          case 'code':
            return <CodeBlock key={i} code={b.code} lang={b.lang} />
        }
      })}
    </div>
  )
}
