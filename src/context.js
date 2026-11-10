import { createContext, useContext } from 'react'

/** Shared admin state: the draft content, media library, picker and toasts. */
export const AdminContext = createContext(null)
export const useAdmin = () => useContext(AdminContext)

/** Read a value at a path like ['pages', 'home', 'hero'] plus an optional dotted key. */
export function getIn(obj, path) {
  return path.reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

/** Immutable set: returns a copy of obj with value placed at path. */
export function setIn(obj, path, value) {
  if (!path.length) return value
  const [k, ...rest] = path
  const base = obj == null ? (typeof k === 'number' ? [] : {}) : obj
  const copy = Array.isArray(base) ? [...base] : { ...base }
  copy[k] = setIn(base[k], rest, value)
  return copy
}

export const splitKey = (k) => String(k).split('.')
