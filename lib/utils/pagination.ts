export const DEFAULT_PAGE_SIZE = 20

export interface PageParams {
  page: number
  pageSize: number
}

export function parsePage(value: string | undefined, fallback = 1): number {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function rangeFromPage({ page, pageSize }: PageParams) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to }
}

export function totalPages(count: number, pageSize: number) {
  return Math.max(1, Math.ceil(count / pageSize))
}
