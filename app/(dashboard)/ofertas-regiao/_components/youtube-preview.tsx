'use client'

import Image from 'next/image'

function parseYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m =
    url.match(/youtu\.be\/([\w-]+)/) ||
    url.match(/youtube\.com\/watch\?v=([\w-]+)/) ||
    url.match(/youtube\.com\/embed\/([\w-]+)/)
  return m?.[1] ?? null
}

interface Props {
  url: string | null | undefined
}

export function YoutubePreview({ url }: Props) {
  const id = parseYoutubeId(url)
  if (!id) return null

  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`

  return (
    <a
      href={`https://www.youtube.com/watch?v=${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="border-border block w-full max-w-xs overflow-hidden rounded-md border"
    >
      <div className="bg-muted relative aspect-video w-full">
        <Image src={thumb} alt="" fill sizes="320px" className="object-cover" unoptimized />
      </div>
    </a>
  )
}
