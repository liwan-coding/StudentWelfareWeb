import { useEffect, useRef } from 'react'
import { createSilk } from './silk'

interface SilkCanvasProps {
  className?: string
}

/** Silk shader canvas; its animation loop pauses whenever it is off screen. */
export function SilkCanvas({ className }: SilkCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const silk = createSilk(canvas)
    if (!silk) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? silk.start() : silk.stop()))
    })
    io.observe(canvas)
    return () => {
      io.disconnect()
      silk.destroy()
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
