import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import type { Tabloide } from '@/types/entities'
import { DeleteTabloideButton } from './delete-tabloide-button'

interface Props {
  tabloide: Tabloide
  canDelete?: boolean
}

export async function TabloideCard({ tabloide, canDelete = false }: Props) {
  const t = await getTranslations('tabloides')

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="bg-muted relative aspect-[3/4]">
        {canDelete && <DeleteTabloideButton tabloide={tabloide} />}
        {tabloide.coverLink ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tabloide.coverLink}
            alt={tabloide.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-xs">
            {t('noCover')}
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold">{tabloide.name}</p>
        <p className="text-muted-foreground text-xs">{tabloide.regiao ?? t('noRegiao')}</p>
      </div>
    </Card>
  )
}
