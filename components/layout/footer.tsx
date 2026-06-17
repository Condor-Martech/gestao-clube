import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export async function Footer() {
  const t = await getTranslations('app')

  return (
    <footer className="text-muted-foreground flex shrink-0 items-center justify-center gap-2 px-4 py-3 text-xs">
      <span>{t('developedBy')}</span>
      <Image
        src="https://s3.cndr.me/solucoes-digitais/logo/PNG/logo_sd_b.png"
        alt="Soluções Digitais"
        width={90}
        height={20}
        className="h-5 w-auto opacity-80 dark:invert"
        unoptimized
      />
    </footer>
  )
}
