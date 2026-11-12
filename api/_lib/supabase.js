// Supabase backend: page text + publish history in the `site_versions` table,
// uploaded photos in the public `media` Storage bucket.
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-side only — never
// put the service role key in a VITE_ variable). Run supabase/setup.sql once first.
// Talks to Supabase's REST API with fetch, so no extra package is needed.

const BUCKET = () => process.env.SUPABASE_BUCKET || 'media'

export function supabase() {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '')
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim()
  return url && key ? { url, key } : null
}

async function sb(c, pathPart, { method = 'GET', headers = {}, body } = {}) {
  const r = await fetch(`${c.url}${pathPart}`, {
    method,
    // New-style keys (sb_secret_…) aren't JWTs: send them as `apikey` only.
    // Legacy service_role keys (eyJ…) also go in the Authorization header.
    headers: { apikey: c.key, ...(c.key.startsWith('eyJ') ? { Authorization: `Bearer ${c.key}` } : {}), ...headers },
    body,
  })
  const text = await r.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!r.ok) {
    const msg = data?.message || data?.error || data?.msg || r.status
    let hint = ''
    if (/relation .* does not exist|site_versions/i.test(String(msg))) hint = ' Run supabase/setup.sql in the Supabase SQL Editor first.'
    if (r.status === 401 || /invalid.*(jwt|key)/i.test(String(msg))) hint = ' Check SUPABASE_SERVICE_ROLE_KEY.'
    throw Object.assign(new Error(`Supabase: ${msg}.${hint}`), { status: r.status === 404 ? 404 : 502 })
  }
  return data
}

/* ------------------------------------------------------------ content */

export async function sbGetContent(c) {
  const rows = await sb(c, '/rest/v1/site_versions?select=content&order=id.desc&limit=1')
  return rows?.[0]?.content ?? null
}

export async function sbSaveContent(c, doc, keep) {
  const rows = await sb(c, '/rest/v1/site_versions?select=id,saved_at', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ content: doc }),
  })
  const row = rows[0]
  // keep the newest `keep` versions
  await sb(c, `/rest/v1/site_versions?id=lte.${row.id - keep}`, { method: 'DELETE' }).catch((e) => console.error('history prune failed', e))
  return { savedAt: new Date(row.saved_at).toISOString() }
}

export async function sbListHistory(c, keep) {
  const rows = await sb(c, `/rest/v1/site_versions?select=id,saved_at&order=id.desc&limit=${keep}`)
  return rows.map((r) => ({ id: String(r.id), savedAt: new Date(r.saved_at).toISOString() }))
}

export async function sbGetVersion(c, id) {
  if (!/^\d+$/.test(id || '')) throw Object.assign(new Error('Unknown version'), { status: 404 })
  const rows = await sb(c, `/rest/v1/site_versions?select=content&id=eq.${id}`)
  if (!rows?.length) throw Object.assign(new Error('Unknown version'), { status: 404 })
  return rows[0].content
}

/* -------------------------------------------------------------- media */

const publicUrl = (c, name) => `${c.url}/storage/v1/object/public/${BUCKET()}/${encodeURIComponent(name)}`

export async function sbListMedia(c) {
  const out = []
  for (let offset = 0; ; offset += 1000) {
    const page = await sb(c, `/storage/v1/object/list/${BUCKET()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 1000, offset, sortBy: { column: 'created_at', order: 'desc' } }),
    })
    out.push(...page.filter((f) => f.id)) // folders have no id
    if (page.length < 1000) break
  }
  return out.map((f) => ({
    url: publicUrl(c, f.name),
    name: f.name,
    size: f.metadata?.size ?? 0,
    uploadedAt: new Date(f.created_at).toISOString(),
  }))
}

export async function sbPutMedia(c, file, type, buffer) {
  await sb(c, `/storage/v1/object/${BUCKET()}/${encodeURIComponent(file)}`, {
    method: 'POST',
    headers: { 'Content-Type': type, 'Cache-Control': '31536000', 'x-upsert': 'false' },
    body: buffer,
  })
  return { url: publicUrl(c, file), name: file, size: buffer.length, uploadedAt: new Date().toISOString() }
}

export async function sbDeleteMedia(c, url) {
  const prefix = `${c.url}/storage/v1/object/public/${BUCKET()}/`
  const name = String(url || '').startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length).split('?')[0]) : ''
  if (!name || name.includes('/') || name.startsWith('.')) throw Object.assign(new Error('Only uploaded photos can be deleted.'), { status: 400 })
  await sb(c, `/storage/v1/object/${BUCKET()}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [name] }),
  })
}
