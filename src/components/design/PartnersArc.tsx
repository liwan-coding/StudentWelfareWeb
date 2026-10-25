import { useEffect, useRef, type ReactNode } from 'react'
import styles from './PartnersArc.module.css'

export interface ArcPartner {
  key: string
  name: string
  logoUrl: string
  link?: string
}

interface PartnersArcProps {
  partners: ArcPartner[]
  /** heading placed under the arch */
  children: ReactNode
}

/** Fewer partners than this are repeated so the arch stays full (repeats are hidden from assistive tech). */
const MIN_CARDS = 10

/**
 * Partners as a wide half-circle of cards that gathers in, then keeps travelling
 * along the arch. The loop runs only while the stage is on screen.
 */
export function PartnersArc({ partners, children }: PartnersArcProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const cards: (ArcPartner & { repeat: boolean })[] = []
  if (partners.length > 0) {
    const total = Math.max(partners.length, MIN_CARDS)
    for (let i = 0; i < total; i++) cards.push({ ...partners[i % partners.length], repeat: i >= partners.length })
  }

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const els = Array.from(stage.querySelectorAll<HTMLElement>(`.${styles.card}`))
    const N = els.length
    if (!N) return

    let appear = 0
    let appearing = false
    let offset = 0
    let last = performance.now()
    let raf = 0
    let visible = false
    const speed = 0.022 // share of the arch travelled per second
    let table: { a: number; s: number }[] = []
    let tableKey = ''
    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

    // arc-length table so the cards keep equal gaps all along the curve
    const buildTable = (Rx: number, R: number) => {
      table = [{ a: Math.PI, s: 0 }]
      let px = -Rx, py = 0, sum = 0
      for (let j = 1; j <= 240; j++) {
        const a = Math.PI + (Math.PI * j) / 240
        const x = Math.cos(a) * Rx, y = Math.sin(a) * R
        sum += Math.hypot(x - px, y - py)
        px = x
        py = y
        table.push({ a, s: sum })
      }
      table.forEach((t) => { t.s /= sum })
    }
    const angleAt = (f: number) => {
      let lo = 0, hi = table.length - 1
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (table[mid].s < f) lo = mid
        else hi = mid
      }
      const A = table[lo], B = table[hi]
      const u = (f - A.s) / (B.s - A.s || 1)
      return A.a + (B.a - A.a) * u
    }

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (appearing && appear < 1) appear = Math.min(1, appear + dt / 1.4)
      offset = (offset + speed * dt) % 1
      const W = stage.clientWidth
      let H = stage.clientHeight
      const R0 = Math.min(W * 0.3, 290, (window.innerHeight - 72 - 56) / 1.5)
      const cw = Math.min(122, Math.max(64, R0 * 0.4))
      const needH = Math.round(R0 + cw * 1.0)
      if (Math.abs(H - needH) > 2) {
        stage.style.height = `${needH}px`
        H = needH
      }
      stage.style.setProperty('--cw', `${cw.toFixed(0)}px`)
      const cx = W / 2
      const cy = H - cw * 0.3
      const R = Math.min(R0, cy - cw * 0.62)
      const Rx = Math.min(W * 0.5 - cw * 0.6, R * 1.7) // a low, wide arch
      const key = `${Rx.toFixed(0)}x${R.toFixed(0)}`
      if (key !== tableKey) {
        buildTable(Rx, R)
        tableKey = key
      }
      const e = ease(appear)
      els.forEach((c, i) => {
        const f = (i / N + offset) % 1 // position along the arch, 0 = left end, 1 = right end
        const rad = angleAt(f)
        const k = 0.6 + 0.4 * e
        const x = cx + Math.cos(rad) * Rx * k
        const y = cy + Math.sin(rad) * R * k
        const edge = Math.min(f, 1 - f)
        const op = Math.min(1, edge / 0.07) * e
        const tilt = ((Math.atan2(Math.sin(rad) / R, Math.cos(rad) / Rx) * 180) / Math.PI + 90) * 0.55
        c.style.opacity = op.toFixed(3)
        c.style.visibility = op < 0.02 ? 'hidden' : 'visible'
        c.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg) scale(${((0.75 + 0.25 * e) * (0.86 + 0.14 * Math.min(1, edge / 0.2))).toFixed(3)})`
      })
      if (visible) raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          visible = en.isIntersecting
          if (visible) {
            appearing = true
            kick()
          }
        })
      },
      { threshold: 0.2 },
    )
    io.observe(stage)
    window.addEventListener('resize', kick)
    return () => {
      io.disconnect()
      window.removeEventListener('resize', kick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [cards.length])

  return (
    <div ref={stageRef} className={styles.stage}>
      {cards.map((p, i) => {
        const inner = p.logoUrl ? (
          <img src={p.logoUrl} alt={p.repeat ? '' : p.name} className={styles.logo} loading="lazy" />
        ) : (
          <span className={styles.name}>{p.name}</span>
        )
        return p.link ? (
          <a
            key={`${p.key}-${i}`}
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
            title={p.name}
            aria-hidden={p.repeat || undefined}
            tabIndex={p.repeat ? -1 : undefined}
          >
            {inner}
          </a>
        ) : (
          <div key={`${p.key}-${i}`} className={styles.card} title={p.name} aria-hidden={p.repeat || undefined}>
            {inner}
          </div>
        )
      })}
      <div className={styles.head}>{children}</div>
    </div>
  )
}
