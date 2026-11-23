import { useState } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useErrorToast } from '../../context/ErrorContext'
import { getApiErrorMessage } from '../../services/apiClient'
import { VerificationRequiredError } from '../../services/authService'
import {
  AuthShell,
  AuthField,
  AuthPasswordField,
  AuthError,
  PhoneIcon,
} from '../AuthShell'
import { OtpStep } from '../OtpStep'
import styles from '../Auth.module.css'

export function Login() {
  const { t } = useTranslation('common')
  const { login, verifyOtp, resendOtp, loading } = useAuth()
  const { showError } = useErrorToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const from = (location.state as { from?: { pathname: string; search?: string } })?.from
  const returnUrl = searchParams.get('returnUrl') || (from ? from.pathname + (from.search ?? '') : '') || '/'
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // set when the phone is not verified yet: the backend sent an OTP instead of a token
  const [verifyId, setVerifyId] = useState<string | null>(null)
  const [otpError, setOtpError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!phone.trim() || !password) {
      setError(t('auth.requiredFields'))
      return
    }
    try {
      await login(phone.trim(), password)
      navigate(returnUrl, { replace: true })
    } catch (err) {
      if (err instanceof VerificationRequiredError) {
        setVerifyId(err.verifyId)
        setOtpError(null)
        return
      }
      const msg = getApiErrorMessage(err, t)
      setError(msg)
      showError(msg, 'error')
    }
  }

  async function handleVerifyOtp(code: string) {
    if (!verifyId) return
    setOtpError(null)
    try {
      await verifyOtp(verifyId, code)
      navigate(returnUrl, { replace: true })
    } catch (err) {
      const msg = getApiErrorMessage(err, t)
      setOtpError(msg)
      showError(msg, 'error')
    }
  }

  async function handleResendOtp() {
    setOtpError(null)
    try {
      const { verifyId: newId } = await resendOtp(phone.trim())
      setVerifyId(newId)
    } catch (err) {
      const msg = getApiErrorMessage(err, t)
      setOtpError(msg)
      showError(msg, 'error')
      throw err
    }
  }

  if (verifyId) {
    return (
      <OtpStep
        title={t('auth.verifyPhoneTitle')}
        subtitle={t('auth.verifyPhoneSubtitle')}
        phone={phone.trim()}
        verifyId={verifyId}
        error={otpError}
        loading={loading}
        submitLabel={t('auth.verifyCode')}
        onSubmit={handleVerifyOtp}
        onResend={handleResendOtp}
        onBack={() => {
          setVerifyId(null)
          setOtpError(null)
        }}
      />
    )
  }

  return (
    <AuthShell title={t('auth.login')} subtitle={t('auth.loginSubtitle')}>
      <AuthError message={error} />
      <form className={styles.form} onSubmit={handleSubmit}>
        <AuthField
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="numeric"
          label={t('auth.phone')}
          icon={<PhoneIcon />}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />
        <AuthPasswordField
          name="password"
          autoComplete="current-password"
          label={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <Link to="/forgot-password" className={`${styles.lnk} ${styles.forgot}`}>
          {t('auth.forgotPassword')}
        </Link>
        <button type="submit" disabled={loading} className={`ds-btn ds-btn-filled ds-btn-lg ds-btn-block ${styles.submit}`}>
          {loading ? t('common.loading') : t('auth.submitLogin')}
        </button>
      </form>
      <p className={styles.foot}>
        {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
      </p>
    </AuthShell>
  )
}
