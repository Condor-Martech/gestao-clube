import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResetPasswordForm } from './_components/reset-password-form'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const t = await getTranslations('auth')
  const { welcome } = await searchParams
  const isWelcome = welcome === '1'

  // /auth/confirm establishes the session before redirecting here. No session
  // means the link was invalid, expired, or the page was opened directly.
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const hasSession = Boolean(data?.claims)

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">
          {isWelcome ? t('welcomeTitle') : t('resetTitle')}
        </CardTitle>
        <CardDescription>
          {!hasSession
            ? t('resetLinkInvalid')
            : isWelcome
              ? t('welcomeDescription')
              : t('resetDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSession ? (
          <ResetPasswordForm welcome={isWelcome} />
        ) : (
          <p className="text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              {t('requestNewLink')}
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
