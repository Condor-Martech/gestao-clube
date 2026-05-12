'use client'

import { useMemo } from 'react'

interface Props {
  data: unknown
  className?: string
}

type Token =
  | { type: 'punct' | 'key' | 'string' | 'number' | 'boolean' | 'null'; value: string }
  | { type: 'plain'; value: string }

const TOKEN_REGEX =
  /"((?:\\.|[^"\\])*)"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],]/g

function tokenize(json: string): Token[] {
  const tokens: Token[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = TOKEN_REGEX.exec(json)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'plain', value: json.slice(lastIndex, match.index) })
    }
    const [raw, , colon, keyword] = match
    if (raw.startsWith('"')) {
      tokens.push({ type: colon ? 'key' : 'string', value: raw })
      if (colon) tokens.push({ type: 'punct', value: colon })
    } else if (keyword === 'true' || keyword === 'false') {
      tokens.push({ type: 'boolean', value: raw })
    } else if (keyword === 'null') {
      tokens.push({ type: 'null', value: raw })
    } else if (/^-?\d/.test(raw)) {
      tokens.push({ type: 'number', value: raw })
    } else {
      tokens.push({ type: 'punct', value: raw })
    }
    lastIndex = TOKEN_REGEX.lastIndex
  }
  if (lastIndex < json.length) {
    tokens.push({ type: 'plain', value: json.slice(lastIndex) })
  }
  return tokens
}

const COLOR: Record<Token['type'], string> = {
  key: 'text-sky-600 dark:text-sky-400',
  string: 'text-emerald-600 dark:text-emerald-400',
  number: 'text-amber-600 dark:text-amber-400',
  boolean: 'text-fuchsia-600 dark:text-fuchsia-400',
  null: 'text-rose-600 dark:text-rose-400',
  punct: 'text-muted-foreground',
  plain: '',
}

export function JsonHighlight({ data, className }: Props) {
  const tokens = useMemo(() => {
    const json = JSON.stringify(data, null, 2) ?? 'null'
    return tokenize(json)
  }, [data])

  return (
    <pre
      className={
        'bg-muted/40 border-border overflow-auto rounded-md border p-4 font-mono text-xs leading-relaxed ' +
        (className ?? '')
      }
    >
      {tokens.map((tok, i) => (
        <span key={i} className={COLOR[tok.type]}>
          {tok.value}
        </span>
      ))}
    </pre>
  )
}
