// Copies the website's default content, icons and built-in photos into the admin
// project, so the admin always edits the same sections the website shows.
//
// Runs automatically before `npm run dev` and `npm run build` when the website
// is the parent folder of this admin folder (VILLA CAVO/admin), or wherever
// SITE_DIR points. When the website isn't there (e.g. on Vercel), the copies
// already in src/shared and public/ are used.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const adminRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteRoot = path.resolve(process.env.SITE_DIR || path.join(adminRoot, '..'))

const files = [
  ['src/data/site.js', 'src/shared/data/site.js'],
  ['src/data/content.js', 'src/shared/data/content.js'],
  ['src/lib/content.jsx', 'src/shared/lib/content.jsx'],
  ['src/components/Icon.jsx', 'src/shared/components/Icon.jsx'],
  ['public/logo.jpg', 'public/logo.jpg'],
]

if (!fs.existsSync(path.join(siteRoot, 'src/data/content.js'))) {
  console.log('[sync] website folder not found next to the admin; using the committed copies.')
  process.exit(0)
}

const copy = (from, to) => {
  const src = path.join(siteRoot, from)
  const dest = path.join(adminRoot, to)
  if (!fs.existsSync(src)) return 0
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const same = fs.existsSync(dest) && Buffer.compare(fs.readFileSync(src), fs.readFileSync(dest)) === 0
  if (!same) fs.copyFileSync(src, dest)
  return same ? 0 : 1
}

let changed = 0
for (const [from, to] of files) changed += copy(from, to)

// built-in photos: mirror public/images
const imgSrc = path.join(siteRoot, 'public/images')
const imgDest = path.join(adminRoot, 'public/images')
if (fs.existsSync(imgSrc)) {
  fs.mkdirSync(imgDest, { recursive: true })
  const names = new Set(fs.readdirSync(imgSrc))
  for (const n of names) changed += copy(`public/images/${n}`, `public/images/${n}`)
  for (const n of fs.readdirSync(imgDest)) if (!names.has(n)) { fs.rmSync(path.join(imgDest, n)); changed++ }
}

console.log(changed ? `[sync] updated ${changed} file(s) from the website.` : '[sync] already up to date with the website.')
