import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const usingServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Env check:')
console.log('  URL:', url ?? 'MISSING')
console.log('  Key:', usingServiceRole ? 'service_role (bypasses RLS)' : 'publishable/anon (subject to RLS)')

if (!url || !key) {
  console.error('\nMissing URL or any usable key in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const section = (label) => console.log(`\n=== ${label} ===`)
const print = (data) => console.log(JSON.stringify(data, null, 2))

async function inspect(table) {
  const sample = await supabase.from(table).select('*').limit(1).maybeSingle()
  const total = await supabase.from(table).select('*', { count: 'exact', head: true })
  return {
    columns: sample.data ? Object.keys(sample.data) : null,
    sampleRow: sample.data,
    sampleError: sample.error?.message ?? null,
    totalCount: total.count,
    totalError: total.error?.message ?? null,
  }
}

section('campanhas')
print(await inspect('campanhas'))

section('campanhas — process breakdown')
{
  const t = await supabase.from('campanhas').select('id', { count: 'exact', head: true })
  const tt = await supabase.from('campanhas').select('id', { count: 'exact', head: true }).eq('process', true)
  const tf = await supabase.from('campanhas').select('id', { count: 'exact', head: true }).eq('process', false)
  print({
    total: t.count,
    processTrue: tt.count,
    processFalse: tf.count,
    processNull: (t.count ?? 0) - (tt.count ?? 0) - (tf.count ?? 0),
    errors: { total: t.error?.message, processTrue: tt.error?.message, processFalse: tf.error?.message },
  })
}

section('campanhas — dsc_situacao distribution (first 2000 rows)')
const sitRes = await supabase.from('campanhas').select('dsc_situacao').limit(2000)
if (sitRes.error) print({ error: sitRes.error.message })
else {
  const counts = (sitRes.data ?? []).reduce((acc, r) => {
    const k = r.dsc_situacao ?? '(null)'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
  print(counts)
}

section('Agrupamentos (capital A)')
print(await inspect('Agrupamentos'))

section('agrupamentos (lowercase, alt)')
print(await inspect('agrupamentos'))

section('Produtos — column population analysis (sync candidates)')
{
  const TABLE = 'Produtos'
  const total = await supabase.from(TABLE).select('id', { count: 'exact', head: true })
  const aproved = await supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('aproved', true)
  const imgInternal = await supabase.from(TABLE).select('id', { count: 'exact', head: true }).not('img_internal', 'is', null)
  const host = await supabase.from(TABLE).select('id', { count: 'exact', head: true }).not('host', 'is', null)
  const price = await supabase.from(TABLE).select('id', { count: 'exact', head: true }).not('price', 'is', null)

  // Combinations: aproved AND <col> NOT NULL
  const aprovedAndImg = await supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('aproved', true).not('img_internal', 'is', null)
  const aprovedAndHost = await supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('aproved', true).not('host', 'is', null)
  const aprovedAndPrice = await supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('aproved', true).not('price', 'is', null)

  print({
    total: total.count,
    aproved: aproved.count,
    'img_internal NOT NULL': imgInternal.count,
    'host NOT NULL': host.count,
    'price NOT NULL': price.count,
    'aproved AND img_internal NOT NULL': aprovedAndImg.count,
    'aproved AND host NOT NULL': aprovedAndHost.count,
    'aproved AND price NOT NULL': aprovedAndPrice.count,
  })
}

section('Produtos — distinct campanhas by sync criteria')
{
  const TABLE = 'Produtos'
  // Get distinct campanha values for each criterion
  const fetchDistinctCampanhas = async (modify) => {
    let q = supabase.from(TABLE).select('campanha').not('campanha', 'is', null)
    q = modify(q)
    // page through up to 5000 rows
    const all = []
    let from = 0
    const pageSize = 1000
    while (from < 5000) {
      const { data, error } = await q.range(from, from + pageSize - 1)
      if (error) return { error: error.message }
      if (!data || data.length === 0) break
      all.push(...data)
      if (data.length < pageSize) break
      from += pageSize
    }
    const distinct = new Set(all.map(r => r.campanha))
    return { rowsScanned: all.length, distinctCampanhas: distinct.size }
  }

  print({
    'aproved = true': await fetchDistinctCampanhas(q => q.eq('aproved', true)),
    'aproved AND img_internal NOT NULL': await fetchDistinctCampanhas(q => q.eq('aproved', true).not('img_internal', 'is', null)),
    'aproved AND host NOT NULL': await fetchDistinctCampanhas(q => q.eq('aproved', true).not('host', 'is', null)),
    'aproved AND price NOT NULL': await fetchDistinctCampanhas(q => q.eq('aproved', true).not('price', 'is', null)),
    'img_internal NOT NULL (sync only, no aproved)': await fetchDistinctCampanhas(q => q.not('img_internal', 'is', null)),
  })
}

section('logs_with_users — sample')
print(await inspect('logs_with_users'))

section('Lojas')
print(await inspect('Lojas'))
