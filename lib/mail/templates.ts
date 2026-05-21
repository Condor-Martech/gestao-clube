export interface EmailContent {
  subject: string
  html: string
  text: string
}

interface LayoutInput {
  heading: string
  intro: string
  ctaLabel: string
  ctaUrl: string
  expiry: string
  outro: string
}

/**
 * Table-based, inline-styled HTML layout — the only thing email clients
 * (Outlook included) render reliably. Do not refactor to flexbox/grid.
 */
function layout({ heading, intro, ctaLabel, ctaUrl, expiry, outro }: LayoutInput): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#0f172a;padding:28px 32px;">
                <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">Clube Condor</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;color:#0f172a;font-size:20px;font-weight:700;">${heading}</h1>
                <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">${intro}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border-radius:8px;background-color:#0f172a;">
                      <a href="${ctaUrl}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${ctaLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.6;">${expiry}</p>
                <p style="margin:0 0 6px;color:#94a3b8;font-size:13px;line-height:1.6;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
                <p style="margin:0;word-break:break-all;"><a href="${ctaUrl}" style="color:#0f172a;font-size:13px;">${ctaUrl}</a></p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
                <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">${outro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">© Clube Condor — Email automático, por favor não responda.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/** Email sent when an admin invites a new user to the platform. */
export function inviteEmail({ actionUrl }: { actionUrl: string }): EmailContent {
  const heading = 'Você foi convidado'
  const intro =
    'Você recebeu acesso ao painel de gestão do Clube Condor. Para ativar sua conta, defina uma senha de acesso.'
  const expiry = 'Este convite é válido por tempo limitado.'
  const outro = 'Se você não esperava este convite, pode ignorar este email com segurança.'

  return {
    subject: 'Você foi convidado para o Clube Condor',
    html: layout({
      heading,
      intro,
      ctaLabel: 'Definir minha senha',
      ctaUrl: actionUrl,
      expiry,
      outro,
    }),
    text: `${heading}\n\n${intro}\n\nDefina sua senha: ${actionUrl}\n\n${expiry}\n${outro}`,
  }
}

/** Email sent when a user requests a password reset. */
export function recoveryEmail({ actionUrl }: { actionUrl: string }): EmailContent {
  const heading = 'Redefinir sua senha'
  const intro =
    'Recebemos um pedido para redefinir a senha da sua conta no Clube Condor. Clique no botão abaixo para escolher uma nova senha.'
  const expiry = 'Este link é válido por tempo limitado.'
  const outro =
    'Se você não solicitou esta alteração, ignore este email — sua senha atual continua válida.'

  return {
    subject: 'Redefinição de senha — Clube Condor',
    html: layout({ heading, intro, ctaLabel: 'Redefinir senha', ctaUrl: actionUrl, expiry, outro }),
    text: `${heading}\n\n${intro}\n\nRedefina sua senha: ${actionUrl}\n\n${expiry}\n${outro}`,
  }
}
