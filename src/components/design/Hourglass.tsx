import { useEffect, useId, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { HourglassArt } from './HourglassArt'
import { FxDot } from './FxDot'
import { useInViewOnce } from './useInViewOnce'
import styles from './Hourglass.module.css'

interface HourglassCardProps {
  /** Fill level 0–100 (same percent as CampaignAmountGoal) */
  percent: number
  title: string
  raisedLabel: string
  goalLabel: string
  raisedText: string
  goalText: string
  donateLabel: string
  donateTo: string
  percentSign: string
  index: number
}

/* level geometry from the design */
const TOP_FULL = 34
const TOP_EMPTY = 166
const BOT_EMPTY = 318
const BOT_RISE = 30

function surf(x: number, t: number, amp: number, ph: number) {
  return (
    amp * (Math.sin(x * 0.055 + t * 1.9 + ph) * 0.6 + Math.sin(x * 0.11 - t * 2.7 + ph * 1.7) * 0.28 + Math.sin(x * 0.023 + t * 0.9) * 0.5) +
    Math.sin(t * 0.8 + ph) * (x - 120) * 0.02 * amp
  )
}

/** `startLift` lowers only the first point (the design does this for the front wave) */
function linePath(t: number, amp: number, ph: number, startLift = 0) {
  let d = `M20 ${(surf(20, t, amp, ph) + startLift).toFixed(2)}`
  for (let x = 26; x <= 220; x += 6) d += `L${x} ${surf(x, t, amp, ph).toFixed(2)}`
  return d
}

function wavePath(t: number, amp: number, ph: number, h: number, startLift = 0) {
  return `${linePath(t, amp, ph, startLift)}V${h}H20Z`
}

/** Confetti burst when an initiative reaches 100%. */
function burst(stage: HTMLElement) {
  const c = document.createElement('canvas')
  c.className = styles.burst
  stage.appendChild(c)
  const r = stage.getBoundingClientRect()
  const d = Math.min(window.devicePixelRatio || 1, 2)
  c.width = r.width * d
  c.height = r.height * d
  const x = c.getContext('2d')
  if (!x) {
    c.remove()
    return
  }
  x.scale(d, d)
  const ox = r.width / 2
  const oy = r.height * 0.55
  const cols = ['#D47EC0', '#A2458C', '#32A1BF', '#7FD0E6', '#FFD27A']
  const ps = Array.from({ length: 54 }, (_, i) => {
    const a = Math.random() * Math.PI * 2
    const sp = 2 + Math.random() * 4.5
    return { x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.4, l: 1, c: cols[i % 5], r: 2 + Math.random() * 2.6, st: i % 3 === 0 }
  })
  const frame = () => {
    x.clearRect(0, 0, r.width, r.height)
    let alive = false
    ps.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.11
      p.vx *= 0.985
      p.l -= 0.015
      if (p.l <= 0) return
      alive = true
      x.globalAlpha = p.l
      x.fillStyle = p.c
      if (p.st) {
        x.save()
        x.translate(p.x, p.y)
        x.rotate(p.l * 6)
        x.beginPath()
        for (let k = 0; k < 5; k++) {
          x.lineTo(Math.cos(k * 1.2566) * p.r * 1.8, Math.sin(k * 1.2566) * p.r * 1.8)
          x.lineTo(Math.cos(k * 1.2566 + 0.628) * p.r * 0.7, Math.sin(k * 1.2566 + 0.628) * p.r * 0.7)
        }
        x.closePath()
        x.fill()
        x.restore()
      } else {
        x.beginPath()
        x.arc(p.x, p.y, p.r, 0, 6.283)
        x.fill()
      }
    })
    if (alive) requestAnimationFrame(frame)
    else c.remove()
  }
  frame()
}

/**
 * Campaign card as an hourglass: donations drip from the neck into the lower bulb,
 * lifting a student who studies at a desk; at 100% the student cheers and tosses the cap.
 */
export function HourglassCard(props: HourglassCardProps) {
  const { percent, title, raisedLabel, goalLabel, raisedText, goalText, donateLabel, donateTo, percentSign, index } = props
  const rawId = useId()
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const [cardRef, shown] = useInViewOnce<HTMLElement>(0.25)
  const stageRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const target = Math.max(0, Math.min(100, percent))

  useEffect(() => {
    const card = cardRef.current
    const stage = stageRef.current
    const g = stage?.querySelector('svg')
    if (!card || !stage || !g) return
    const q = <T extends Element>(cls: string) => g.querySelector(`.${cls}`) as T | null
    const lqTop = q<SVGGElement>(styles.lqTop)
    const lqBot = q<SVGGElement>(styles.lqBot)
    const student = q<SVGGElement>(styles.student)
    const drops = Array.from(g.querySelectorAll<SVGPathElement>(`.${styles.drop}`))
    const wTop = q<SVGPathElement>(styles.wTop)
    const wBack = q<SVGPathElement>(styles.wBack)
    const wFront = q<SVGPathElement>(styles.wFront)
    const wFoam = q<SVGPathElement>(styles.wFoam)
    const btn = card.querySelector<HTMLElement>('[data-donate]')

    const apply = (p: number) => {
      const ty = TOP_FULL + (TOP_EMPTY - TOP_FULL) * (p / 100)
      const by = BOT_EMPTY - BOT_RISE * (p / 100)
      if (lqTop) lqTop.style.transform = `translateY(${ty.toFixed(1)}px)`
      if (lqBot) lqBot.style.transform = `translateY(${by.toFixed(1)}px)`
      if (student) student.style.transform = `translateY(${(by - BOT_EMPTY).toFixed(1)}px)`
      drops.forEach((dr) => dr.style.setProperty('--fall', `${(by - 178).toFixed(0)}px`))
    }
    apply(0)

    const timers: number[] = []
    let cheerInterval = 0
    const cheer = () => {
      card.classList.remove(styles.cheer)
      void card.offsetWidth
      card.classList.add(styles.cheer)
      timers.push(window.setTimeout(() => burst(stage), 350))
      timers.push(window.setTimeout(() => card.classList.remove(styles.cheer), 2600))
    }

    // fill up to the real level once the card is well in view
    let playRaf = 0
    let played = false
    const play = () => {
      played = true
      g.classList.add(styles.drip)
      let t0: number | null = null
      const dur = 2600
      const step = (now: number) => {
        if (t0 === null) t0 = now
        const k = Math.min(1, (now - t0) / dur)
        const p = target * (1 - Math.pow(1 - k, 3))
        apply(p)
        if (numRef.current) numRef.current.textContent = String(Math.round(p))
        if (k < 1) playRaf = requestAnimationFrame(step)
        else if (target >= 100) {
          card.classList.add(styles.done)
          g.classList.remove(styles.drip)
          cheer()
          cheerInterval = window.setInterval(cheer, 6000)
        }
      }
      playRaf = requestAnimationFrame(step)
    }
    const playIo = new IntersectionObserver(
      (entries) => {
        if (!played && entries.some((e) => e.isIntersecting)) {
          playIo.disconnect()
          play()
        }
      },
      { threshold: 0.4 },
    )
    playIo.observe(card)

    // living liquid: redrawn every frame only while the card is on screen
    let waveRaf = 0
    let visible = false
    const t0w = performance.now()
    const waveTick = (now: number) => {
      waveRaf = 0
      const t = (now - t0w) / 1000
      const a = g.classList.contains(styles.pour) ? 5.2 : 3.4
      wTop?.setAttribute('d', wavePath(t, a * 0.8, 0, 200))
      wBack?.setAttribute('d', wavePath(t * 0.8, a * 1.15, 2.1, 120))
      wFront?.setAttribute('d', wavePath(t, a, 0.6, 120, 2))
      wFoam?.setAttribute('d', linePath(t, a, 0.6))
      if (visible) waveRaf = requestAnimationFrame(waveTick)
    }
    const waveIo = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting)
      if (visible && !waveRaf) waveRaf = requestAnimationFrame(waveTick)
    })
    waveIo.observe(card)

    // hovering the donate button pours a little: faster drops and a preview of the next level
    const onEnter = () => {
      if (target >= 100) return
      g.classList.add(styles.pour)
      apply(Math.min(100, target + 6))
    }
    const onLeave = () => {
      if (target >= 100) return
      g.classList.remove(styles.pour)
      apply(played ? target : 0)
    }
    const onClick = () => {
      if (target >= 100) cheer()
    }
    btn?.addEventListener('pointerenter', onEnter)
    btn?.addEventListener('pointerleave', onLeave)
    btn?.addEventListener('click', onClick)

    return () => {
      playIo.disconnect()
      waveIo.disconnect()
      cancelAnimationFrame(playRaf)
      cancelAnimationFrame(waveRaf)
      window.clearInterval(cheerInterval)
      timers.forEach((tid) => window.clearTimeout(tid))
      btn?.removeEventListener('pointerenter', onEnter)
      btn?.removeEventListener('pointerleave', onLeave)
      btn?.removeEventListener('click', onClick)
      card.classList.remove(styles.done, styles.cheer)
      g.classList.remove(styles.drip, styles.pour)
    }
  }, [target, cardRef])

  const style = { '--i': index % 3, '--ring-delay': `${-(index % 3) * 2.3}s` } as CSSProperties

  return (
    <article ref={cardRef} className={`ds-card ds-reveal ${shown ? 'ds-in' : ''} ${styles.card}`} style={style}>
      <div ref={stageRef} className={styles.stage}>
        <span className={styles.pct}>
          <span ref={numRef}>0</span>
          {percentSign}
        </span>
        <HourglassArt id={id} c={styles as unknown as Parameters<typeof HourglassArt>[0]['c']} />
      </div>
      <div className={styles.body}>
        <h3>{title}</h3>
        <div className={styles.meta}>
          <span>
            {raisedLabel} <b>{raisedText}</b>
          </span>
          <span>
            {goalLabel} <b>{goalText}</b>
          </span>
        </div>
        <Link to={donateTo} className={`ds-btn ds-btn-ink ${styles.donate}`} data-donate>
          {donateLabel}
        </Link>
      </div>
      <FxDot index={index} />
    </article>
  )
}
