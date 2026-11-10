import crypto from 'node:crypto'

// Sessions are signed tokens: "<expiry>.<hmac>". The signing key is derived from
// ADMIN_PASSWORD, so changing the password in Vercel signs everyone out.
const TOKEN_DAYS = 7

const sha = (s) => crypto.createHash('sha256').update(s).digest()

function key() {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  return sha(`villa-cavo-admin:${pw}:${process.env.ADMIN_SECRET || ''}`)
}

export const passwordConfigured = () => Boolean(process.env.ADMIN_PASSWORD)

export function checkPassword(given) {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || typeof given !== 'string') return false
  return crypto.timingSafeEqual(sha(given), sha(pw))
}

export function makeToken() {
  const exp = Date.now() + TOKEN_DAYS * 864e5
  const sig = crypto.createHmac('sha256', key()).update(String(exp)).digest('hex')
  return { token: `${exp}.${sig}`, expires: exp }
}

export function verifyToken(token) {
  const k = key()
  if (!k || typeof token !== 'string') return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  const want = crypto.createHmac('sha256', k).update(exp).digest('hex')
  if (want.length !== sig.length) return false
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))
}

export function isAuthed(req) {
  const h = req.headers.authorization || ''
  return verifyToken(h.startsWith('Bearer ') ? h.slice(7) : '')
}
