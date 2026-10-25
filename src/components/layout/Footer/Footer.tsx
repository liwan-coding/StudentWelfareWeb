import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LOGO_SRC, LOGO_WIDTH, LOGO_HEIGHT } from '../../design/logo'
import styles from './Footer.module.css'

function GoIcon() {
  return (
    <svg className={styles.go} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 7L7 17M8 7h9v9" />
    </svg>
  )
}

export function Footer() {
  const { t } = useTranslation('common')

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.bg} aria-hidden="true">
        <i className={styles.g1} />
        <i className={styles.g2} />
        <svg className={styles.stairs} viewBox="0 0 320 220" preserveAspectRatio="xMaxYMax meet">
          <defs>
            <linearGradient id="ds-ft-t" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7FD0E6" />
              <stop offset="1" stopColor="#1F6E85" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ds-ft-p" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#E7A6D8" />
              <stop offset="1" stopColor="#7E2F6C" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M120 10h170a20 20 0 0 1 20 20v170z" fill="url(#ds-ft-p)" opacity=".35" />
          <g fill="url(#ds-ft-t)" opacity=".35">
            <rect x="20" y="160" width="70" height="60" rx="8" />
            <rect x="90" y="110" width="70" height="110" rx="8" />
            <rect x="160" y="60" width="70" height="160" rx="8" />
            <rect x="230" y="10" width="70" height="210" rx="8" />
          </g>
        </svg>
      </div>

      <div className={`ds-wrap ${styles.in}`}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>
              <img src={LOGO_SRC} alt={t('app.name')} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
            </Link>
            <div>
              <strong>{t('app.name')}</strong>
              <p>{t('app.tagline')}</p>
            </div>
          </div>
          <div className={styles.contact}>
            <span className={styles.label}>{t('footer.contactVia')}</span>
            <div className={styles.tiles}>
              <a className={styles.tile} href="https://www.instagram.com/welfarefund4stu/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <span className={`${styles.ic} ${styles.ig}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r=".9" fill="currentColor" />
                  </svg>
                </span>
                <span className={styles.tileText}><b>Instagram</b></span>
                <GoIcon />
              </a>
              <a className={styles.tile} href="https://api.whatsapp.com/send?phone=96897515121" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <span className={`${styles.ic} ${styles.wa}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z" />
                    <path d="M9 9.5c.3 1.8 1.7 3.6 3.6 4.4l1.2-1.1 1.7.8c-.2 1-1 1.6-2 1.5-2.8-.4-5.2-2.9-5.5-5.6-.1-1 .5-1.8 1.5-2l.8 1.7z" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <span className={styles.tileText}><b dir="ltr">+968 97515121</b></span>
                <GoIcon />
              </a>
            </div>
          </div>
        </div>
        <div className={styles.line} aria-hidden="true" />
        <div className={styles.bottom}>
          <nav aria-label="Footer navigation">
            <Link to="/about">{t('footer.about')}</Link>
          </nav>
          <span>© {new Date().getFullYear()} {t('footer.rights')}</span>
        </div>
      </div>
    </footer>
  )
}
