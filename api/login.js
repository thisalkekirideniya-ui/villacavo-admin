import { checkPassword, makeToken, passwordConfigured } from './_lib/auth.js'
import { route, readJson, send } from './_lib/http.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export default route(
  {
    async POST(req, res) {
      if (!passwordConfigured()) {
        return send(res, 503, { error: 'ADMIN_PASSWORD is not set. Add it in Vercel → Project → Settings → Environment Variables, then redeploy.' })
      }
      const { password } = await readJson(req)
      if (!checkPassword(password)) {
        await wait(800) // slow down password guessing
        return send(res, 401, { error: 'That password is not right.' })
      }
      send(res, 200, makeToken())
    },
  },
  { publicMethods: ['POST'] }
)
