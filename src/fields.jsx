import { useId, useRef, useState } from 'react'
import Icon, { iconNames } from './shared/components/Icon'
import { useAdmin, getIn, setIn, splitKey } from './context'
import { Button, IconGlyph, Toggle } from './ui'

export const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

/** Renders a group of fields that edit one object. */
export function Fields({ fields, value, onChange, siblings }) {
  const obj = value || {}
  return (
    <div className="space-y-5">
      {fields.map((f) => {
        const path = splitKey(f.k)
        return (
          <Field
            key={f.k}
            field={f}
            value={getIn(obj, path)}
            parent={obj}
            siblings={siblings}
            onChange={(v) => onChange(setIn(obj, path, v))}
          />
        )
      })}
    </div>
  )
}

function Label({ field, htmlFor }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-stone-800">{field.label}</label>
      {field.help && <p className="mt-0.5 text-xs text-stone-500">{field.help}</p>}
    </div>
  )
}

const autoRows = (text, min = 3) => Math.min(14, Math.max(min, String(text || '').split('\n').length + Math.floor(String(text || '').length / 90)))

export function Field({ field, value, onChange, parent, siblings }) {
  const id = useId()
  switch (field.t) {
    case 'text': {
      const options = field.suggest && siblings ? [...new Set(siblings.map((s) => s?.[field.suggest]).filter(Boolean))] : null
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <input id={id} className="admin-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} list={options ? `${id}-list` : undefined} />
          {options && (
            <datalist id={`${id}-list`}>
              {options.map((o) => <option key={o} value={o} />)}
            </datalist>
          )}
        </div>
      )
    }
    case 'slug':
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <div className="flex gap-2">
            <input
              id={id}
              className="admin-input font-mono text-xs"
              value={value ?? ''}
              placeholder={slugify(parent?.[field.from])}
              onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            />
            <Button variant="outline" size="sm" onClick={() => onChange(slugify(parent?.[field.from]))}>From name</Button>
          </div>
        </div>
      )
    case 'readonly':
      return (
        <div>
          <Label field={field} />
          <p className="inline-block rounded-md bg-stone-100 px-2.5 py-1 font-mono text-xs text-stone-600">{String(value ?? '')}</p>
        </div>
      )
    case 'textarea':
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <textarea id={id} className="admin-input resize-y leading-relaxed" rows={autoRows(value)} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </div>
      )
    case 'lines': {
      const text = Array.isArray(value) ? value.join('\n') : value ?? ''
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <textarea id={id} className="admin-input resize-y leading-relaxed" rows={autoRows(text, 2)} value={text} onChange={(e) => onChange(e.target.value === '' ? [] : e.target.value.split('\n'))} />
        </div>
      )
    }
    case 'paragraphs': {
      const text = Array.isArray(value) ? value.join('\n\n') : value ?? ''
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <textarea id={id} className="admin-input resize-y leading-relaxed" rows={autoRows(text, 5)} value={text} onChange={(e) => onChange(e.target.value === '' ? [] : e.target.value.split(/\n[ \t]*\n/))} />
        </div>
      )
    }
    case 'number':
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <input id={id} type="number" className="admin-input w-40" value={value ?? 0} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
        </div>
      )
    case 'toggle':
      return (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-stone-50 px-3 py-2.5 ring-1 ring-stone-200">
          <div>
            <p className="text-[13px] font-medium text-stone-800">{field.label}</p>
            {field.help && <p className="text-xs text-stone-500">{field.help}</p>}
          </div>
          <Toggle checked={!!value} onChange={onChange} label={field.label} />
        </div>
      )
    case 'select':
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <select id={id} className="admin-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )
    case 'icon':
      return (
        <div>
          <Label field={field} />
          <div className="flex flex-wrap gap-1.5">
            {iconNames.map((n) => (
              <button
                key={n}
                type="button"
                title={n}
                onClick={() => onChange(n)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 transition ${value === n ? 'bg-terra-500 text-white ring-terra-500' : 'bg-white text-stone-600 ring-stone-200 hover:ring-terra-300'}`}
              >
                <Icon name={n} className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
      )
    case 'image':
      return <ImageField field={field} value={value} onChange={onChange} />
    case 'images':
      return <ImagesField field={field} value={value} onChange={onChange} />
    case 'list':
      return (
        <div>
          <Label field={field} />
          <ListEditor
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            fields={field.fields}
            itemLabel={field.itemLabel}
            newItem={field.newItem}
            bulkImageKey={field.bulkImageKey}
            nested
          />
        </div>
      )
    default:
      return null
  }
}

function UploadButton({ onUploaded, multiple = false, label = 'Upload' }) {
  const { media } = useAdmin()
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" icon="upload" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Uploading…' : label}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={async (e) => {
          const files = e.target.files
          e.target.value = ''
          setBusy(true)
          const items = await media.uploadFiles(files)
          setBusy(false)
          if (items.length) onUploaded(items.map((i) => i.url))
        }}
      />
    </>
  )
}

export function ImageField({ field, value, onChange }) {
  const { pickImages } = useAdmin()
  const choose = async () => {
    const urls = await pickImages({ current: value })
    if (urls?.length) onChange(urls[0])
  }
  return (
    <div>
      <Label field={field} />
      <div className="flex flex-wrap items-start gap-3">
        <button type="button" onClick={choose} className="group relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200 hover:ring-terra-400">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-stone-400">
              <IconGlyph name="image" className="h-6 w-6" />
              No photo
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-stone-900/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Change</span>
        </button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" icon="image" onClick={choose}>Choose</Button>
          <UploadButton onUploaded={(urls) => onChange(urls[0])} />
          {value && <Button variant="ghost" size="sm" onClick={() => onChange('')}>Remove</Button>}
        </div>
      </div>
    </div>
  )
}

export function ImagesField({ field, value, onChange }) {
  const { pickImages } = useAdmin()
  const list = Array.isArray(value) ? value : []
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div>
      <Label field={field} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {list.map((u, i) => (
          <div key={`${u}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
            <img src={u} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-stone-900/70 px-1.5 py-0.5 text-[10px] text-white">First</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-stone-900/70 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/90 p-1 text-stone-700" aria-label="Move left"><IconGlyph name="up" className="h-3 w-3 -rotate-90" /></button>
                <button type="button" onClick={() => move(i, 1)} className="rounded bg-white/90 p-1 text-stone-700" aria-label="Move right"><IconGlyph name="up" className="h-3 w-3 rotate-90" /></button>
              </div>
              <button type="button" onClick={() => onChange(list.filter((_, k) => k !== i))} className="rounded bg-white/90 p-1 text-red-600" aria-label="Remove"><IconGlyph name="trash" className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={async () => {
            const urls = await pickImages({ multiple: true })
            if (urls?.length) onChange([...list, ...urls])
          }}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 text-xs text-stone-500 hover:border-terra-400 hover:text-terra-600"
        >
          <IconGlyph name="plus" className="h-5 w-5" />
          Add photos
        </button>
      </div>
      <div className="mt-2">
        <UploadButton multiple label="Upload new" onUploaded={(urls) => onChange([...list, ...urls])} />
      </div>
    </div>
  )
}

/** Editable list of objects: add, duplicate, reorder, delete, expand to edit. */
export function ListEditor({ value, onChange, fields, itemLabel = () => 'Item', newItem = {}, bulkImageKey, fixed = false, grid = false, nested = false }) {
  const { pickImages } = useAdmin()
  const [open, setOpen] = useState(() => new Set())
  const imageKey = fields.find((f) => f.t === 'image')?.k

  const toggle = (i) =>
    setOpen((s) => {
      const n = new Set(s)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
  const update = (i, item) => onChange(value.map((v, k) => (k === i ? item : v)))
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
    setOpen((s) => {
      const n = new Set()
      s.forEach((x) => n.add(x === i ? j : x === j ? i : x))
      return n
    })
  }
  const remove = (i) => {
    if (!window.confirm(`Delete “${itemLabel(value[i]) || 'this item'}”?`)) return
    onChange(value.filter((_, k) => k !== i))
    setOpen(new Set())
  }
  const duplicate = (i) => {
    const copy = JSON.parse(JSON.stringify(value[i]))
    if ('slug' in copy) copy.slug = ''
    onChange([...value.slice(0, i + 1), copy, ...value.slice(i + 1)])
    setOpen(new Set([i + 1]))
  }
  const add = () => {
    onChange([...value, JSON.parse(JSON.stringify(newItem))])
    setOpen(new Set([value.length]))
  }
  const addPhotos = async () => {
    const urls = await pickImages({ multiple: true })
    if (!urls?.length) return
    onChange([...value, ...urls.map((u) => ({ ...JSON.parse(JSON.stringify(newItem)), [bulkImageKey]: u }))])
  }

  const controls = (i) => (
    <div className="flex shrink-0 items-center gap-0.5">
      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30" aria-label="Move up"><IconGlyph name="up" className="h-4 w-4" /></button>
      <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30" aria-label="Move down"><IconGlyph name="down" className="h-4 w-4" /></button>
      {!fixed && <button type="button" onClick={() => duplicate(i)} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Duplicate" title="Duplicate"><IconGlyph name="copy" className="h-4 w-4" /></button>}
      {!fixed && <button type="button" onClick={() => remove(i)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50" aria-label="Delete" title="Delete"><IconGlyph name="trash" className="h-4 w-4" /></button>}
    </div>
  )

  return (
    <div className="space-y-2">
      {value.length === 0 && <p className="rounded-lg border border-dashed border-stone-300 px-4 py-5 text-center text-xs text-stone-500">Nothing here yet.</p>}

      {grid ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {value.map((item, i) => (
            <div key={i} className="rounded-xl bg-white p-3 ring-1 ring-stone-200">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-stone-400">#{i + 1}</span>
                {controls(i)}
              </div>
              <Fields fields={fields} value={item} onChange={(v) => update(i, v)} siblings={value} />
            </div>
          ))}
        </div>
      ) : (
        value.map((item, i) => {
          const isOpen = open.has(i)
          const thumb = imageKey ? getIn(item, splitKey(imageKey)) : null
          return (
            <div key={i} className={`overflow-hidden rounded-xl ring-1 ${nested ? 'bg-stone-50 ring-stone-200' : 'bg-white ring-stone-200'} ${item?.hidden ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 px-3 py-2">
                <button type="button" onClick={() => toggle(i)} className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left">
                  <IconGlyph name="chevron" className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  {imageKey && (
                    <span className="h-9 w-12 shrink-0 overflow-hidden rounded-md bg-stone-200">
                      {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
                    </span>
                  )}
                  <span className="truncate text-sm font-medium text-stone-800">{itemLabel(item) || 'Untitled'}</span>
                  {item?.hidden && <span className="shrink-0 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] text-stone-600">hidden</span>}
                </button>
                {controls(i)}
              </div>
              {isOpen && (
                <div className="border-t border-stone-200 px-4 py-4">
                  <Fields fields={fields} value={item} onChange={(v) => update(i, v)} siblings={value} />
                </div>
              )}
            </div>
          )
        })
      )}

      {!fixed && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" icon="plus" onClick={add}>Add</Button>
          {bulkImageKey && <Button variant="outline" size="sm" icon="image" onClick={addPhotos}>Add from photos</Button>}
        </div>
      )}
    </div>
  )
}
