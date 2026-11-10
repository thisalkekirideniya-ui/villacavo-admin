import { listMedia, putMedia, deleteMedia, MAX_MEDIA_BYTES } from './_lib/storage.js'
import { route, readJson, send, query } from './_lib/http.js'

// Admin only: list, upload and delete photos.
// Uploads arrive as base64 JSON (already resized in the browser) to stay under
// Vercel's 4.5 MB request limit.
export default route({
  async GET(req, res) {
    send(res, 200, { media: await listMedia() })
  },

  async POST(req, res) {
    const { name, type, data } = await readJson(req)
    if (typeof data !== 'string' || !data) return send(res, 400, { error: 'No image was sent.' })
    const base64 = data.includes(',') ? data.slice(data.indexOf(',') + 1) : data
    const buffer = Buffer.from(base64, 'base64')
    if (!buffer.length) return send(res, 400, { error: 'The image is empty.' })
    if (buffer.length > MAX_MEDIA_BYTES) return send(res, 413, { error: 'That image is larger than 4 MB.' })
    send(res, 200, { item: await putMedia(name, type, buffer) })
  },

  async DELETE(req, res) {
    const url = query(req).get('url')
    if (!url) return send(res, 400, { error: 'Which photo?' })
    await deleteMedia(url)
    send(res, 200, { ok: true })
  },
})
