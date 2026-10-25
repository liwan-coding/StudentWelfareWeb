import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { PageHero } from '../../components/design/PageHero'
import { useInViewOnce } from '../../components/design/useInViewOnce'
import styles from './About.module.css'

const objectiveKeys = ['objective1', 'objective2', 'objective3', 'objective4'] as const
const legalStatusKeys = ['legalStatus1', 'legalStatus2', 'legalStatus3', 'legalStatus4', 'legalStatus5'] as const

/** A block that fades up into view once. */
function Reveal({ as: Tag = 'div', className = '', style, children, ...rest }: {
  as?: 'div' | 'article'
  className?: string
  style?: CSSProperties
  children: ReactNode
  'aria-labelledby'?: string
}) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>(0.15)
  return (
    <Tag ref={ref} className={`ds-reveal ${inView ? 'ds-in' : ''} ${className}`.trim()} style={style} {...rest}>
      {children}
    </Tag>
  )
}

/** SF Symbols–style line icon. */
function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const pillarIcons = {
  vision: (
    <Glyph>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Glyph>
  ),
  mission: (
    <Glyph>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4L17 12H5" />
    </Glyph>
  ),
  targetAudience: (
    <Glyph>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </Glyph>
  ),
  accreditation: (
    <Glyph>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z" />
      <path d="m9 12 2 2 4-4" />
    </Glyph>
  ),
}

const objectiveIcons = [
  <Glyph key="cap">
    <path d="M22 10 12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c3 2 9 2 12 0v-5" />
  </Glyph>,
  <Glyph key="book">
    <path d="M4 19V5a2 2 0 0 1 2-2h12v14H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h12" />
    <path d="M12 3v10" />
  </Glyph>,
  <Glyph key="grow">
    <path d="M5 20v-7M12 20V9M19 20V4" />
  </Glyph>,
  <Glyph key="heart">
    <path d="M20.8 8.6a5.5 5.5 0 0 0-7.8 0L12 9.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
  </Glyph>,
]

function TickIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

const pillarKeys = ['vision', 'mission', 'targetAudience', 'accreditation'] as const

export function About() {
  const { t } = useTranslation('common')
  const [objRef, objIn] = useInViewOnce<HTMLUListElement>(0.15)

  return (
    <PageLayout noPadding design>
      <div className={styles.page}>
        <section aria-labelledby="about-title">
          <PageHero id="about-title" title={t('nav.about')} subtitle={t('about.subtitle')} />
        </section>

        {/* intro statement */}
        <section className={`${styles.section} ${styles.intro}`} aria-labelledby="about-intro">
          <div className="ds-wrap">
            <Reveal>
              <p id="about-intro" className={styles.statement}>{t('about.intro')}</p>
            </Reveal>
          </div>
        </section>

        {/* vision, mission, audience, accreditation */}
        <section className={`${styles.section} ${styles.grouped}`}>
          <div className={`ds-wrap ${styles.pillars}`}>
            {pillarKeys.map((key, i) => (
              <Reveal
                key={key}
                as="article"
                className={`ds-card ${styles.pillar}`}
                style={{ '--i': i } as CSSProperties}
                aria-labelledby={`about-${key}`}
              >
                <span className={styles.icon}>{pillarIcons[key]}</span>
                <h2 id={`about-${key}`} className={styles.cardTitle}>{t(`about.${key}Title`)}</h2>
                <p className={styles.cardText}>{t(`about.${key}Text`)}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* objectives */}
        <section className={styles.section} aria-labelledby="about-objectives-title">
          <div className="ds-wrap">
            <Reveal className={styles.head}>
              <h2 id="about-objectives-title" className="ds-title-1">{t('about.objectivesTitle')}</h2>
            </Reveal>
            <ul ref={objRef} className={styles.objectives} role="list">
              {objectiveKeys.map((key, k) => (
                <li
                  key={key}
                  className={`ds-card ds-reveal ${objIn ? 'ds-in' : ''} ${styles.objective}`}
                  style={{ '--i': k } as CSSProperties}
                >
                  <span className={styles.icon}>{objectiveIcons[k]}</span>
                  <p className={styles.objectiveText}>{t(`about.${key}`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* legal status */}
        <section className={`${styles.section} ${styles.grouped}`} aria-labelledby="about-legal-title">
          <div className={`ds-wrap ${styles.legalWrap}`}>
            <Reveal className={styles.head}>
              <span className={`${styles.icon} ${styles.iconLg}`}>{pillarIcons.accreditation}</span>
              <h2 id="about-legal-title" className="ds-title-1">{t('about.legalStatusTitle')}</h2>
            </Reveal>
            <Reveal style={{ '--i': 1 } as CSSProperties}>
              <ul className={`ds-list ${styles.legalList}`} role="list">
                {legalStatusKeys.map((key) => (
                  <li key={key}>
                    <span className={styles.tick}><TickIcon /></span>
                    <span>{t(`about.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* call to action (same link as before) */}
        <section className={`${styles.section} ${styles.cta}`} aria-labelledby="about-cta-title">
          <div className="ds-wrap">
            <Reveal className={styles.head}>
              <h2 id="about-cta-title" className="ds-large-title">{t('about.ctaTitle')}</h2>
              <p className="ds-subhead">{t('about.ctaSubtext')}</p>
              <Link to="/campaigns" className={`ds-btn ds-btn-filled ds-btn-lg ${styles.ctaButton}`}>
                {t('about.ctaButton')}
                <svg className="ds-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
              </Link>
            </Reveal>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
