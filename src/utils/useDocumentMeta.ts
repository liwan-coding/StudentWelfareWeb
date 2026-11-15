import { useEffect } from 'react'

function setMeta(selector: string, create: () => HTMLElement, attr: string, value: string): () => void {
  let el = document.head.querySelector<HTMLElement>(selector)
  const created = !el
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  const previous = el.getAttribute(attr)
  el.setAttribute(attr, value)
  return () => {
    if (created) el?.remove()
    else if (previous != null) el?.setAttribute(attr, previous)
  }
}

/**
 * Sets the tab title, meta description and canonical link while a page is mounted, then restores them.
 * This helps search engines that run JavaScript; link previews in chat apps come from the backend
 * /share/... pages instead (crawlers there do not run JS).
 */
export function useDocumentMeta(meta: { title?: string; description?: string; canonical?: string }) {
  const { title, description, canonical } = meta
  useEffect(() => {
    const undo: Array<() => void> = []
    if (title) {
      const previousTitle = document.title
      document.title = title
      undo.push(() => { document.title = previousTitle })
    }
    if (description) {
      undo.push(setMeta('meta[name="description"]', () => {
        const m = document.createElement('meta')
        m.setAttribute('name', 'description')
        return m
      }, 'content', description))
    }
    if (canonical) {
      undo.push(setMeta('link[rel="canonical"]', () => {
        const l = document.createElement('link')
        l.setAttribute('rel', 'canonical')
        return l
      }, 'href', canonical))
    }
    return () => undo.forEach((fn) => fn())
  }, [title, description, canonical])
}
