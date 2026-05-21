import { GoogleAuth } from 'google-auth-library'

const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
if (!raw) {
  console.error(
    '❌ GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not set. Run with: node --env-file=.env.local scripts/test-gcs-bucket.mjs',
  )
  process.exit(1)
}

const BUCKET = 'pubsite_prod_rev_10893612770768821136'
const PREFIX = 'stats/installs/'

let credentials
try {
  credentials = JSON.parse(raw)
} catch (e) {
  console.error('❌ Invalid JSON in GOOGLE_PLAY_SERVICE_ACCOUNT_JSON:', e.message)
  process.exit(1)
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('SA email:    ', credentials.client_email)
console.log('GCP project: ', credentials.project_id)
console.log('Bucket:      ', BUCKET)
console.log('Prefix:      ', PREFIX)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const auth = new GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/devstorage.read_only'],
})

try {
  const client = await auth.getClient()
  const url = `https://storage.googleapis.com/storage/v1/b/${BUCKET}/o?prefix=${encodeURIComponent(PREFIX)}&maxResults=10`
  const { data } = await client.request({ url })

  if (!data.items || data.items.length === 0) {
    console.log('⚠️  Bucket accesible pero NO hay archivos bajo stats/installs/')
    console.log('    Posible: tu app es muy nueva y todavía no se generaron CSVs.')
    process.exit(0)
  }

  console.log(`✅ SUCCESS — la SA puede leer el bucket. Encontré ${data.items.length} archivos:\n`)
  data.items.forEach((item) => console.log('  📄', item.name))
  console.log('\n🚀 Estamos listos para implementar el GCS provider.')
} catch (e) {
  const status = e.response?.status ?? e.code
  console.log('❌ ERROR — la SA NO puede leer el bucket\n')
  console.log('  Status:  ', status)
  console.log('  Message: ', e.message)
  if (e.response?.data) {
    const body =
      typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data)
    console.log('  Body:    ', body.slice(0, 500))
  }
  console.log('\n💡 Diagnóstico:')
  if (status === 403) {
    console.log('  → SA autenticó OK, pero NO tiene permiso de lectura sobre el bucket.')
    console.log('  → FIX: hay que darle "Storage Object Viewer" rol en el bucket.')
    console.log('  → Camino: GCP Console → Storage → bucket → Permissions → Grant access')
  } else if (status === 404) {
    console.log('  → El bucket NO existe o el nombre está mal.')
    console.log('  → Verificá el ID en Play Console → Download reports')
  } else if (status === 401) {
    console.log('  → Autenticación falló. JSON de la SA mal formateado o key revocada.')
  } else {
    console.log('  → Error inesperado. Pegame el output completo.')
  }
  process.exit(1)
}
