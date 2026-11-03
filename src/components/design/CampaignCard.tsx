import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useInViewOnce } from './useInViewOnce'
import styles from './CampaignCard.module.css'

interface CampaignCardProps {
  /** Funded share 0–100 (same percent as CampaignAmountGoal) */
  percent: number
  title: string
  description?: string
  imageUrl?: string
  raisedLabel: string
  goalLabel: string
  raisedText: string
  goalText: string
  donateLabel: string
  donateTo: string
  percentSign: string
  /** small yellow tag on the photo, e.g. "Urgent" */
  tag?: string
  index: number
  /** wide layout: photo beside the text */
  feature?: boolean
  /** false when a parent already animates the entrance (e.g. the Train grid) */
  reveal?: boolean
}

const STEPS = 10

/**
 * Campaign card. Progress is drawn as a ten-step staircase: each step is
 * a tenth of the goal, climbed from the start edge. The photo carries the
 * logo's stepped corner. The whole card is one link to the donate page.
 */
export function CampaignCard(props: CampaignCardProps) {
  const {
    percent, title, description, imageUrl, raisedLabel, goalLabel, raisedText, goalText,
    donateLabel, donateTo, percentSign, tag, index, feature = false, reveal = true,
  } = props
  const [ref, inView] = useInViewOnce<HTMLElement>(0.25)
  const pct = Math.max(0, Math.min(100, Math.round(percent)))
  const climbed = (pct / 100) * STEPS

  return (
    <article
      ref={ref}
      className={[
        'ds-card',
        styles.card,
        feature ? styles.feature : '',
        reveal ? `ds-reveal ${inView ? 'ds-in' : ''}` : '',
        inView || !reveal ? styles.on : '',
      ].join(' ')}
      style={{ '--i': index % 3 } as CSSProperties}
    >
      <div className={styles.media}>
        {imageUrl ? (
          <img src={imageUrl} alt="" loading={index < 2 ? 'eager' : 'lazy'} decoding="async" />
        ) : (
          <span className={styles.noImage} aria-hidden="true" />
        )}
        {tag && <span className={`ds-badge ${styles.tag}`}>{tag}</span>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={donateTo} className={styles.link}>{title}</Link>
        </h3>
        {description && <p className={styles.desc}>{description}</p>}

        <div className={styles.progress}>
          <div
            className={styles.climb}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={raisedLabel}
          >
            {Array.from({ length: STEPS }, (_, i) => {
              const fill = Math.max(0, Math.min(1, climbed - i))
              return (
                <i key={i} style={{ '--h': (i + 1) / STEPS, '--f': fill, '--d': i } as CSSProperties}>
                  <b />
                </i>
              )
            })}
          </div>
          <p className={styles.pct}>
            <span className="ds-num">{pct}</span>
            <small>{percentSign}</small>
          </p>
        </div>

        <dl className={styles.figures}>
          <div>
            <dt>{raisedLabel}</dt>
            <dd className="ds-num">{raisedText}</dd>
          </div>
          <div>
            <dt>{goalLabel}</dt>
            <dd className="ds-num">{goalText}</dd>
          </div>
        </dl>

        <span className={styles.cta} aria-hidden="true">
          {donateLabel}
          <svg className="ds-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </span>
      </div>
    </article>
  )
}
