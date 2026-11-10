// Where admin content and photos are kept.
//  - On Vercel: Vercel Blob (needs BLOB_READ_WRITE_TOKEN, added when a Blob store
//    is connected to the project).
//  - In local development (`npm run dev`): files in .admin-data/ (git-ignored).
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const CONTENT = 'site/content.json'
const HISTORY = 'site/history/'
const MEDIA = 'media/'
const KEEP_VERSIONS = 30

const localDir = () => process.env.VC_LOCAL_STORE
// absolute, so the website (another port) can show photos uploaded in local test mode
const localMediaBase = () => process.env.VC_LOCAL_MEDIA_BASE || ''
export const storageMode = () => (process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : localDir() ? 'local' : null)

function requireStorage() {
  if (!storageMode()) {
    throw Object.assign(
      new Error('No storage is connected. In Vercel, open the project → Storage → create a Blob store and connect it, then redeploy.'),
      { status: 503 }
    )
  }
}

const blob = () => import('@vercel/blob')
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-')
const historyId = (pathname) => pathname.slice(HISTORY.length).replace(/\.json$/, '')
const idToDate = (id) => {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/.exec(id)
  return m ? new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}.${m[5]}Z`).toISOString() : null
}

async function listAll(prefix) {
  const { list } = await blob()
  const out = []
  let cursor
  do {
    const page = await list({ prefix, cursor, limit: 1000 })
    out.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return out
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: 'no-store' })
  if (!r.ok) throw new Error(`Could not read stored content (${r.status})`)
  return r.json()
}

/* ------------------------------------------------------------ content */

export async function getContent() {
  const mode = storageMode()
  if (!mode) return null
  if (mode === 'local') {
    try {
      return JSON.parse(await fs.readFile(path.join(localDir(), CONTENT), 'utf8'))
    } catch {
      return null
    }
  }
  const { head } = await blob()
  let meta
  try {
    meta = await head(CONTENT)
  } catch (err) {
    if (err?.name === 'BlobNotFoundError' || /not.?found/i.test(err?.message || '')) return null
    throw err
  }
  // the version stamp keeps the Blob CDN from handing back an older copy
  return fetchJson(`${meta.url}?v=${new Date(meta.uploadedAt).getTime()}`)
}

export async function saveContent(doc) {
  requireStorage()
  const body = JSON.stringify(doc)
  const id = stamp()
  if (storageMode() === 'local') {
    const dir = localDir()
    await fs.mkdir(path.join(dir, HISTORY), { recursive: true })
    await fs.writeFile(path.join(dir, CONTENT), body)
    await fs.writeFile(path.join(dir, `${HISTORY}${id}.json`), body)
  } else {
    const { put } = await blob()
    const opts = { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 }
    await put(CONTENT, body, opts)
    await put(`${HISTORY}${id}.json`, body, opts)
  }
  await pruneHistory().catch((e) => console.error('history prune failed', e))
  return { savedAt: idToDate(id) }
}

/* ------------------------------------------------------------ history */

export async function listHistory() {
  requireStorage()
  let items
  if (storageMode() === 'local') {
    const dir = path.join(localDir(), HISTORY)
    const files = await fs.readdir(dir).catch(() => [])
    items = await Promise.all(
      files.filter((f) => f.endsWith('.json')).map(async (f) => ({ id: f.replace(/\.json$/, ''), size: (await fs.stat(path.join(dir, f))).size }))
    )
  } else {
    items = (await listAll(HISTORY)).map((b) => ({ id: historyId(b.pathname), size: b.size }))
  }
  return items
    .map((it) => ({ ...it, savedAt: idToDate(it.id) }))
    .filter((it) => it.savedAt)
    .sort((a, b) => (a.id < b.id ? 1 : -1))
}

export async function getVersion(id) {
  requireStorage()
  if (!/^[\dTZ-]+$/.test(id || '')) throw Object.assign(new Error('Unknown version'), { status: 404 })
  if (storageMode() === 'local') {
    try {
      return JSON.parse(await fs.readFile(path.join(localDir(), `${HISTORY}${id}.json`), 'utf8'))
    } catch {
      throw Object.assign(new Error('Unknown version'), { status: 404 })
    }
  }
  const { head } = await blob()
  const meta = await head(`${HISTORY}${id}.json`).catch(() => null)
  if (!meta) throw Object.assign(new Error('Unknown version'), { status: 404 })
  return fetchJson(meta.url)
}

async function pruneHistory() {
  const items = await listHistory()
  const old = items.slice(KEEP_VERSIONS)
  if (!old.length) return
  if (storageMode() === 'local') {
    await Promise.all(old.map((it) => fs.rm(path.join(localDir(), `${HISTORY}${it.id}.json`), { force: true })))
  } else {
    const { del } = await blob()
    await del(old.map((it) => `${HISTORY}${it.id}.json`))
  }
}

/* -------------------------------------------------------------- media */

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }
export const MAX_MEDIA_BYTES = 4 * 1024 * 1024

function safeName(name, type) {
  const base = String(name || 'photo')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'photo'
  return `${base}-${crypto.randomBytes(4).toString('hex')}.${TYPES[type]}`
}

/* ---------------------------------------------------------- cloudinary */
// When Cloudinary keys are set, uploaded photos go to Cloudinary instead of
// Blob / the local folder. Set CLOUDINARY_URL (cloudinary://KEY:SECRET@CLOUD)
// or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.
const CLD_FOLDER = () => (process.env.CLOUDINARY_FOLDER || 'villa-cavo').replace(/^\/+|\/+$/g, '')

function cloudinary() {
  const u = process.env.CLOUDINARY_URL
  if (u) {
    const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(u.trim())
    if (m) return { key: m[1], secret: m[2], cloud: m[3] }
  }
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env
  return cloud && key && secret ? { cloud, key, secret } : null
}

// Catch a secret that was never filled in before Cloudinary rejects it as "Invalid Signature".
function checkSecret(c) {
  if (/PASTE|your_api_secret|[<>\s]/i.test(c.secret)) {
    throw Object.assign(new Error('The Cloudinary API secret has not been filled in. Paste the API Secret from Cloudinary → Settings → API Keys into CLOUDINARY_URL, save, and try again.'), { status: 500 })
  }
}

export const mediaMode = () => (cloudinary() ? 'cloudinary' : storageMode())

const sign = (params, secret) =>
  crypto
    .createHash('sha1')
    .update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&') + secret)
    .digest('hex')

// Delivered with automatic format and quality, so photos load fast on phones.
const cldUrl = (c, r) => `https://res.cloudinary.com/${c.cloud}/image/upload/f_auto,q_auto/v${r.version}/${r.public_id}.${r.format}`

function cldPublicId(c, url) {
  let u
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const prefix = `/${c.cloud}/image/upload/`
  if (u.hostname !== 'res.cloudinary.com' || !u.pathname.startsWith(prefix)) return null
  const rest = decodeURIComponent(u.pathname.slice(prefix.length))
    .replace(/^f_auto,q_auto\//, '')
    .replace(/^v\d+\//, '')
    .replace(/\.[a-z0-9]+$/i, '')
  return rest.startsWith(`${CLD_FOLDER()}/`) ? rest : null
}

async function cldCall(c, pathPart, init) {
  checkSecret(c)
  const r = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/${pathPart}`, init)
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(`Cloudinary: ${body.error?.message || r.status}`), { status: r.status === 401 ? 502 : r.status })
  return body
}

async function cldList(c) {
  const auth = 'Basic ' + Buffer.from(`${c.key}:${c.secret}`).toString('base64')
  const out = []
  let cursor
  do {
    const q = new URLSearchParams({ prefix: `${CLD_FOLDER()}/`, max_results: '500' })
    if (cursor) q.set('next_cursor', cursor)
    const page = await cldCall(c, `resources/image/upload?${q}`, { headers: { Authorization: auth } })
    out.push(...page.resources)
    cursor = page.next_cursor
  } while (cursor)
  return out
    .map((r) => ({ url: cldUrl(c, r), name: r.public_id.split('/').pop(), size: r.bytes, uploadedAt: new Date(r.created_at).toISOString() }))
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
}

async function cldUpload(c, name, type, buffer) {
  const params = {
    folder: CLD_FOLDER(),
    public_id: safeName(name, type).replace(/\.[a-z]+$/, ''),
    timestamp: Math.floor(Date.now() / 1000),
  }
  const form = new FormData()
  for (const [k, v] of Object.entries(params)) form.append(k, String(v))
  form.append('api_key', c.key)
  form.append('signature', sign(params, c.secret))
  form.append('file', `data:${type};base64,${buffer.toString('base64')}`)
  const r = await cldCall(c, 'image/upload', { method: 'POST', body: form })
  return { url: cldUrl(c, r), name: r.public_id.split('/').pop(), size: r.bytes, uploadedAt: new Date(r.created_at).toISOString() }
}

async function cldDelete(c, url) {
  const public_id = cldPublicId(c, url)
  if (!public_id) throw Object.assign(new Error('Only uploaded photos can be deleted.'), { status: 400 })
  const params = { public_id, timestamp: Math.floor(Date.now() / 1000), invalidate: 'true' }
  const form = new FormData()
  for (const [k, v] of Object.entries(params)) form.append(k, String(v))
  form.append('api_key', c.key)
  form.append('signature', sign(params, c.secret))
  await cldCall(c, 'image/destroy', { method: 'POST', body: form })
}

export async function listMedia() {
  const c = cloudinary()
  if (c) return cldList(c)
  requireStorage()
  if (storageMode() === 'local') {
    const dir = path.join(localDir(), MEDIA)
    const files = await fs.readdir(dir).catch(() => [])
    const out = await Promise.all(
      files.map(async (f) => {
        const st = await fs.stat(path.join(dir, f))
        return { url: `${localMediaBase()}/__local-media/${encodeURIComponent(f)}`, name: f, size: st.size, uploadedAt: st.mtime.toISOString() }
      })
    )
    return out.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
  }
  return (await listAll(MEDIA))
    .map((b) => ({ url: b.url, name: b.pathname.slice(MEDIA.length), size: b.size, uploadedAt: new Date(b.uploadedAt).toISOString() }))
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
}

export async function putMedia(name, type, buffer) {
  if (!TYPES[type]) throw Object.assign(new Error('Only JPG, PNG, WebP, GIF or AVIF images can be uploaded.'), { status: 415 })
  if (buffer.length > MAX_MEDIA_BYTES) throw Object.assign(new Error('That image is larger than 4 MB.'), { status: 413 })
  const c = cloudinary()
  if (c) return cldUpload(c, name, type, buffer)
  requireStorage()
  const file = safeName(name, type)
  if (storageMode() === 'local') {
    const dir = path.join(localDir(), MEDIA)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, file), buffer)
    return { url: `${localMediaBase()}/__local-media/${encodeURIComponent(file)}`, name: file, size: buffer.length, uploadedAt: new Date().toISOString() }
  }
  const { put } = await blob()
  const res = await put(`${MEDIA}${file}`, buffer, { access: 'public', contentType: type, addRandomSuffix: false })
  return { url: res.url, name: file, size: buffer.length, uploadedAt: new Date().toISOString() }
}

export async function deleteMedia(url) {
  const c = cloudinary()
  if (c) return cldDelete(c, url)
  requireStorage()
  if (storageMode() === 'local') {
    const rel = String(url || '').replace(localMediaBase(), '')
    const m = /^\/__local-media\/([^/]+)$/.exec(rel)
    if (!m) throw Object.assign(new Error('Only uploaded photos can be deleted.'), { status: 400 })
    const name = decodeURIComponent(m[1])
    if (name.includes('/') || name.includes('\\') || name.startsWith('.')) throw Object.assign(new Error('Bad file name'), { status: 400 })
    await fs.rm(path.join(localDir(), MEDIA, name), { force: true })
    return
  }
  let u
  try {
    u = new URL(url)
  } catch {
    throw Object.assign(new Error('Only uploaded photos can be deleted.'), { status: 400 })
  }
  if (!u.hostname.endsWith('.blob.vercel-storage.com') || !u.pathname.startsWith(`/${MEDIA}`)) {
    throw Object.assign(new Error('Only uploaded photos can be deleted.'), { status: 400 })
  }
  const { del } = await blob()
  await del(url)
}
