import { useEffect, useRef, useState } from 'react'

/**
 * Becomes true the first time the element enters the viewport (entrance animations run once).
 * With reduced motion it is true from the start, so content shows in its final state.
 */
export function useInViewOnce<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, threshold])

  return [ref, inView] as const
}
