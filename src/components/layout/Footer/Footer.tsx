import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LOGO_SRC, LOGO_WIDTH, LOGO_HEIGHT } from '../../design/logo'
import styles from './Footer.module.css'

/** Footer on ink: a closing line with the donate action, the directory, and the logo's staircase in the corner. */
export function Footer() {
  const { t } = useTranslation('common')

  const explore = [
    { to: '/', label: t('nav.home') },
    { to: '/campaigns', label: t('nav.campaigns') },
    { to: '/news', label: t('nav.news') },
    { to: '/partners', label: t('nav.partners') },
    { to: '/about', label: t('nav.about') },
  ]

  return (
    <footer className={`ds-dark ${styles.footer}`} role="contentinfo">
      <span className={styles.stairs} aria-hidden="true">
        <i /><i /><i /><i />
      </span>

      <div className={`ds-wrap ${styles.in}`}>
        <div className={styles.closing}>
          <p className={styles.closingLine}>{t('footer.closing')}</p>
          <Link to="/campaigns" className="ds-btn ds-btn-filled ds-btn-lg">{t('nav.donate')}</Link>
        </div>

        <div className={styles.directory}>
          <div className={styles.brand}>
            <Link to="/" className={`ds-logo-chip ${styles.logo}`}>
              <img src={LOGO_SRC} alt={t('app.name')} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
            </Link>
            <p>
              <strong>{t('app.name')}</strong>
              <span>{t('footer.madeBy')}</span>
            </p>
          </div>

          <nav className={styles.col} aria-label={t('footer.explore')}>
            <h3>{t('footer.explore')}</h3>
            <ul>
              {explore.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.col}>
            <h3>{t('footer.contactVia')}</h3>
            <ul>
              <li>
                <a href="https://www.instagram.com/welfarefund4stu/" target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://api.whatsapp.com/send?phone=96897515121" target="_blank" rel="noopener noreferrer">
                  WhatsApp <bdi dir="ltr">+968 97515121</bdi>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.legal}>
          <span>
            © {new Date().getFullYear()} {t('app.name')}. {t('footer.rights')}.
          </span>
          <Link to="/about">{t('footer.about')}</Link>
        </div>
      </div>
    </footer>
  )
}
