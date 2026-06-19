'use client'

import { useEffect, useRef } from 'react'
import { usePostHog } from 'posthog-js/react'
import { OFERTAS_EVENTS } from '@/lib/posthog/events'

interface Props {
  campanhas: number | null
  produtos: number | null
  produtosAprovados: number | null
  agrupamentos: number | null
  produtosPorCampanhaAmostra: boolean
}

/**
 * Dispara `ofertas_dashboard_viewed` uma vez por montagem, com os KPIs como
 * propriedades. Renderizado pelo Server Component da página (que já computa os
 * valores) — assim evitamos recomputar no cliente.
 */
export function DashboardViewTracker(props: Props) {
  const posthog = usePostHog()
  const sent = useRef(false)

  useEffect(() => {
    if (!posthog || sent.current) return
    sent.current = true
    posthog.capture(OFERTAS_EVENTS.dashboardViewed, {
      campanhas: props.campanhas,
      produtos: props.produtos,
      produtos_aprovados: props.produtosAprovados,
      agrupamentos: props.agrupamentos,
      produtos_por_campanha_amostra: props.produtosPorCampanhaAmostra,
    })
  }, [posthog, props])

  return null
}
