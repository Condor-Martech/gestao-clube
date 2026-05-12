import { ExternalLink } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { HELP_DOCS, buildEmbedUrl, findHelpDoc } from '@/lib/help-docs'
import { SystemDocsHub } from './_components/system-docs-hub'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return HELP_DOCS.map((doc) => ({ slug: doc.slug }))
}

export default async function AjudaDocPage({ params }: Props) {
  const { slug } = await params
  const doc = findHelpDoc(slug)
  if (!doc) notFound()

  if (doc.kind === 'internal') {
    if (doc.slug === 'sistema') return <SystemDocsHub />
    notFound()
  }

  const tItems = await getTranslations('nav.items')
  const tAjuda = await getTranslations('ajuda')
  const title = tItems(doc.labelKey)
  const embedUrl = buildEmbedUrl(doc.googleDocId)
  const externalUrl = `https://docs.google.com/document/d/${doc.googleDocId}/edit`

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{tAjuda('subtitle')}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={externalUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            {tAjuda('openExternal')}
          </a>
        </Button>
      </header>

      <div className="bg-card overflow-hidden rounded-lg border">
        <iframe
          key={doc.slug}
          src={embedUrl}
          title={title}
          className="block h-[calc(100svh-12rem)] min-h-[500px] w-full"
          loading="lazy"
        />
      </div>
    </div>
  )
}
