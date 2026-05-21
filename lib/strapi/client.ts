import 'server-only'

export interface StrapiMedia {
  id: number
  url: string
  mime: string
  size: number
  name: string
  alternativeText: string | null
}

export type StrapiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number }

type Query = Record<string, string | number | boolean>

export interface StrapiClient {
  list<T>(collection: string, query?: Query): Promise<StrapiResult<T[]>>
  get<T>(collection: string, id: number, query?: Query): Promise<StrapiResult<T>>
  create<T>(collection: string, data: Record<string, unknown>): Promise<StrapiResult<T>>
  update<T>(collection: string, id: number, data: Record<string, unknown>): Promise<StrapiResult<T>>
  delete(collection: string, id: number): Promise<StrapiResult<void>>
  publish<T>(collection: string, id: number): Promise<StrapiResult<T>>
  unpublish<T>(collection: string, id: number): Promise<StrapiResult<T>>
  upload(file: File): Promise<StrapiResult<StrapiMedia>>
  /**
   * Reads scheduled publish/unpublish actions from `strapi-plugin-publisher`.
   * Returns raw envelope items; caller passes them through `mapPublisherAction`.
   */
  listPublisherActions<T>(filters?: {
    entitySlug?: string
    entityId?: number
  }): Promise<StrapiResult<T[]>>
}

export interface StrapiClientConfig {
  url: string
  token: string
  fetchFn?: typeof fetch
}

export function createStrapiClient(config: StrapiClientConfig): StrapiClient {
  const baseUrl = config.url.replace(/\/$/, '')
  const fetchFn: typeof fetch = config.fetchFn ?? globalThis.fetch.bind(globalThis)

  function authHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${config.token}`,
      ...(extra ?? {}),
    }
  }

  function buildUrl(path: string, query?: Query): string {
    const url = new URL(`${baseUrl}${path}`)
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        url.searchParams.append(k, String(v))
      }
    }
    return url.toString()
  }

  async function safeRequest<T>(
    request: () => Promise<Response>,
    transform: (json: unknown) => T,
  ): Promise<StrapiResult<T>> {
    try {
      const res = await request()
      if (!res.ok) {
        let message = `${res.status} ${res.statusText}`.trim()
        try {
          const body = (await res.json()) as {
            error?: string | { message?: string }
          }
          if (typeof body.error === 'string') {
            message = body.error
          } else if (
            body.error &&
            typeof body.error === 'object' &&
            typeof body.error.message === 'string'
          ) {
            message = body.error.message
          }
        } catch {
          // body wasn't JSON; keep default message
        }
        return { ok: false, error: message, status: res.status }
      }
      const json = (await res.json().catch(() => null)) as unknown
      return { ok: true, data: transform(json) }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  return {
    list<T>(collection: string, query?: Query) {
      return safeRequest<T[]>(
        () =>
          fetchFn(buildUrl(`/api/${collection}`, query), {
            method: 'GET',
            headers: authHeaders(),
          }),
        (json) => (json as { data: T[] }).data,
      )
    },

    get<T>(collection: string, id: number, query?: Query) {
      return safeRequest<T>(
        () =>
          fetchFn(buildUrl(`/api/${collection}/${id}`, query), {
            method: 'GET',
            headers: authHeaders(),
          }),
        (json) => (json as { data: T }).data,
      )
    },

    create<T>(collection: string, data: Record<string, unknown>) {
      return safeRequest<T>(
        () =>
          fetchFn(buildUrl(`/api/${collection}`), {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ data }),
          }),
        (json) => (json as { data: T }).data,
      )
    },

    update<T>(collection: string, id: number, data: Record<string, unknown>) {
      return safeRequest<T>(
        () =>
          fetchFn(buildUrl(`/api/${collection}/${id}`), {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ data }),
          }),
        (json) => (json as { data: T }).data,
      )
    },

    delete(collection: string, id: number) {
      return safeRequest<void>(
        () =>
          fetchFn(buildUrl(`/api/${collection}/${id}`), {
            method: 'DELETE',
            headers: authHeaders(),
          }),
        () => undefined,
      )
    },

    async publish<T>(collection: string, id: number) {
      const v5 = await safeRequest<T>(
        () =>
          fetchFn(buildUrl(`/api/${collection}/${id}/actions/publish`), {
            method: 'POST',
            headers: authHeaders(),
          }),
        (json) => (json as { data: T }).data,
      )
      if (v5.ok || v5.status !== 404) return v5

      // v4 fallback: PUT with publishedAt = now()
      return safeRequest<T>(
        () =>
          fetchFn(buildUrl(`/api/${collection}/${id}`), {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              data: { publishedAt: new Date().toISOString() },
            }),
          }),
        (json) => (json as { data: T }).data,
      )
    },

    async unpublish<T>(collection: string, id: number) {
      const v5 = await safeRequest<T>(
        () =>
          fetchFn(buildUrl(`/api/${collection}/${id}/actions/unpublish`), {
            method: 'POST',
            headers: authHeaders(),
          }),
        (json) => (json as { data: T }).data,
      )
      if (v5.ok || v5.status !== 404) return v5

      // v4 fallback: PUT with publishedAt = null
      return safeRequest<T>(
        () =>
          fetchFn(buildUrl(`/api/${collection}/${id}`), {
            method: 'PUT',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ data: { publishedAt: null } }),
          }),
        (json) => (json as { data: T }).data,
      )
    },

    listPublisherActions<T>(filters?: { entitySlug?: string; entityId?: number }) {
      const query: Query = { 'pagination[pageSize]': 200 }
      if (filters?.entitySlug) {
        query['filters[entitySlug][$eq]'] = filters.entitySlug
      }
      if (filters?.entityId !== undefined) {
        query['filters[entityId][$eq]'] = filters.entityId
      }
      return safeRequest<T[]>(
        () =>
          fetchFn(buildUrl(`/api/publisher/actions`, query), {
            method: 'GET',
            headers: authHeaders(),
          }),
        (json) => (json as { data: T[] }).data,
      )
    },

    upload(file) {
      const fd = new FormData()
      fd.append('files', file, file.name)

      return safeRequest(
        () =>
          fetchFn(buildUrl(`/api/upload`), {
            method: 'POST',
            headers: authHeaders(), // no Content-Type for FormData
            body: fd,
          }),
        (json) => {
          const arr = json as Array<{
            id: number
            url: string
            mime: string
            size: number
            name: string
            alternativeText?: string | null
          }>
          if (!Array.isArray(arr) || arr.length === 0) {
            throw new Error('Empty upload response')
          }
          const first = arr[0]!
          const url = first.url.startsWith('http') ? first.url : `${baseUrl}${first.url}`
          return {
            id: first.id,
            url,
            mime: first.mime,
            size: first.size,
            name: first.name,
            alternativeText: first.alternativeText ?? null,
          }
        },
      )
    },
  }
}
