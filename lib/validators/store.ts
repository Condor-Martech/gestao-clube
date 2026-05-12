import { z } from 'zod'

export const StoreSchema = z.enum(['play', 'app_store'])
export type StoreInput = z.infer<typeof StoreSchema>

export const SyncStoresInputSchema = z.object({
  appId: z.string().uuid(),
  store: StoreSchema.optional(),
  force: z.boolean().default(false),
})
export type SyncStoresInput = z.infer<typeof SyncStoresInputSchema>

export const ReviewFilterSchema = z.object({
  appId: z.string().uuid(),
  store: StoreSchema.optional(),
  ratings: z.array(z.number().int().min(1).max(5)).optional(),
  sentiments: z.array(z.enum(['pos', 'neu', 'neg'])).optional(),
  topics: z.array(z.string()).optional(),
  version: z.string().optional(),
  lang: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})
export type ReviewFilter = z.infer<typeof ReviewFilterSchema>

export const GenerateReplyInputSchema = z.object({
  reviewId: z.string().uuid(),
})
export type GenerateReplyInput = z.infer<typeof GenerateReplyInputSchema>
