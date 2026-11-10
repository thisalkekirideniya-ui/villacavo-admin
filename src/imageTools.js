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

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))

export async function prepareImage(file) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`)
  // GIFs would lose their animation on a canvas; send them as they are.
  if (file.type === 'image/gif') {
    if (file.size > HARD_LIMIT) throw new Error(`${file.name} is larger than 4 MB.`)
    return { name: file.name, type: file.type, data: await readAsDataUrl(file) }
  }

  const source = await decode(file)
  const w = source.width || source.naturalWidth
  const h = source.height || source.naturalHeight
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h))

  // Small files that need no resizing go up untouched (keeps PNG transparency).
  if (scale === 1 && file.size <= TARGET_BYTES && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { name: file.name, type: file.type, data: await readAsDataUrl(file) }
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  const keepPng = file.type === 'image/png' && file.size <= TARGET_BYTES * 2
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
