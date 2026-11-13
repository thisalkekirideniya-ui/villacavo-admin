const TOKEN_KEY = 'vc-admin-token'

// The backend is its own project (villacavo-backend) on its own address.
const API_URL = String(import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5175' : '')).replace(/\/+$/, '')

export function getToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const { token, expires } = JSON.parse(raw)
    return expires > Date.now() ? token : null
  } catch {
    return null
  }
}

export function setToken(data) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(data))
  } catch {
    /* private mode: the session lasts until the tab closes */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function call(path, { method = 'GET', body } = {}) {
  if (!API_URL) throw new ApiError('The backend address is missing: set VITE_API_URL in the admin project on Vercel, then redeploy.', 0)
  const headers = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let res
  try {
    res = await fetch(API_URL + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError('Could not reach the backend. Check your internet connection, or that the backend is running.', 0)
  }
  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) {
    throw new ApiError('The backend is not responding. Check VITE_API_URL, or run `npm run dev` inside the backend folder.', 404)
  }
  const data = await res.json()
  if (res.status === 401 && path !== '/api/login') {
    clearToken()
    window.dispatchEvent(new Event('vc-admin-signed-out'))
  }
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status)
  return data
}

export const api = {
  health: () => call('/api/health'),
  login: (password) => call('/api/login', { method: 'POST', body: { password } }),
  content: () => call('/api/content?fresh=1'),
  publish: (content) => call('/api/content', { method: 'PUT', body: { content } }),
  history: () => call('/api/history'),
  version: (id) => call(`/api/history?id=${encodeURIComponent(id)}`),
  media: () => call('/api/media'),
  upload: (file) => call('/api/media', { method: 'POST', body: file }),
  removeMedia: (url) => call(`/api/media?url=${encodeURIComponent(url)}`, { method: 'DELETE' }),
}
