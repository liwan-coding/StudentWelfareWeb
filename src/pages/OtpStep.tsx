import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { authService } from '../services/authService'
import { AuthShell, AuthError, OtpBoxes, SmartphoneIcon } from './AuthShell'
import styles from './Auth.module.css'

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV
const RESEND_SECONDS = 60

/**
 * OTP entry step shared by register, login (unverified phone) and password reset.
 * `children` render inside the form above the submit button (e.g. new password fields).
 */
export function OtpStep({
  title,
  subtitle,
  top,
  phone,
  verifyId,
  error,
  loading,
  submitLabel,
  onSubmit,
  onResend,
  onBack,
  children,
}: {
  title: string
  subtitle: string
  top?: ReactNode
  /** number as the user typed it */
  phone: string
  verifyId: string
  error: string | null
  loading: boolean
  submitLabel: string
  onSubmit: (code: string) => void
  onResend: () => Promise<void>
  onBack: () => void
  children?: ReactNode
}) {
  const { t } = useTranslation('common')
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)
  const [devOtp, setDevOtp] = useState<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  async function handleResend() {
    if (cooldown > 0) return
    try {
      await onResend()
      setCode('')
      setDevOtp(null)
      setCooldown(RESEND_SECONDS)
    } catch {
      // caller shows the error
    }
  }

  async function handleGetDevOtp() {
    try {
      const value = await authService.getDevOtp(verifyId)
      setDevOtp(value ?? '')
    } catch {
      setDevOtp('')
    }
  }

  const [before, after] = t('auth.otpSent', { phone: '__PHONE__' }).split('__PHONE__')

  return (
    <AuthShell title={title} subtitle={subtitle} top={top}>
      <p className={styles.otpSent}>
        <SmartphoneIcon />
        {/* the number as the user typed it, kept left-to-right inside the Arabic sentence */}
        <span>
          {before}
          <bdi dir="ltr" className={`ds-num ${styles.otpPhone}`}>{phone}</bdi>
          {after}
        </span>
      </p>
      <AuthError message={error} />
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(code.trim())
        }}
      >
        <OtpBoxes
          label={t('auth.otpVerify')}
          value={code}
          onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          disabled={loading}
        />
        {children}
        <button type="submit" disabled={loading || code.trim().length !== 6} className={`ds-btn ds-btn-filled ds-btn-lg ds-btn-block ${styles.submit}`}>
          {loading ? t('common.loading') : submitLabel}
        </button>
      </form>
      <div className={styles.linksRow}>
        <button type="button" className={`${styles.lnk} ${styles.back}`} onClick={onBack}>
          {t('common.back')}
        </button>
        <button type="button" className={styles.lnk} onClick={handleResend} disabled={loading || cooldown > 0}>
          {cooldown > 0 ? `${t('auth.resendOtp')} (${cooldown}s)` : t('auth.resendOtp')}
        </button>
      </div>
      {isDev && (
        <div className={styles.devRow}>
          <button type="button" className={styles.devBtn} onClick={handleGetDevOtp} disabled={loading}>
            {t('auth.devOtp')}
          </button>
          {devOtp !== null && devOtp !== '' && <span className={styles.devCode}>{devOtp}</span>}
        </div>
      )}
    </AuthShell>
  )
}
