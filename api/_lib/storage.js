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

export async function listMedia() {
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
  requireStorage()
  if (!TYPES[type]) throw Object.assign(new Error('Only JPG, PNG, WebP, GIF or AVIF images can be uploaded.'), { status: 415 })
  if (buffer.length > MAX_MEDIA_BYTES) throw Object.assign(new Error('That image is larger than 4 MB.'), { status: 413 })
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
