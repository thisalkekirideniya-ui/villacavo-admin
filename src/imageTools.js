// Resize and compress photos in the browser before upload, so big camera files
// stay well under the 4 MB upload limit and the site stays fast.
const MAX_SIDE = 2400
const TARGET_BYTES = 1.6 * 1024 * 1024
const HARD_LIMIT = 3.9 * 1024 * 1024

const readAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(new Error('Could not read the file.'))
    r.readAsDataURL(blob)
  })

async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* fall back to <img> below */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const el = new Image()
    el.src = url
    await el.decode()
    return el
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Windows browsers sometimes report a photo's type as "" or "image/jpg",
// "image/pjpeg", "image/jfif" … Work it out from the type or the file extension.
const EXT_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', jpe: 'image/jpeg', jfif: 'image/jpeg', pjpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', bmp: 'image/bmp', heic: 'image/heic', heif: 'image/heif' }
const ALIASES = { 'image/jpg': 'image/jpeg', 'image/pjpeg': 'image/jpeg', 'image/jfif': 'image/jpeg', 'image/x-png': 'image/png' }
export function imageType(file) {
  const t = String(file.type || '').toLowerCase()
  if (t.startsWith('image/')) return ALIASES[t] || t
  const ext = String(file.name || '').split('.').pop().toLowerCase()
  return EXT_TYPES[ext] || ''
}

// Work out the real format from the file's first bytes, so a photo saved with
// no extension (or a wrong one, or a blank type) is still recognised.
export async function sniffImageType(file) {
  let b
  try {
    b = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  } catch {
    return ''
  }
  const s = (from, to) => String.fromCharCode(...b.slice(from, to))
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && s(1, 4) === 'PNG') return 'image/png'
  if (s(0, 4) === 'GIF8') return 'image/gif'
  if (s(0, 4) === 'RIFF' && s(8, 12) === 'WEBP') return 'image/webp'
  if (s(0, 2) === 'BM') return 'image/bmp'
  if (s(4, 8) === 'ftyp') {
    const brand = s(8, 12)
    if (/^avi[fs]$/.test(brand)) return 'image/avif'
    if (/^(hei[cxsm]|hev[cx]|mif1|msf1)$/.test(brand)) return 'image/heic'
  }
  return ''
}

/** Best guess of a file's image type: real bytes first, then the browser's label / extension. */
export async function detectImageType(file) {
  return (await sniffImageType(file)) || imageType(file)
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))

export async function prepareImage(file) {
  const ftype = await detectImageType(file)
  if (!ftype) throw new Error(`${file.name} is not a photo the admin can read. Choose a JPG, PNG, WebP or GIF image.`)
  // GIFs would lose their animation on a canvas; send them as they are.
  if (ftype === 'image/gif') {
    if (file.size > HARD_LIMIT) throw new Error(`${file.name} is larger than 4 MB.`)
    return { name: file.name, type: ftype, data: await readAsDataUrl(file) }
  }

  let source
  try {
    source = await decode(file)
  } catch {
    throw new Error(
      /hei[cf]$/.test(ftype)
        ? `${file.name} is an iPhone HEIC photo, which this browser can't open. Save it as JPG first (or set the iPhone camera to “Most Compatible”).`
        : `${file.name} could not be opened as an image.`
    )
  }
  const w = source.width || source.naturalWidth
  const h = source.height || source.naturalHeight
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h))

  // Small files that need no resizing go up untouched (keeps PNG transparency).
  if (scale === 1 && file.size <= TARGET_BYTES && ['image/jpeg', 'image/png', 'image/webp'].includes(ftype)) {
    // re-label the data with the corrected type, whatever the browser called it
    const data = (await readAsDataUrl(file)).replace(/^data:[^;,]*/, `data:${ftype}`)
    return { name: file.name, type: ftype, data }
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  const keepPng = ftype === 'image/png' && file.size <= TARGET_BYTES * 2
  if (!keepPng) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close?.()

  const type = keepPng ? 'image/png' : 'image/jpeg'
  let quality = 0.86
  let blob = await toBlob(canvas, type, quality)
  while (blob && type === 'image/jpeg' && blob.size > TARGET_BYTES && quality > 0.5) {
    quality -= 0.08
    blob = await toBlob(canvas, type, quality)
  }
  if (!blob) throw new Error(`Could not process ${file.name}.`)
  if (blob.size > HARD_LIMIT) throw new Error(`${file.name} is still larger than 4 MB after compressing.`)
  const name = type === 'image/jpeg' ? file.name.replace(/\.[^.]+$/, '') + '.jpg' : file.name
  return { name, type, data: await readAsDataUrl(blob) }
}

export const formatBytes = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
