import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import styles from './NotFound.module.css'

/** Catch-all route: unknown URLs keep the header and footer and offer a way back. */
export function NotFound() {
  const { t } = useTranslation('common')

  return (
    <PageLayout noPadding design>
      <div className={styles.page}>
        <section className={styles.panel}>
          <p className={styles.code} aria-hidden="true">404</p>
          <h1 className={`ds-large-title ${styles.title}`}>{t('notFound.title')}</h1>
          <p className={styles.subtext}>{t('notFound.description')}</p>
          <div className={styles.actions}>
            <Link to="/" className="ds-btn ds-btn-filled ds-btn-lg">{t('notFound.home')}</Link>
            <Link to="/campaigns" className="ds-btn ds-btn-gray ds-btn-lg">{t('notFound.campaigns')}</Link>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
