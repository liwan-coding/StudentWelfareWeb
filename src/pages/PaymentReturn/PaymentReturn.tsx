import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { paymentService } from '../../services/paymentService'
import { getApiErrorMessage } from '../../services/apiClient'
import styles from './PaymentReturn.module.css'

/* SF Symbols–style glyphs drawn inside a filled circle */
const IconSuccess = () => (
  <svg className={styles.glyph} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path className={styles.draw} d="M6.5 12.5 10.25 16 17.5 8.5" pathLength={1} />
  </svg>
)

const IconCancelled = () => (
  <svg className={styles.glyph} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
    <path d="M12 6.5v7" />
    <path d="M12 17.5h.01" />
  </svg>
)

const IconError = () => (
  <svg className={styles.glyph} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
    <path d="M8 8l8 8M16 8l-8 8" />
  </svg>
)

export function PaymentReturn() {
  const { t } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const [confirmStatus, setConfirmStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const sessionId = searchParams.get('session_id') ?? searchParams.get('sessionId')
  const donationIdParam = searchParams.get('donation_id')
  const donationId = donationIdParam ? (donationIdParam as string) : undefined
  const result = searchParams.get('result') ?? searchParams.get('status')
  const cancelled =
    result === 'cancelled' || result === 'cancel' || searchParams.get('cancel') !== null
  const isSuccess = result === 'success'
  // confirm with the server when there is a session, or a success result with a donation id
  const needsConfirm = !cancelled && !!((isSuccess || sessionId) && (sessionId || donationId))
  // cancelled / nothing to confirm are known from the URL alone
  const status: 'loading' | 'success' | 'error' | 'cancelled' = cancelled
    ? 'cancelled'
    : needsConfirm
      ? confirmStatus
      : 'error'

  useEffect(() => {
    if (!needsConfirm) return
    const confirmPayload = { session_id: sessionId ?? undefined, donation_id: donationId }
    paymentService
      .confirm(confirmPayload)
      .then(() => setConfirmStatus('success'))
      .catch((err) => {
        setConfirmStatus('error')
        setErrorMessage(getApiErrorMessage(err, t))
      })
  }, [needsConfirm, sessionId, donationId, t])

  return (
    <PageLayout noPadding design>
      <div className={styles.page}>
        <section
          className={styles.panel}
          data-status={status}
          aria-live="polite"
          aria-busy={status === 'loading'}
        >
          {status === 'loading' && (
            <>
              <div className={styles.spinner} aria-hidden />
              <p className={styles.subtext}>{t('common.loading')}</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className={`${styles.badge} ${styles.badgeSuccess}`}>
                <IconSuccess />
              </div>
              <h1 className={styles.title}>{t('donate.success')}</h1>
              <p className={styles.subtext}>{t('donate.successSubtext')}</p>
              <div className={styles.actions}>
                <Link to="/" className="ds-btn ds-btn-filled ds-btn-lg">{t('nav.home')}</Link>
              </div>
            </>
          )}
          {status === 'cancelled' && (
            <>
              <div className={`${styles.badge} ${styles.badgeCancelled}`}>
                <IconCancelled />
              </div>
              <h1 className={styles.title}>{t('donate.paymentCancelled')}</h1>
              <div className={styles.actions}>
                <Link to="/campaigns" className="ds-btn ds-btn-filled ds-btn-lg">{t('donate.title')}</Link>
              </div>
            </>
          )}
          {status === 'error' && (
            <>
              <div className={`${styles.badge} ${styles.badgeError}`}>
                <IconError />
              </div>
              <h1 className={styles.title}>{t('donate.paymentFailed')}</h1>
              <p className={styles.subtext}>{errorMessage || t('donate.paymentFailedDetail')}</p>
              <div className={styles.actions}>
                <Link to="/campaigns" className="ds-btn ds-btn-gray ds-btn-lg">{t('common.retry')}</Link>
              </div>
            </>
          )}
        </section>
      </div>
    </PageLayout>
  )
}
