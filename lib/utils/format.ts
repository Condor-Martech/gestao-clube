import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(value: string | Date, pattern = 'dd/MM/yyyy') {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, pattern, { locale: ptBR })
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, 'dd/MM/yyyy HH:mm')
}

export function formatRelative(value: string | Date) {
  const date = typeof value === 'string' ? parseISO(value) : value
  return formatDistanceToNow(date, { locale: ptBR, addSuffix: true })
}

export function toIsoDate(value: Date | string): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'yyyy-MM-dd')
}

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return brlFormatter.format(value)
}
