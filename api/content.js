import { getContent, saveContent } from './_lib/storage.js'
import { route, readJson, send, query } from './_lib/http.js'

const MAX_BYTES = 3 * 1024 * 1024

export default route(
  {
    // Public: the website (a different domain) reads published content from here.
    async GET(req, res) {
      const fresh = query(req).has('fresh')
      const content = await getContent()
      send(res, 200, { content }, {
        'Access-Control-Allow-Origin': '*',
        // brief edge caching keeps storage reads low; the admin asks for ?fresh
        'Cache-Control': fresh ? 'no-store' : 'public, max-age=0, s-maxage=15, stale-while-revalidate=300',
      })
    },

    // Admin only: publish a new version of the site content.
    async PUT(req, res) {
      const { content } = await readJson(req)
      if (!content || typeof content !== 'object' || Array.isArray(content) || !content.pages) {
        return send(res, 400, { error: 'Nothing to publish.' })
      }
      if (JSON.stringify(content).length > MAX_BYTES) return send(res, 413, { error: 'The content is too large to save.' })
      const result = await saveContent(content)
      send(res, 200, { ok: true, ...result })
    },
  },
  { publicMethods: ['GET'] }
)
