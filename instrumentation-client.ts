// PostHog client-side init. O Next.js executa este arquivo no browser antes
// do código da app (instrumentation-client é suportado nativamente no Next 15.3+).
//
// Se a chave não estiver configurada (ex.: dev local sem .env.local), o SDK
// não inicializa e todas as chamadas viram no-op — nada quebra.
import posthog from 'posthog-js'

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

if (key) {
  posthog.init(key, {
    // Reverse proxy montado em next.config.ts (rewrites /ingest → posthog.com).
    api_host: '/ingest',
    // ui_host aponta ao host real para que os links do toolbar/replay funcionem.
    ui_host: 'https://us.posthog.com',
    // Defaults modernos: ativa pageview por history change + pageleave automáticos.
    defaults: '2025-05-24',
    // Só cria person profiles para usuários identificados (backoffice = todos logam).
    person_profiles: 'identified_only',

    // —— Captura automática (tudo ligado) ——
    autocapture: true,
    capture_pageview: 'history_change',
    capture_pageleave: true,
    capture_performance: true, // web vitals + network performance
    capture_exceptions: true, // error tracking automático
    enable_heatmaps: true,

    // —— Session recording (full, sem masking — confirmado com o time) ——
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: false,
      maskTextSelector: undefined,
      recordCrossOriginIframes: false,
    },

    // Em dev, manda pro debug do console em vez de poluir o projeto real.
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug()
    },
  })
}

export default posthog
