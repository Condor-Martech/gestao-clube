import 'server-only'
import type { GoogleAuth } from 'google-auth-library'
import { StoreProviderError, type ReviewRecord } from '../types'

interface PlayReviewComment {
  userComment?: {
    text?: string
    starRating?: number
    reviewerLanguage?: string
    appVersionName?: string
    lastModified?: { seconds?: string | number }
  }
  developerComment?: { text?: string; lastModified?: { seconds?: string | number } }
}

interface PlayReviewResource {
  reviewId: string
  authorName?: string
  comments: PlayReviewComment[]
}

export interface PlayReviewsResponse {
  reviews?: PlayReviewResource[]
  tokenPagination?: { nextPageToken?: string }
}

export interface FetchReviewsOptions {
  packageName: string
  auth: GoogleAuth
  since?: Date
  limit?: number
}

export interface FetchReviewsResult {
  reviews: ReviewRecord[]
  cursor: string | null
}

export function parsePlayReviews(json: PlayReviewsResponse): ReviewRecord[] {
  const out: ReviewRecord[] = []
  for (const r of json.reviews ?? []) {
    const userComment = r.comments[0]?.userComment
    if (!userComment) continue
    const seconds = Number(userComment.lastModified?.seconds ?? 0)
    out.push({
      externalId: r.reviewId,
      rating: userComment.starRating ?? 0,
      title: null,
      body: userComment.text ?? null,
      author: r.authorName ?? null,
      lang: userComment.reviewerLanguage ?? null,
      version: userComment.appVersionName ?? null,
      createdAtStore: new Date(seconds * 1000),
    })
  }
  return out
}

export async function fetchPlayReviews(opts: FetchReviewsOptions): Promise<FetchReviewsResult> {
  const client = await opts.auth.getClient()
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${opts.packageName}/reviews`

  let response
  try {
    response = await client.request<PlayReviewsResponse>({
      url,
      params: { maxResults: Math.min(opts.limit ?? 100, 100) },
    })
  } catch (cause) {
    const e = cause as { code?: number | string; response?: { status?: number } }
    const status = typeof e.code === 'number' ? e.code : e.response?.status
    if (status === 401 || status === 403) {
      throw new StoreProviderError(
        'AUTH_FAILED',
        `Play Developer API auth failed (${status})`,
        cause,
      )
    }
    if (status === 429) {
      throw new StoreProviderError('RATE_LIMITED', 'Play Developer API rate limited', cause)
    }
    throw new StoreProviderError('UNKNOWN', 'Play Developer API request failed', cause)
  }

  const reviews = parsePlayReviews(response.data).filter((r) =>
    opts.since ? r.createdAtStore > opts.since : true,
  )
  return { reviews, cursor: reviews[0]?.externalId ?? null }
}
