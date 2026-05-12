import { getRequestConfig } from 'next-intl/server'

const DEFAULT_LOCALE = 'pt-BR'

export default getRequestConfig(async () => {
  return {
    locale: DEFAULT_LOCALE,
    messages: (await import('../messages/pt-BR.json')).default,
  }
})
