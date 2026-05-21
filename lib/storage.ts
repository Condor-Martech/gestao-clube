import 'server-only'
import { createClient } from '@/lib/supabase/server'

export const PRODUTO_BUCKET = 'produto-images'
export const BANNER_BUCKET = 'banner-assets'

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export interface UploadResult {
  ok: boolean
  url?: string
  error?: string
}

async function uploadToBucket(bucket: string, path: string, file: File): Promise<UploadResult> {
  if (!ALLOWED_MIME.includes(file.type)) {
    return { ok: false, error: 'Apenas PNG, JPG ou WEBP' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Arquivo muito grande (máx 5MB)' }
  }

  const supabase = await createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (error) return { ok: false, error: error.message }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
  return { ok: true, url: pub.publicUrl }
}

export async function uploadProdutoImage(produtoId: string, file: File): Promise<UploadResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  return uploadToBucket(PRODUTO_BUCKET, `${produtoId}/${Date.now()}.${ext}`, file)
}

export async function uploadBannerAsset(bannerId: string, file: File): Promise<UploadResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  return uploadToBucket(BANNER_BUCKET, `${bannerId}/${Date.now()}.${ext}`, file)
}
