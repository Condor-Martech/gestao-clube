import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ForgotPasswordForm } from './_components/forgot-password-form'

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth')

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">{t('forgotTitle')}</CardTitle>
        <CardDescription>{t('forgotDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForgotPasswordForm />
        <p className="text-center text-sm">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            {t('backToLogin')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
