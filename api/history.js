import { listHistory, getVersion } from './_lib/storage.js'
import { route, send, query } from './_lib/http.js'

// Admin only: list published versions, or fetch one to restore it.
export default route({
  async GET(req, res) {
    const id = query(req).get('id')
    if (id) return send(res, 200, { content: await getVersion(id) })
    send(res, 200, { versions: await listHistory() })
  },
})
