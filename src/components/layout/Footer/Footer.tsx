import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LOGO_SRC, LOGO_WIDTH, LOGO_HEIGHT } from '../../design/logo'
import styles from './Footer.module.css'

/** Footer in the apple.com manner: quiet gray, small type, a link directory and a legal line. */
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
    <footer className={styles.footer} role="contentinfo">
      <div className={`ds-wrap ${styles.in}`}>
        <div className={styles.brand}>
          <Link to="/" className={`ds-logo-chip ${styles.logo}`}>
            <img src={LOGO_SRC} alt={t('app.name')} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
          </Link>
          <p>
            <strong>{t('app.name')}</strong>
            <span>{t('app.tagline')}</span>
          </p>
        </div>

        <div className={styles.directory}>
          <nav className={styles.col} aria-label="Footer navigation">
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
