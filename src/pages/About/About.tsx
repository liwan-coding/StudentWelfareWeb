import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { SilkCanvas } from '../../components/design/SilkCanvas'
import { FxDot } from '../../components/design/FxDot'
import { useInViewOnce } from '../../components/design/useInViewOnce'
import styles from './About.module.css'

const objectiveKeys = ['objective1', 'objective2', 'objective3', 'objective4'] as const
const legalStatusKeys = ['legalStatus1', 'legalStatus2', 'legalStatus3', 'legalStatus4', 'legalStatus5'] as const

/** A block that rises into view once (the design's `.sv`). */
function Reveal({ as: Tag = 'section', className = '', style, children, ...rest }: {
  as?: 'section' | 'article'
  className?: string
  style?: CSSProperties
  children: ReactNode
  'aria-labelledby'?: string
}) {
  const [ref, inView] = useInViewOnce<HTMLElement>(0.2)
  return (
    <Tag ref={ref} className={`${styles.sv} ${inView ? styles.in : ''} ${className}`.trim()} style={style} {...rest}>
      {children}
    </Tag>
  )
}

/* animated icons from design-reference/about-page.html */
const icons = {
  vision: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g className={styles.lid}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle className={styles.pupil} cx="12" cy="12" r="3" />
      </g>
    </svg>
  ),
  mission: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 21V4" />
      <path className={styles.fl} d="M5 4h12l-2.5 4L17 12H5" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <circle className={styles.ring} cx="12" cy="12" r="10" strokeOpacity=".6" />
      <g className={styles.arrow}><path d="M12 12l7-7M16 5h3v3" /></g>
    </svg>
  ),
  accreditation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle className={styles.sealr} cx="12" cy="12" r="9" strokeDasharray="3 2.2" />
      <path className={styles.ck} d="m8 12.5 2.8 2.8L16 10" />
    </svg>
  ),
}

const objectiveIcons = [
  <svg key="cap" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <g className={styles.capg}><path d="M22 10 12 5 2 10l10 5 10-5z" /></g>
    <path d="M6 12v5c3 2 9 2 12 0v-5" />
  </svg>,
  <svg key="book" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19V5a2 2 0 0 1 2-2h12v14H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h12" />
    <path className={styles.pg} d="M12 3v10" />
  </svg>,
  <svg key="grow" viewBox="0 0 24 24" aria-hidden="true">
    <g className={styles.gr} fill="currentColor">
      <rect x="4" y="11" width="4" height="9" rx="1.5" style={{ '--d': '0s' } as CSSProperties} />
      <rect x="10" y="7" width="4" height="13" rx="1.5" style={{ '--d': '.3s' } as CSSProperties} />
      <rect x="16" y="3" width="4" height="17" rx="1.5" style={{ '--d': '.6s' } as CSSProperties} />
    </g>
  </svg>,
  <svg key="heart" className={styles.heart} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.8 8.6a5.5 5.5 0 0 0-7.8 0L12 9.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>,
]

function TickIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function About() {
  const { t } = useTranslation('common')
  const [introRef, introIn] = useInViewOnce<HTMLElement>(0.2)

  // intro words light up in reading order
  let wordIndex = 0
  const introWords = t('about.intro').split(/(\s+)/).map((part, k) =>
    !part || /^\s+$/.test(part) ? part : (
      <span key={k} className={styles.w} style={{ '--wi': wordIndex++ } as CSSProperties}>{part}</span>
    ),
  )

  const pairCard = (key: 'vision' | 'mission' | 'targetAudience' | 'accreditation', tone: 't' | 'p', i: number, icon: ReactNode) => (
    <Reveal as="article" className={`ds-card ${styles.pc}`} style={{ '--i': i } as CSSProperties} aria-labelledby={`about-${key}`}>
      <span className={`${styles.pi} ${tone === 't' ? styles.piTeal : styles.piPlum}`}>{icon}</span>
      <h2 id={`about-${key}`}>{t(`about.${key}Title`)}</h2>
      <p>{t(`about.${key}Text`)}</p>
      <FxDot index={i} />
    </Reveal>
  )

  return (
    <PageLayout noPadding design>
      <div className={styles.page}>
        {/* hero: silk band with the logo's stairs building up */}
        <section className={styles.hero} aria-labelledby="about-title">
          <SilkCanvas className={styles.heroCanvas} />
          <div className={`ds-wrap ${styles.heroGrid}`}>
            <div>
              <span className={styles.heroRule} aria-hidden="true" />
              <h1 id="about-title" className={styles.up} style={{ '--d': '.15s' } as CSSProperties}>
                <span>{t('nav.about')}</span>
              </h1>
              <p className={styles.up} style={{ '--d': '.4s' } as CSSProperties}>{t('about.subtitle')}</p>
            </div>
            <div className={styles.logoArt} aria-hidden="true">
              <svg viewBox="0 0 320 320">
                <defs>
                  <linearGradient id="ds-about-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FD0E6" /><stop offset="1" stopColor="#1F6E85" /></linearGradient>
                  <linearGradient id="ds-about-p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E7A6D8" /><stop offset="1" stopColor="#7E2F6C" /></linearGradient>
                </defs>
                <g className={styles.floaty}>
                  <path className={styles.tri} d="M120 20h170a20 20 0 0 1 20 20v170z" fill="url(#ds-about-p)" />
                  {[0, 1, 2, 3].map((s) => (
                    <rect
                      key={s}
                      className={styles.st}
                      style={{ '--s': s } as CSSProperties}
                      x={20 + s * 70}
                      y={250 - s * 62}
                      width="70"
                      height={60 + s * 62}
                      rx="8"
                      fill="url(#ds-about-t)"
                    />
                  ))}
                  <path className={styles.pen} d="M150 150H300" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <circle className={styles.nib} cx="150" cy="150" r="11" fill="#FFFFFF" />
                </g>
              </svg>
            </div>
          </div>
        </section>

        <div className={`ds-wrap ${styles.main}`}>
          {/* intro: a large quote with the logo's stair edge */}
          <section ref={introRef} className={`${styles.intro} ${styles.sv} ${introIn ? styles.in : ''}`} aria-labelledby="about-intro">
            <span className={styles.q} aria-hidden="true">”</span>
            <p id="about-intro">{introWords}</p>
          </section>

          <div className={styles.pair}>
            {pairCard('vision', 't', 0, icons.vision)}
            {pairCard('mission', 'p', 1, icons.mission)}
          </div>

          <div className={`${styles.pair} ${styles.pairTight}`}>
            {pairCard('targetAudience', 'p', 2, icons.target)}
            {pairCard('accreditation', 't', 3, icons.accreditation)}
          </div>

          {/* objectives: four cards climbing like the logo's stairs */}
          <Reveal aria-labelledby="about-objectives-title">
            <div className={styles.secHead}>
              <span className={styles.rule} aria-hidden="true" />
              <h2 id="about-objectives-title">{t('about.objectivesTitle')}</h2>
            </div>
            <ul className={styles.obj} role="list">
              {objectiveKeys.map((key, k) => (
                <li key={key} className={`ds-card ${styles.oc}`} style={{ '--k': k } as CSSProperties}>
                  <span className={styles.step} aria-hidden="true" />
                  <span className={styles.oi}>{objectiveIcons[k]}</span>
                  <p>{t(`about.${key}`)}</p>
                  <FxDot index={k} />
                </li>
              ))}
            </ul>
          </Reveal>

          {/* legal status: a verified list; each tick draws itself in turn */}
          <Reveal aria-labelledby="about-legal-title">
            <div className={styles.secHead}>
              <span className={styles.rule} aria-hidden="true" />
              <h2 id="about-legal-title">{t('about.legalStatusTitle')}</h2>
            </div>
            <div className={styles.legal}>
              <div className={styles.badge} aria-hidden="true">
                <svg viewBox="0 0 240 240">
                  <defs>
                    <linearGradient id="ds-about-shield" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#D47EC0" /><stop offset=".55" stopColor="#A2458C" /><stop offset="1" stopColor="#32A1BF" />
                    </linearGradient>
                  </defs>
                  <circle className={styles.orbit} cx="120" cy="120" r="108" fill="none" stroke="url(#ds-about-shield)" strokeWidth="2" strokeDasharray="6 10" opacity=".55" />
                  <g className={styles.shield}>
                    <path d="M120 36 58 62v48c0 40 26 66 62 76 36-10 62-36 62-76V62Z" fill="url(#ds-about-shield)" />
                    <path d="M120 50 70 71v39c0 32 21 54 50 62" fill="none" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth="3" />
                    <path className={styles.bigck} d="m92 112 20 20 38-40" fill="none" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                </svg>
              </div>
              <ul className={styles.llist} role="list">
                {legalStatusKeys.map((key, j) => (
                  <li key={key} style={{ '--j': j } as CSSProperties}>
                    <span className={styles.tk}><TickIcon /></span>
                    {t(`about.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* call to action (same link as before) */}
          <Reveal className={styles.cta} aria-labelledby="about-cta-title">
            <svg className={styles.ctaStairs} viewBox="0 0 200 200" aria-hidden="true">
              <path d="M0 200V60h50v50h50v50h50v40z" fill="#FFFFFF" />
            </svg>
            <div>
              <h2 id="about-cta-title">{t('about.ctaTitle')}</h2>
              <p>{t('about.ctaSubtext')}</p>
            </div>
            <Link to="/campaigns" className={`ds-btn ${styles.ctaButton}`}>
              {t('about.ctaButton')}
              <svg className="ds-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </div>
    </PageLayout>
  )
}
