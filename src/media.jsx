import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api'
import { prepareImage, formatBytes, imageType } from './imageTools'
import { builtInMedia } from './shared/data/content'
import { useAdmin } from './context'
import { Button, IconGlyph, Empty, Spinner } from './ui'

/** Loads uploaded photos and handles uploads. Used once, in AdminApp. */
export function useMediaStore(notify) {
  const [uploaded, setUploaded] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploads, setUploads] = useState([]) // { id, name, status, error }

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { media } = await api.media()
      setUploaded(media)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const uploadFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []).filter((f) => imageType(f))
      if (!files.length) {
        notify?.('That file doesn’t look like a photo. Choose a JPG, PNG, WebP or GIF image.', 'error')
        return []
      }
      const jobs = files.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, status: 'working' }))
      setUploads((u) => [...jobs, ...u])
      const done = []
      // one at a time keeps memory low on phones
      for (let i = 0; i < files.length; i++) {
        const job = jobs[i]
        try {
          const prepared = await prepareImage(files[i])
          const { item } = await api.upload(prepared)
          done.push(item)
          setUploaded((list) => [item, ...list])
          setUploads((u) => u.map((x) => (x.id === job.id ? { ...x, status: 'done' } : x)))
        } catch (e) {
          setUploads((u) => u.map((x) => (x.id === job.id ? { ...x, status: 'error', error: e.message } : x)))
        }
      }
      const failed = files.length - done.length
      if (done.length) notify?.(`${done.length} photo${done.length > 1 ? 's' : ''} uploaded${failed ? `, ${failed} failed` : ''}.`, failed ? 'error' : 'ok')
      else notify?.('Upload failed. See the details in the library.', 'error')
      setTimeout(() => setUploads((u) => u.filter((x) => x.status !== 'done')), 4000)
      return done
    },
    [notify]
  )

  const remove = useCallback(async (url) => {
    await api.removeMedia(url)
    setUploaded((list) => list.filter((m) => m.url !== url))
  }, [])

  const all = useMemo(
    () => [
      ...uploaded.map((m) => ({ ...m, label: m.name, uploaded: true })),
      ...builtInMedia.map((m) => ({ ...m, name: m.url.split('/').pop(), uploaded: false })),
    ],
    [uploaded]
  )

  return { uploaded, all, loading, error, refresh, uploadFiles, uploads, remove, dismissUpload: (id) => setUploads((u) => u.filter((x) => x.id !== id)) }
}

/** Count how many places in the content use a given image URL. */
export function usageCount(content, url) {
  const json = JSON.stringify(content)
  const needle = JSON.stringify(url).slice(1, -1)
  return json.split(needle).length - 1
}

function DropZone({ onFiles, compact = false }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onFiles(e.dataTransfer.files)
      }}
      onClick={() => input.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors ${
        over ? 'border-terra-500 bg-terra-50' : 'border-stone-300 bg-white hover:border-terra-400 hover:bg-stone-50'
      } ${compact ? 'px-4 py-5' : 'px-6 py-10'}`}
    >
      <IconGlyph name="upload" className="h-7 w-7 text-terra-500" />
      <p className="text-sm font-medium text-stone-800">Drop photos here or click to choose</p>
      <p className="text-xs text-stone-500">Large photos are resized automatically. JPG, PNG, WebP or GIF.</p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function UploadQueue() {
  const { media } = useAdmin()
  if (!media.uploads.length) return null
  return (
    <ul className="mt-3 space-y-1.5">
      {media.uploads.map((u) => (
        <li key={u.id} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-stone-200">
          {u.status === 'working' && <Spinner className="h-3.5 w-3.5" />}
          {u.status === 'done' && <span className="text-emerald-600">✓</span>}
          {u.status === 'error' && <span className="text-red-600">!</span>}
          <span className="min-w-0 flex-1 truncate text-stone-700">{u.name}</span>
          {u.status === 'error' && <span className="text-red-600">{u.error}</span>}
          {u.status === 'error' && (
            <button className="text-stone-400 hover:text-stone-700" onClick={() => media.dismissUpload(u.id)} aria-label="Dismiss">
              ✕
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

function Thumb({ item, selected, onClick, children }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl bg-white ring-1 transition ${selected ? 'ring-2 ring-terra-500' : 'ring-stone-200 hover:ring-stone-300'}`}>
      <button type="button" onClick={onClick} className="block w-full">
        <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
          <img src={item.url} alt={item.label} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      </button>
      {selected && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-terra-500 text-xs text-white shadow">✓</span>}
      {children}
    </div>
  )
}

/** Full media library page. */
export function MediaLibrary() {
  const { media, content, notify, health } = useAdmin()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const list = media.all.filter(
    (m) => (filter === 'all' || (filter === 'uploaded' ? m.uploaded : !m.uploaded)) && (!q || m.label.toLowerCase().includes(q.toLowerCase()))
  )

  const del = async (m) => {
    const used = usageCount(content, m.url)
    const msg = used
      ? `This photo is used in ${used} place${used > 1 ? 's' : ''} on the site. Those spots will show an empty placeholder once you publish.\n\nDelete it anyway?`
      : 'Delete this photo permanently?'
    if (!window.confirm(msg)) return
    try {
      await media.remove(m.url)
      notify('Photo deleted.')
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  const copy = async (url) => {
    const full = url.startsWith('http') ? url : window.location.origin + url
    try {
      await navigator.clipboard.writeText(full)
      notify('Link copied.')
    } catch {
      window.prompt('Copy this link:', full)
    }
  }

  return (
    <div className="space-y-6">
      <DropZone onFiles={media.uploadFiles} />
      <UploadQueue />
      {media.error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{media.error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-stone-200/70 p-1 text-xs">
          {[
            ['all', `All (${media.all.length})`],
            ['uploaded', `Uploaded (${media.uploaded.length})`],
            ['builtin', `Built-in (${media.all.length - media.uploaded.length})`],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-md px-3 py-1.5 font-medium ${filter === k ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}>
              {l}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search photos…" className="admin-input sm:w-64" />
      </div>

      {media.loading && !media.uploaded.length ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : list.length === 0 ? (
        <Empty title="No photos here yet" text="Upload photos above and they will appear here." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((m) => {
            const used = usageCount(content, m.url)
            return (
              <Thumb key={m.url} item={m} onClick={() => window.open(m.url, '_blank', 'noopener')}>
                <div className="space-y-1 p-3">
                  <p className="truncate text-xs font-medium text-stone-800" title={m.label}>{m.label}</p>
                  <p className="text-[11px] text-stone-500">
                    {m.uploaded ? formatBytes(m.size) : 'Built-in'} · {used ? `used ${used}×` : 'not used'}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => copy(m.url)} className="text-[11px] font-medium text-stone-600 hover:text-terra-600">Copy link</button>
                    {m.uploaded && (
                      <button onClick={() => del(m)} className="ml-auto text-[11px] font-medium text-red-600 hover:text-red-700">Delete</button>
                    )}
                  </div>
                </div>
              </Thumb>
            )
          })}
        </div>
      )}
      <p className="text-xs text-stone-500">
        Built-in photos come with the website code and can’t be deleted here. Uploaded photos are stored in {health?.media === 'cloudinary' ? 'Cloudinary' : 'your Vercel Blob storage'}.
      </p>
    </div>
  )
}

/** Modal for choosing one or more photos. Resolves with an array of URLs, or null. */
export function MediaPicker({ request, onClose }) {
  const { media } = useAdmin()
  const [selected, setSelected] = useState([])
  const [url, setUrl] = useState('')
  const multiple = !!request?.multiple

  useEffect(() => {
    setSelected([])
    setUrl('')
  }, [request])

  useEffect(() => {
    if (!request) return
    const onKey = (e) => e.key === 'Escape' && onClose(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [request, onClose])

  if (!request) return null

  const toggle = (u) => {
    if (!multiple) return onClose([u])
    setSelected((s) => (s.includes(u) ? s.filter((x) => x !== u) : [...s, u]))
  }

  const upload = async (files) => {
    const items = await media.uploadFiles(files)
    if (!items.length) return
    if (!multiple) onClose([items[0].url])
    else setSelected((s) => [...items.map((i) => i.url), ...s])
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => onClose(null)}>
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-stone-50 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <h2 className="font-sans text-base font-semibold text-stone-900">{multiple ? 'Choose photos' : 'Choose a photo'}</h2>
            <p className="text-xs text-stone-500">{multiple ? 'Tap photos to select several, then press Add.' : 'Tap a photo to use it, or upload a new one.'}</p>
          </div>
          <button onClick={() => onClose(null)} className="rounded-full p-2 text-stone-500 hover:bg-stone-100" aria-label="Close">✕</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5" data-lenis-prevent>
          <DropZone compact onFiles={upload} />
          <UploadQueue />
          {media.loading && !media.uploaded.length ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {media.all.map((m) => (
                <Thumb key={m.url} item={m} selected={selected.includes(m.url) || (!multiple && request.current === m.url)} onClick={() => toggle(m.url)}>
                  <p className="truncate px-2.5 py-2 text-[11px] text-stone-600">{m.label}</p>
                </Thumb>
              ))}
            </div>
          )}
          <details className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <summary className="cursor-pointer text-xs font-medium text-stone-600">Use a photo from another website (link)</summary>
            <div className="mt-3 flex gap-2">
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="admin-input flex-1" />
              <Button onClick={() => url.trim() && onClose([url.trim()])} disabled={!/^https?:\/\/\S+$/.test(url.trim())}>Use link</Button>
            </div>
          </details>
        </div>

        {multiple && (
          <div className="flex items-center justify-between border-t border-stone-200 bg-white px-5 py-3">
            <span className="text-xs text-stone-500">{selected.length} selected</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onClose(null)}>Cancel</Button>
              <Button onClick={() => onClose(selected)} disabled={!selected.length}>Add {selected.length || ''}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
