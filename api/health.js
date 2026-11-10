import { passwordConfigured } from './_lib/auth.js'
import { storageMode, mediaMode } from './_lib/storage.js'
import { route, send } from './_lib/http.js'

// Tells the admin login screen what still needs setting up. No secrets are returned.
export default route(
  {
    GET(req, res) {
      send(res, 200, { ok: true, password: passwordConfigured(), storage: storageMode(), media: mediaMode() })
    },
  },
  { publicMethods: ['GET'] }
)
