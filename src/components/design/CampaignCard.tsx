import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useInViewOnce } from './useInViewOnce'
import styles from './CampaignCard.module.css'

interface CampaignCardProps {
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
  /** false when a parent already animates the entrance (e.g. the Train grid) */
  reveal?: boolean
}

const R = 52
const CIRC = 2 * Math.PI * R

/** Campaign card: an Activity-style ring closes to the funded share once the card is in view. */
export function CampaignCard(props: CampaignCardProps) {
  const { percent, title, raisedLabel, goalLabel, raisedText, goalText, donateLabel, donateTo, percentSign, index, reveal = true } = props
  const [cardRef, inView] = useInViewOnce<HTMLElement>(0.3)
  // with reduced motion the ring shows its level straight away instead of waiting for the viewport
  const [reduceMotion] = useState(() => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const shown = inView || reduceMotion
  const numRef = useRef<HTMLSpanElement>(null)
  const target = Math.max(0, Math.min(100, Math.round(percent)))
  const done = target >= 100

  // count the number up alongside the ring
  useEffect(() => {
    if (!shown) return
    const el = numRef.current
    if (!el) return
    if (reduceMotion) {
      el.textContent = String(target)
      return
    }
    let raf = 0
    let t0: number | null = null
    const dur = 1200
    const step = (now: number) => {
      if (t0 === null) t0 = now
      const k = Math.min(1, (now - t0) / dur)
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [shown, target, reduceMotion])

  const offset = shown ? CIRC * (1 - target / 100) : CIRC
  const style = { '--i': index % 3 } as CSSProperties

  return (
    <article
      ref={cardRef}
      className={`ds-card ${reveal ? `ds-reveal ${shown ? 'ds-in' : ''}` : ''} ${styles.card} ${done ? styles.done : ''}`}
      style={style}
    >
      <div className={styles.ringWrap}>
        <svg className={styles.ring} viewBox="0 0 120 120" aria-hidden="true">
          <circle className={styles.track} cx="60" cy="60" r={R} />
          <circle
            className={styles.bar}
            cx="60"
            cy="60"
            r={R}
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
        </svg>
        <span className={styles.pct}>
          <span ref={numRef}>0</span>
          <small>{percentSign}</small>
        </span>
      </div>
      <div className={styles.body}>
        <h3>{title}</h3>
        <dl className={styles.meta}>
          <div>
            <dt>{raisedLabel}</dt>
            <dd>{raisedText}</dd>
          </div>
          <div>
            <dt>{goalLabel}</dt>
            <dd>{goalText}</dd>
          </div>
        </dl>
        <Link to={donateTo} className={`ds-btn ds-btn-filled ds-btn-block ${styles.donate}`}>
          {donateLabel}
        </Link>
      </div>
    </article>
  )
}
