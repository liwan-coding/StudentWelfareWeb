import { useTranslation } from 'react-i18next'
import styles from './LoadError.module.css'

interface LoadErrorProps {
  onRetry: () => void
}

/** Shown when a list failed to load, so an outage never looks like "nothing here". */
export function LoadError({ onRetry }: LoadErrorProps) {
  const { t } = useTranslation('common')

  return (
    <div className={styles.wrap} role="alert">
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7.5v5.5M12 16.5h.01" />
      </svg>
      <h2 className={styles.title}>{t('common.loadErrorTitle')}</h2>
      <p className={styles.description}>{t('common.loadErrorDescription')}</p>
      <button type="button" className={`ds-btn ds-btn-gray ${styles.retry}`} onClick={onRetry}>
        {t('common.retry')}
      </button>
    </div>
  )
}
