import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

/**
 * Runs the backend (/api functions) inside `npm run dev`, storing content and
 * uploads in .admin-data/ instead of Vercel Blob. Dev password: ADMIN_PASSWORD, or "admin".
 * On Vercel the same files in /api run as serverless functions.
 */
function localApi() {
  const store = path.join(root, '.admin-data')
  return {
    name: 'villa-cavo-admin-local-api',
    apply: 'serve',
    configureServer(server) {
      process.env.VC_LOCAL_STORE ||= store
      process.env.ADMIN_PASSWORD ||= 'admin'
      process.env.VC_LOCAL_MEDIA_BASE ||= 'http://localhost:5174'
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')

        if (url.pathname.startsWith('/__local-media/')) {
          const name = decodeURIComponent(url.pathname.slice('/__local-media/'.length))
          const file = path.join(store, 'media', name)
          if (name.includes('/') || name.includes('\\') || !fs.existsSync(file)) return next()
          const ext = path.extname(name).slice(1).toLowerCase()
          res.setHeader('Content-Type', { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' }[ext] || 'application/octet-stream')
          res.setHeader('Access-Control-Allow-Origin', '*')
          return fs.createReadStream(file).pipe(res)
        }

        const m = /^\/api\/([a-z-]+)$/.exec(url.pathname)
        if (!m) return next()
        const file = path.join(root, 'api', `${m[1]}.js`)
        if (!fs.existsSync(file)) return next()
        try {
          const mod = await import(`${pathToFileURL(file).href}?t=${fs.statSync(file).mtimeMs}`)
          await mod.default(req, res)
        } catch (err) {
          console.error(err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Let the local backend see server-side settings from .env.local
  // (ADMIN_PASSWORD, CLOUDINARY_*, BLOB_READ_WRITE_TOKEN …).
  // Values from the real shell win; values from .env files are refreshed when
  // the file changes (Vite restarts the server in the same process).
  globalThis.__vcShellEnv ??= new Set(Object.keys(process.env))
  for (const [k, v] of Object.entries(loadEnv(mode, root, ''))) if (!globalThis.__vcShellEnv.has(k)) process.env[k] = v
  return {
  plugins: [react(), localApi()],
  // the website runs on 5173, the admin on 5174
  server: { port: 5174, strictPort: true },
  preview: { port: 5174 },
  }
})
