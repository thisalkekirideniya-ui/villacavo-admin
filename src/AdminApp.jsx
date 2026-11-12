import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, getToken, setToken, clearToken } from './api'
import { AdminContext, getIn, setIn, useAdmin as useAdminCtx } from './context'
import { pageSchemas, collectionSchemas, settingsSchemas } from './schema'
import { Fields, ListEditor, slugify } from './fields'
import { useMediaStore, MediaLibrary, MediaPicker } from './media'
import { Button, Card, Empty, IconGlyph, Spinner, Toggle } from './ui'
import { defaultContent } from './shared/data/content'
import { mergeContent, DRAFT_KEY } from './shared/lib/content'

const BASE = ''

// The public website lives on another domain; Preview opens it and hands over the draft.
const SITE_URL = String(import.meta.env.VITE_SITE_URL || (import.meta.env.DEV ? 'http://localhost:5173' : '')).replace(/\/+$/, '')
const SITE_ORIGIN = (() => {
  try {
    return SITE_URL ? new URL(SITE_URL).origin : ''
  } catch {
    return ''
  }
})()
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function writeDraft(doc) {
  try {
    if (doc) localStorage.setItem(DRAFT_KEY, JSON.stringify(doc))
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* storage full or blocked: preview just won't include the draft */
  }
}

/** Tidy content before it goes live: every suite gets a unique link name. */
function normalize(doc) {
  const seen = new Set()
  const rooms = (doc.rooms || []).map((r, i) => {
    let base = slugify(r.slug || r.name) || `suite-${i + 1}`
    let slug = base
    for (let n = 2; seen.has(slug); n++) slug = `${base}-${n}`
    seen.add(slug)
    return slug === r.slug ? r : { ...r, slug }
  })
  return { ...doc, rooms }
}

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

/* =================================================================== root */

export default function AdminApp() {
  const [token, setTok] = useState(getToken)

  useEffect(() => {
    document.title = 'Villa Cavo · Admin'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    const out = () => setTok(null)
    window.addEventListener('vc-admin-signed-out', out)
    return () => {
      window.removeEventListener('vc-admin-signed-out', out)
      robots.remove()
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f6f3f0] font-sans text-[15px] font-normal text-stone-800 antialiased">
      {token ? (
        <Admin
          onSignOut={() => {
            clearToken()
            setTok(null)
          }}
        />
      ) : (
        <Login onSignedIn={setTok} />
      )}
    </div>
  )
}

/* ================================================================== login */

function Login({ onSignedIn }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [health, setHealth] = useState(null)

  useEffect(() => {
    api.health().then(setHealth).catch((e) => setHealth({ error: e.message }))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await api.login(password)
      setToken(data)
      onSignedIn(data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo.jpg" alt="" className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-md" />
          <h1 className="mt-5 font-display text-3xl text-stone-900">Villa Cavo</h1>
          <p className="mt-1 text-sm text-stone-500">Website admin</p>
        </div>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="pw" className="mb-1.5 block text-[13px] font-medium text-stone-800">Password</label>
              <div className="relative">
                <input
                  id="pw"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input pr-10"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 px-3 text-stone-400 hover:text-stone-700" aria-label={show ? 'Hide password' : 'Show password'}>
                  <IconGlyph name={show ? 'eyeOff' : 'eye'} className="h-4 w-4" />
                </button>
              </div>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !password}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>

        {health && (health.error || !health.password || !health.storage) && (
          <Card className="mt-4 p-5 text-sm">
            <p className="font-medium text-stone-900">Setup needed</p>
            {health.error ? (
              <p className="mt-2 text-stone-600">{health.error}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-stone-600">
                <SetupItem ok={health.password} text="ADMIN_PASSWORD environment variable" />
                <SetupItem ok={!!health.storage} text="Supabase (or Vercel Blob) connected (saves the page text)" />
                <SetupItem ok={health.media === 'cloudinary'} text="Cloudinary keys added (stores uploaded photos — optional)" />
              </ul>
            )}
            <p className="mt-3 text-xs text-stone-500">Set these in your Vercel project, then redeploy.</p>
          </Card>
        )}
        <p className="mt-6 text-center text-xs text-stone-400">
          {SITE_URL && <a href={SITE_URL} className="hover:text-stone-600">← Back to the website</a>}
        </p>
      </div>
    </div>
  )
}

const SetupItem = ({ ok, text }) => (
  <li className="flex items-center gap-2">
    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ok ? '✓' : '!'}</span>
    {text}
  </li>
)

/* ================================================================== shell */

function Admin({ onSignOut }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const view = pathname.slice(BASE.length).replace(/^\/+|\/+$/g, '')

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [baseline, setBaseline] = useState(null) // what is live right now
  const [draft, setDraft] = useState(null) // what is being edited
  const [restorable, setRestorable] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [health, setHealth] = useState(null)
  const [toasts, setToasts] = useState([])
  const [navOpen, setNavOpen] = useState(false)
  const [picker, setPicker] = useState(null)
  const pickerResolve = useRef(null)

  const notify = useCallback((text, tone = 'ok') => {
    const id = Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 7000 : 3500)
  }, [])

  const media = useMediaStore(notify)

  // Preview: the website tab asks for the draft once it has loaded; answer only the real website.
  const draftRef = useRef(null)
  draftRef.current = draft
  useEffect(() => {
    const onMessage = (e) => {
      if (!SITE_ORIGIN || e.origin !== SITE_ORIGIN || e.data?.type !== 'vc-preview-ready' || !e.source) return
      e.source.postMessage({ type: 'vc-preview-draft', draft: draftRef.current }, SITE_ORIGIN)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [{ content }, h] = await Promise.all([api.content(), api.health().catch(() => null)])
      const live = mergeContent(defaultContent, content)
      setBaseline(live)
      setHealth(h)
      const saved = readDraft()
      if (saved && !same(mergeContent(defaultContent, saved), live)) setRestorable(mergeContent(defaultContent, saved))
      setDraft(live)
    } catch (e) {
      setLoadError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const dirty = useMemo(() => draft && baseline && !same(draft, baseline), [draft, baseline])

  // keep an autosaved copy (also used by Preview) while there are unpublished edits
  useEffect(() => {
    if (!draft || restorable) return
    const t = setTimeout(() => writeDraft(dirty ? draft : null), 500)
    return () => clearTimeout(t)
  }, [draft, dirty, restorable])

  useEffect(() => {
    if (!dirty) return
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  useEffect(() => setNavOpen(false), [pathname])

  const setAt = useCallback((path, value) => setDraft((d) => setIn(d, path, value)), [])

  const pickImages = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        pickerResolve.current = resolve
        setPicker({ ...opts, at: Date.now() })
      }),
    []
  )
  const closePicker = useCallback((result) => {
    pickerResolve.current?.(result)
    pickerResolve.current = null
    setPicker(null)
  }, [])

  const publish = async () => {
    setPublishing(true)
    try {
      const doc = normalize(draft)
      await api.publish(doc)
      setDraft(doc)
      setBaseline(doc)
      writeDraft(null)
      notify('Published. The live site updates within about a minute.')
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setPublishing(false)
    }
  }

  const discard = () => {
    if (!window.confirm('Throw away all unpublished changes?')) return
    setDraft(baseline)
    writeDraft(null)
    notify('Changes discarded.')
  }

  const preview = (url = '/') => {
    writeDraft(draft)
    if (!SITE_ORIGIN) {
      notify('Preview needs the website address: set VITE_SITE_URL in the admin project on Vercel, then redeploy.', 'error')
      return
    }
    // no "noopener": the website tab needs window.opener to ask for the draft
    window.open(`${SITE_URL}${url}${url.includes('?') ? '&' : '?'}preview=1`, '_blank')
  }

  const loadVersion = (doc, when) => {
    setDraft(mergeContent(defaultContent, doc))
    navigate(BASE || '/')
    notify(`Loaded the version from ${fmtDate(when)}. Review it, then press Publish to make it live.`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-stone-500">
        <Spinner />
        Loading content…
      </div>
    )
  }
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center">
          <p className="font-medium text-stone-900">Could not load the site content</p>
          <p className="mt-2 text-sm text-stone-600">{loadError}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={load}>Try again</Button>
            <Button variant="outline" onClick={onSignOut}>Sign out</Button>
          </div>
        </Card>
      </div>
    )
  }

  const ctx = { content: draft, baseline, setAt, media, notify, pickImages, preview, health }
  const { title, subtitle, url, body } = resolveView(view, { draft, setAt, loadVersion, dirty, health, publish, publishing, navigate, preview, media })

  return (
    <AdminContext.Provider value={ctx}>
      <div className="lg:pl-64">
        <Sidebar view={view} open={navOpen} onClose={() => setNavOpen(false)} onSignOut={onSignOut} navigate={navigate} />

        <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#f6f3f0]/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button onClick={() => setNavOpen(true)} className="rounded-lg p-2 text-stone-600 hover:bg-stone-200 lg:hidden" aria-label="Open menu">
              <IconGlyph name="menu" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-sans text-lg font-semibold text-stone-900">{title}</h1>
              {subtitle && <p className="hidden truncate text-xs text-stone-500 sm:block">{subtitle}</p>}
            </div>
            <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${dirty ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dirty ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {dirty ? 'Unpublished changes' : 'All changes live'}
            </span>
            <Button variant="outline" size="sm" icon="eye" onClick={() => preview(url || '/')} title="Open the site with your unpublished changes">
              <span className="hidden sm:inline">Preview</span>
            </Button>
            {dirty && (
              <Button variant="ghost" size="sm" onClick={discard} className="hidden md:inline-flex">Discard</Button>
            )}
            <Button size="sm" onClick={publish} disabled={!dirty || publishing}>
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </header>

        {restorable && (
          <div className="mx-4 mt-4 flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 sm:mx-6 sm:flex-row sm:items-center">
            <p className="flex-1">You have unpublished changes saved from an earlier session.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setDraft(restorable); setRestorable(null) }}>Restore them</Button>
              <Button size="sm" variant="outline" onClick={() => { writeDraft(null); setRestorable(null) }}>Discard</Button>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-8">{body}</main>
      </div>

      <MediaPicker request={picker} onClose={closePicker} />

      <div className="pointer-events-none fixed bottom-4 right-4 z-[110] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto rounded-xl px-4 py-3 text-sm shadow-lg ring-1 ${t.tone === 'error' ? 'bg-red-50 text-red-800 ring-red-200' : 'bg-stone-900 text-white ring-stone-900'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </AdminContext.Provider>
  )
}

/* ================================================================ sidebar */

function Sidebar({ view, open, onClose, onSignOut, navigate }) {
  const groups = [
    { label: null, items: [{ id: '', label: 'Dashboard', icon: 'dashboard' }] },
    { label: 'Pages', items: pageSchemas.map((p) => ({ id: `pages/${p.id}`, label: p.label, icon: 'page' })) },
    { label: 'Content', items: collectionSchemas.map((c) => ({ id: `content/${c.id}`, label: c.label, icon: 'list' })) },
    {
      label: 'Library & settings',
      items: [
        { id: 'media', label: 'Photos', icon: 'image' },
        ...settingsSchemas.map((s) => ({ id: `settings/${s.id}`, label: s.label, icon: s.id === 'navigation' ? 'nav' : s.id === 'contact' ? 'phone' : 'settings' })),
        { id: 'history', label: 'Publish history', icon: 'history' },
      ],
    },
  ]
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-stone-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-stone-200 bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
          <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-lg object-cover" />
          <div className="leading-tight">
            <p className="font-display text-lg text-stone-900">Villa Cavo</p>
            <p className="text-[11px] text-stone-500">Website admin</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4" data-lenis-prevent>
          {groups.map((g, gi) => (
            <div key={gi} className={gi ? 'mt-5' : ''}>
              {g.label && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{g.label}</p>}
              {g.items.map((it) => {
                const active = view === it.id
                return (
                  <button
                    key={it.id}
                    onClick={() => navigate(it.id ? `${BASE}/${it.id}` : BASE || '/')}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${active ? 'bg-terra-50 font-medium text-terra-700' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}
                  >
                    <IconGlyph name={it.icon} className={`h-4 w-4 ${active ? 'text-terra-500' : 'text-stone-400'}`} />
                    {it.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="space-y-1 border-t border-stone-100 p-3">
          <a href={SITE_URL || "/"} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">
            <IconGlyph name="external" className="h-4 w-4 text-stone-400" /> View live site
          </a>
          <button onClick={onSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">
            <IconGlyph name="logout" className="h-4 w-4 text-stone-400" /> Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

/* ================================================================== views */

function resolveView(view, deps) {
  const [kind, id] = view.split('/')
  if (!view) return { title: 'Dashboard', body: <Dashboard {...deps} /> }

  if (kind === 'pages') {
    const page = pageSchemas.find((p) => p.id === id)
    if (page) return { title: page.label, subtitle: `Page · ${page.url}`, url: page.url, body: <PageEditor key={page.id} page={page} /> }
  }
  if (kind === 'content') {
    const col = collectionSchemas.find((c) => c.id === id)
    if (col) return { title: col.label, subtitle: col.description, url: col.url, body: <CollectionEditor key={col.id} col={col} /> }
  }
  if (kind === 'settings') {
    const s = settingsSchemas.find((x) => x.id === id)
    if (s) return { title: s.label, subtitle: 'Settings', body: <SettingsEditor key={s.id} schema={s} /> }
  }
  if (view === 'media') return { title: 'Photos', subtitle: 'Upload, browse and delete photos', body: <MediaLibrary /> }
  if (view === 'history') return { title: 'Publish history', subtitle: 'The last 30 published versions', body: <History {...deps} /> }
  return { title: 'Not found', body: <Empty title="This admin page does not exist." /> }
}

function Dashboard({ draft, dirty, health, publish, publishing, navigate, media }) {
  const stats = [
    { label: 'Suites', value: draft.rooms.length, to: 'content/rooms' },
    { label: 'Experiences', value: draft.experiences.length, to: 'content/experiences' },
    { label: 'Gallery photos', value: draft.gallery.length, to: 'content/gallery' },
    { label: 'Uploaded photos', value: media.loading ? '…' : media.uploaded.length, to: 'media' },
  ]
  const go = (to) => navigate(`${BASE}/${to}`)
  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 className="font-display text-2xl text-stone-900">Welcome back</h2>
          <p className="mt-1 text-sm text-stone-600">
            {dirty
              ? 'You have changes that are not live yet. Preview them, then publish when you are happy.'
              : 'Everything you see here is live on the website. Pick a page or list on the left to edit it.'}
          </p>
        </div>
        {dirty && <Button onClick={publish} disabled={publishing}>{publishing ? 'Publishing…' : 'Publish changes'}</Button>}
      </Card>

      {health && health.storage !== 'blob' && health.storage !== 'supabase' && (
        <Card className="border-l-4 border-amber-400 p-5 text-sm">
          <p className="font-medium text-stone-900">{health.storage === 'local' ? 'Local test mode' : 'Storage not connected'}</p>
          <p className="mt-1 text-stone-600">
            {health.storage === 'local'
              ? 'You are running the admin on your computer. Changes and photos are saved in the .admin-data folder only — publish from the live Vercel site to change the real website.'
              : 'Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to this Vercel project (or connect a Blob store), then redeploy. Until then, publishing and uploads will fail.'}
          </p>
        </Card>
      )}

      {health && (
        <p className="text-xs text-stone-500">
          {health.media === 'cloudinary'
            ? 'Uploaded photos are stored in Cloudinary.'
            : 'Uploaded photos are stored in ' + ({ local: 'the local .admin-data folder', supabase: 'Supabase Storage' }[health.storage] || 'Vercel Blob') + '. Add Cloudinary keys to store them in Cloudinary instead.'}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => go(s.to)} className="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-stone-200 transition hover:ring-terra-300">
            <p className="text-2xl font-semibold text-stone-900">{s.value}</p>
            <p className="mt-1 text-xs text-stone-500">{s.label}</p>
          </button>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-stone-700">Pages</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pageSchemas.map((p) => {
            const hidden = p.sections.filter((s) => draft.pages[p.id]?.[s.key]?.hidden).length
            return (
              <button key={p.id} onClick={() => go(`pages/${p.id}`)} className="flex items-center gap-3 rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-stone-200 transition hover:ring-terra-300">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-terra-50 text-terra-500"><IconGlyph name="page" /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-stone-900">{p.label}</span>
                  <span className="block text-xs text-stone-500">{p.sections.length} section{p.sections.length === 1 ? '' : 's'}{hidden ? ` · ${hidden} hidden` : ''}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <Card className="p-6 text-sm text-stone-600">
        <h3 className="font-sans text-sm font-semibold text-stone-900">How it works</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
          <li>Edit text, photos and lists. Your edits are kept in this browser until you publish.</li>
          <li>Press <strong>Preview</strong> to see the site with your changes (only you can see them).</li>
          <li>Press <strong>Publish</strong> to make them live. The site updates within about a minute.</li>
          <li>Made a mistake? <button className="text-terra-600 underline" onClick={() => go('history')}>Publish history</button> lets you bring back an earlier version.</li>
        </ol>
        <p className="mt-4 text-xs text-stone-500">To change the admin password, update ADMIN_PASSWORD in your Vercel project settings and redeploy.</p>
      </Card>
    </div>
  )
}

function SectionCard({ title, description, hidden, onToggleHidden, onReset, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className={`overflow-hidden ${hidden ? 'opacity-75' : ''}`}>
      <div className="flex items-center gap-3 px-5 py-4">
        <button onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <IconGlyph name="chevron" className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? '' : '-rotate-90'}`} />
          <span className="min-w-0">
            <span className="flex items-center gap-2 font-medium text-stone-900">
              {title}
              {hidden && <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">Hidden</span>}
            </span>
            {description && <span className="mt-0.5 block text-xs text-stone-500">{description}</span>}
          </span>
        </button>
        {onToggleHidden && (
          <label className="flex shrink-0 items-center gap-2 text-xs text-stone-500">
            <span className="hidden sm:inline">{hidden ? 'Hidden' : 'Visible'}</span>
            <Toggle checked={!hidden} onChange={(v) => onToggleHidden(!v)} label="Show this section on the site" />
          </label>
        )}
      </div>
      {open && (
        <div className="border-t border-stone-100 px-5 py-5">
          {children}
          {onReset && (
            <div className="mt-6 border-t border-stone-100 pt-4">
              <Button variant="ghost" size="sm" icon="restore" onClick={onReset}>Restore original text and photos</Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function PageEditor({ page }) {
  const { content, setAt, preview } = useAdminCtx()
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" icon="external" onClick={() => window.open(SITE_URL + page.url, '_blank', 'noopener')}>Open live page</Button>
        <Button variant="outline" size="sm" icon="eye" onClick={() => preview(page.url)}>Preview this page</Button>
      </div>
      {page.sections.map((s, i) => {
        const path = ['pages', page.id, s.key]
        const value = getIn(content, path) || {}
        const original = getIn(defaultContent, path)
        return (
          <SectionCard
            key={s.key}
            title={s.label}
            description={s.description}
            hidden={!!value.hidden}
            onToggleHidden={(h) => setAt([...path, 'hidden'], h)}
            onReset={() => window.confirm(`Put “${s.label}” back to the original text and photos?`) && setAt(path, { ...original, hidden: value.hidden })}
            defaultOpen={i === 0}
          >
            <Fields fields={s.fields} value={value} onChange={(v) => setAt(path, v)} />
          </SectionCard>
        )
      })}
    </div>
  )
}

function CollectionEditor({ col }) {
  const { content, setAt } = useAdminCtx()
  const list = content[col.id] || []
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-600">{list.length} item{list.length === 1 ? '' : 's'}</p>
        <Button variant="outline" size="sm" icon="external" onClick={() => window.open(SITE_URL + col.url, '_blank', 'noopener')}>Open live page</Button>
      </div>
      <ListEditor
        value={list}
        onChange={(v) => setAt([col.id], v)}
        fields={col.fields}
        itemLabel={col.itemLabel}
        newItem={col.newItem}
        bulkImageKey={col.bulkImageKey}
        grid={col.grid}
      />
      <div className="pt-2">
        <Button
          variant="ghost"
          size="sm"
          icon="restore"
          onClick={() => window.confirm(`Replace all ${col.label.toLowerCase()} with the original list?`) && setAt([col.id], defaultContent[col.id])}
        >
          Restore the original list
        </Button>
      </div>
    </div>
  )
}

function SettingsEditor({ schema }) {
  const { content, setAt } = useAdminCtx()
  return (
    <div className="space-y-4">
      {schema.sections.map((s, i) => {
        const value = getIn(content, s.path)
        return (
          <SectionCard key={i} title={s.label} description={s.description} defaultOpen>
            {s.list ? (
              <ListEditor value={value || []} onChange={(v) => setAt(s.path, v)} {...s.list} />
            ) : (
              <Fields fields={s.fields} value={value} onChange={(v) => setAt(s.path, v)} />
            )}
          </SectionCard>
        )
      })}
    </div>
  )
}

function History({ loadVersion, dirty }) {
  const [versions, setVersions] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    api.history().then((d) => setVersions(d.versions)).catch((e) => setError(e.message))
  }, [])

  const load = async (v) => {
    if (dirty && !window.confirm('This replaces your unpublished changes in the editor. Continue?')) return
    setBusy(v.id)
    try {
      const { content } = await api.version(v.id)
      loadVersion(content, v.savedAt)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
  if (!versions) return <div className="flex justify-center py-10"><Spinner /></div>
  if (!versions.length) return <Empty title="Nothing published yet" text="Each time you publish, a copy is kept here so you can go back to it." />

  return (
    <Card className="divide-y divide-stone-100">
      {versions.map((v, i) => (
        <div key={v.id} className="flex items-center gap-4 px-5 py-3.5">
          <IconGlyph name="history" className="h-4 w-4 shrink-0 text-stone-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-stone-900">{fmtDate(v.savedAt)}</p>
            <p className="text-xs text-stone-500">{i === 0 ? 'Live now' : 'Earlier version'}</p>
          </div>
          {i > 0 && (
            <Button variant="outline" size="sm" disabled={!!busy} onClick={() => load(v)}>
              {busy === v.id ? 'Loading…' : 'Load into editor'}
            </Button>
          )}
        </div>
      ))}
    </Card>
  )
}

