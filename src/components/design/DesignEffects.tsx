import { useEffect, useRef } from 'react'
import styles from './DesignEffects.module.css'

/** Calm drifting colour fields behind the page; a soft spot follows the pointer. */
function CalmBackground() {
  const spotRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const spot = spotRef.current
      if (!spot) return
      spot.style.setProperty('--sx', `${e.clientX - 260}px`)
      spot.style.setProperty('--sy', `${e.clientY - 260}px`)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className={styles.calm} aria-hidden="true">
      <i className={styles.c1} />
      <i className={styles.c2} />
      <i className={styles.c3} />
      <i className={styles.spot} ref={spotRef} />
    </div>
  )
}

const TRAIL_COLORS = ['95,227,230', '127,208,230', '231,166,216', '162,69,140', '50,161,191']

interface Particle { x: number; y: number; vx: number; vy: number; life: number; s: number; c: string }

/** Paper-plane cursor with a trail of dots — desktop mouse only. */
function CursorTrail() {
  const planeRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
    const plane = planeRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!fine || !plane || !canvas || !ctx) return

    const root = document.documentElement
    root.classList.add('fx-cursor')
    let W = 0, H = 0
    const parts: Particle[] = []
    let px = -100, py = -100, lx = -100, ly = -100, ang = 0, cur = 0, raf = 0

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const tick = () => {
      raf = 0
      cur += (((ang - cur + 540) % 360) - 180) * 0.25
      plane.style.transform = `translate(${px}px,${py}px) rotate(${cur.toFixed(1)}deg)`
      ctx.clearRect(0, 0, W, H)
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i]
        q.x += q.vx
        q.y += q.vy
        q.vx *= 0.97
        q.vy *= 0.97
        q.life -= 0.018
        if (q.life <= 0) {
          parts.splice(i, 1)
          continue
        }
        ctx.fillStyle = `rgba(${q.c},${(q.life * 0.85).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(q.x, q.y, q.s * q.life + 0.4, 0, 6.2832)
        ctx.fill()
      }
      if (parts.length || Math.abs(((ang - cur + 540) % 360) - 180) > 0.5) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      px = e.clientX
      py = e.clientY
      plane.classList.add(styles.planeOn)
      const dx = px - lx, dy = py - ly
      const sp = Math.sqrt(dx * dx + dy * dy)
      if (sp > 1.5) ang = (Math.atan2(dy, dx) * 180) / Math.PI + 45
      const n = Math.min(5, Math.floor(sp / 6) + 1)
      for (let k = 0; k < n; k++) {
        parts.push({
          x: px - (dx * k) / n + (Math.random() * 6 - 3),
          y: py - (dy * k) / n + (Math.random() * 6 - 3),
          vx: -dx * 0.02 + (Math.random() - 0.5) * 0.8,
          vy: -dy * 0.02 + (Math.random() - 0.5) * 0.8 + 0.15,
          life: 1,
          s: Math.random() * 1.8 + 0.8,
          c: TRAIL_COLORS[(Math.random() * TRAIL_COLORS.length) | 0],
        })
      }
      if (parts.length > 260) parts.splice(0, parts.length - 260)
      lx = px
      ly = py
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onLeave = () => plane.classList.remove(styles.planeOn)
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null
      plane.classList.toggle(styles.planeBig, !!target?.closest?.('a,button'))
    }

    size()
    window.addEventListener('resize', size)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerover', onOver)
    return () => {
      root.classList.remove('fx-cursor')
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', size)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerover', onOver)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className={styles.trail} aria-hidden="true" />
      <div ref={planeRef} className={styles.plane} aria-hidden="true">
        <svg viewBox="0 0 40 40">
          <defs>
            <linearGradient id="ds-plane-pl" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5FE3E6" />
              <stop offset=".6" stopColor="#7FD0E6" />
              <stop offset="1" stopColor="#E7A6D8" />
            </linearGradient>
            <pattern id="ds-plane-stripes" width="2.4" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
              <rect width="1.3" height="40" fill="url(#ds-plane-pl)" />
            </pattern>
            <linearGradient id="ds-plane-plf" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5FE3E6" />
              <stop offset="1" stopColor="#E7A6D8" />
            </linearGradient>
          </defs>
          <path d="M38 2L2 17l14 5z" fill="url(#ds-plane-plf)" opacity=".95" />
          <path d="M38 2L16 22l4 16z" fill="url(#ds-plane-plf)" opacity=".75" />
          <path d="M38 2L2 17l14 5zM38 2L16 22l4 16z" fill="url(#ds-plane-stripes)" opacity=".9" />
        </svg>
      </div>
    </>
  )
}

/**
 * Page-wide effects for the redesigned pages: calm background, paper-plane
 * cursor, and the pointer light inside boxes (.ds-card / .ds-ringbox).
 */
export function DesignEffects() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const box = (e.target as Element | null)?.closest?.('.ds-card, .ds-ringbox') as HTMLElement | null
      if (!box) return
      const r = box.getBoundingClientRect()
      box.style.setProperty('--mx', `${e.clientX - r.left}px`)
      box.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => document.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <>
      <CalmBackground />
      <CursorTrail />
    </>
  )
}
