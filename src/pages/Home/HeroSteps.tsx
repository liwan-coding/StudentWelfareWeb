import { useEffect, useRef, useState } from 'react'

/** streak colours: the steps' blue, with a share of near-white sparks */
const COLORS = ['#2A9BC0', '#CDEFFA']
/** how long each particle takes to fly to its spot (ms) */
const FLIGHT = 1000

type Particle = { sx: number; sy: number; tx: number; ty: number; d: number; c: number }

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The logo's staircase in the hero tile, drawn in on load the way hatif.io draws its number:
 * particles stream out of the middle of the tile and settle into a dot grid shaped like the
 * steps, then the solid steps fade in under them and the canvas fades away.
 * The canvas is sized to the parent tile, so the parent must be positioned.
 */
export function HeroSteps({ stepsClassName, hiddenClassName, canvasClassName, canvasDoneClassName }: {
  stepsClassName: string
  hiddenClassName: string
  canvasClassName: string
  canvasDoneClassName: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stepsRef = useRef<HTMLSpanElement>(null)
  const [done, setDone] = useState(prefersReducedMotion)

  useEffect(() => {
    if (done) return
    const canvas = canvasRef.current
    const steps = stepsRef.current
    const tile = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    let raf = 0
    if (!canvas || !steps || !tile || !ctx) {
      raf = requestAnimationFrame(() => setDone(true))
      return () => cancelAnimationFrame(raf)
    }

    const w = tile.clientWidth
    const h = tile.clientHeight
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)

    // dot grid over each step, in tile coordinates
    const box = tile.getBoundingClientRect()
    const pitch = Math.max(3, Math.min(6, Math.round(steps.offsetHeight / 40)))
    const ox = w / 2
    const oy = h * 0.52
    let seed = 7
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const particles: Particle[] = []
    let maxDist = 1
    for (const bar of Array.from(steps.children)) {
      const r = bar.getBoundingClientRect()
      for (let y = r.top - box.top + pitch / 2; y < r.bottom - box.top; y += pitch) {
        for (let x = r.left - box.left + pitch / 2; x < r.right - box.left; x += pitch) {
          const a = rand() * Math.PI * 2
          const q = rand() * 40
          const dist = Math.hypot(x - ox, y - oy)
          maxDist = Math.max(maxDist, dist)
          particles.push({ tx: x, ty: y, sx: ox + Math.cos(a) * q, sy: oy + Math.sin(a) * q * 0.6, d: dist, c: rand() < 0.22 ? 1 : 0 })
        }
      }
    }
    // nearer dots leave first, with some jitter so it reads as a stream
    for (const p of particles) p.d = (p.d / maxDist) * 380 + rand() * 260

    const expo = (t: number) => 1 - Math.pow(2, -10 * t)
    const start = performance.now()
    const frame = (now: number) => {
      const elapsed = now - start
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      ctx.lineWidth = pitch * 0.5
      ctx.globalAlpha = 0.85
      let moving = false
      for (const c of [0, 1]) {
        ctx.beginPath()
        for (const p of particles) {
          if (p.c !== c) continue
          const t = Math.min(1, Math.max(0, (elapsed - p.d) / FLIGHT))
          if (t < 1) moving = true
          if (t <= 0) continue
          const head = expo(t)
          const tail = expo(Math.max(0, t - 0.05))
          ctx.moveTo(p.sx + (p.tx - p.sx) * tail, p.sy + (p.ty - p.sy) * tail)
          ctx.lineTo(p.sx + (p.tx - p.sx) * head + 0.01, p.sy + (p.ty - p.sy) * head)
        }
        ctx.strokeStyle = COLORS[c]
        ctx.stroke()
      }
      if (moving) raf = requestAnimationFrame(frame)
      else setDone(true)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [done])

  return (
    <>
      <canvas ref={canvasRef} className={`${canvasClassName} ${done ? canvasDoneClassName : ''}`} aria-hidden="true" />
      <span ref={stepsRef} className={`${stepsClassName} ${done ? '' : hiddenClassName}`} aria-hidden="true"><i /><i /><i /><i /></span>
    </>
  )
}
