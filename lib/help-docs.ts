type HelpRole = 'admin' | 'manager' | 'user'

type IconKey = 'help' | 'helpSystem'

interface HelpDocBase {
  slug: string
  labelKey: string
  iconKey: IconKey
  roles: readonly HelpRole[]
}

export interface GoogleDocHelpDoc extends HelpDocBase {
  kind: 'google-doc'
  googleDocId: string
}

export interface InternalHelpDoc extends HelpDocBase {
  kind: 'internal'
}

export type HelpDoc = GoogleDocHelpDoc | InternalHelpDoc

export const HELP_DOCS = [
  {
    kind: 'google-doc',
    slug: 'manual',
    labelKey: 'manual',
    iconKey: 'help',
    googleDocId: '1TgNMz0RiLBXO2nzLyJ_7zQq2f8dvjcuh2BFOXP3YfcY',
    roles: ['admin', 'manager', 'user'],
  },
  {
    kind: 'internal',
    slug: 'sistema',
    labelKey: 'sistema',
    iconKey: 'helpSystem',
    roles: ['admin', 'manager', 'user'],
  },
] as const satisfies readonly HelpDoc[]

export function findHelpDoc(slug: string): HelpDoc | undefined {
  return HELP_DOCS.find((doc) => doc.slug === slug)
}

export function buildEmbedUrl(googleDocId: string): string {
  return `https://docs.google.com/document/d/${googleDocId}/preview`
}
