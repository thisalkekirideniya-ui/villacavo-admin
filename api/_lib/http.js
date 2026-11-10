// Small helpers that work both on Vercel (where req.body is pre-parsed) and in the
// local Vite dev server (plain Node request).
import { isAuthed } from './auth.js'

export function send(res, status, data, headers = {}) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (!headers['Cache-Control']) res.setHeader('Cache-Control', 'no-store')
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
  res.end(JSON.stringify(data))
}

export async function readJson(req, limit = 6 * 1024 * 1024) {
  if (req.body !== undefined && req.body !== null && typeof req.body !== 'string' && !Buffer.isBuffer(req.body)) return req.body
  let raw = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? String(req.body) : ''
  if (!raw) {
    const chunks = []
    let size = 0
    for await (const c of req) {
      size += c.length
      if (size > limit) throw Object.assign(new Error('Request is too large'), { status: 413 })
      chunks.push(c)
    }
    raw = Buffer.concat(chunks).toString('utf8')
  }
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 })
  }
}

export const query = (req) => new URL(req.url, 'http://localhost').searchParams

/** Wrap a handler: method routing, auth for writes, uniform error replies. */
export function route(handlers, { publicMethods = [] } = {}) {
  return async (req, res) => {
    const fn = handlers[req.method]
    if (!fn) return send(res, 405, { error: 'Method not allowed' }, { Allow: Object.keys(handlers).join(', ') })
    if (!publicMethods.includes(req.method) && !isAuthed(req)) {
      return send(res, 401, { error: 'Please sign in again.' })
    }
    try {
      await fn(req, res)
    } catch (err) {
      const status = err.status || 500
      if (status >= 500) console.error(err)
      send(res, status, { error: err.message || 'Something went wrong' })
    }
  }
}
