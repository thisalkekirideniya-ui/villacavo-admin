// Small building blocks for the admin screens.

const glyphs = {
  dashboard: 'M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z',
  page: 'M7 3h7l5 5v13H7V3zM14 3v5h5M10 13h6M10 17h6',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9.5a1.5 1.5 0 100-.01',
  history: 'M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8M3 3v5h5M12 7v5l4 2',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  eyeOff: 'M17.9 17.9A10 10 0 0112 19c-6.5 0-10-7-10-7a18 18 0 015.1-5.9M9.9 4.2A9 9 0 0112 4c6.5 0 10 7 10 7a18 18 0 01-2.2 3.2M14.1 14.1a3 3 0 01-4.2-4.2M2 2l20 20',
  external: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  chevron: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  menu: 'M3 6h18M3 12h18M3 18h18',
  nav: 'M4 6h16M4 12h10M4 18h7',
  restore: 'M3 12a9 9 0 109-9M3 4v5h5',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
}

export function IconGlyph({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={glyphs[name] || glyphs.page} />
    </svg>
  )
}

export function Button({ variant = 'primary', size = 'md', className = '', icon, children, ...rest }) {
  const base = 'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }
  const variants = {
    primary: 'bg-terra-500 text-white shadow-sm hover:bg-terra-600',
    dark: 'bg-stone-900 text-white shadow-sm hover:bg-stone-700',
    outline: 'border border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50',
    ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  }
  return (
    <button type="button" className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {icon && <IconGlyph name={icon} className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      {children}
    </button>
  )
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-stone-300 border-t-terra-500 ${className}`} aria-label="Loading" />
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-terra-500' : 'bg-stone-300'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 ${className}`}>{children}</div>
}

export function Empty({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 px-6 py-12 text-center">
      <p className="text-sm font-medium text-stone-700">{title}</p>
      {text && <p className="mt-1 text-xs text-stone-500">{text}</p>}
    </div>
  )
}
