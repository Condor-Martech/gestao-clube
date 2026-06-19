'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

interface Props {
  userId: string
  email: string
  role: string
  isAdmin: boolean
}

/**
 * Identifica o usuário logado no PostHog. Renderizado pelo dashboard layout, que
 * já resolve a sessão (requireSession). Liga eventos anônimos ao userId real e
 * popula as person properties para segmentação.
 */
export function PostHogIdentify({ userId, email, role, isAdmin }: Props) {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog || !userId) return
    posthog.identify(userId, {
      email,
      role,
      is_admin: isAdmin,
    })
  }, [posthog, userId, email, role, isAdmin])

  return null
}
