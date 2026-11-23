import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useErrorToast } from '../../context/ErrorContext'
import { getApiErrorMessage } from '../../services/apiClient'
import {
  AuthShell,
  AuthField,
  AuthPasswordField,
  AuthError,
  PhoneIcon,
} from '../AuthShell'
import { OtpStep } from '../OtpStep'
import styles from '../Auth.module.css'

export function ForgotPassword() {
  const { t } = useTranslation('common')
  const { forgotPassword, resetPassword, loading } = useAuth()
  const { showError } = useErrorToast()
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifyId, setVerifyId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!phone.trim()) {
      setError(t('auth.requiredFields'))
      return
    }
    try {
      const { verifyId: id } = await forgotPassword(phone.trim())
      setVerifyId(id)
      setOtpError(null)
    } catch (err) {
      const msg = getApiErrorMessage(err, t)
      setError(msg)
      showError(msg, 'error')
    }
  }

  async function handleResend() {
    setOtpError(null)
    try {
      const { verifyId: id } = await forgotPassword(phone.trim())
      setVerifyId(id)
    } catch (err) {
      const msg = getApiErrorMessage(err, t)
      setOtpError(msg)
      showError(msg, 'error')
      throw err
    }
  }

  async function handleReset(code: string) {
    if (!verifyId) return
    setOtpError(null)
    if (!password) {
      setOtpError(t('auth.requiredFields'))
      return
    }
    if (password !== passwordConfirm) {
      setOtpError(t('auth.passwordMismatch'))
      return
    }
    try {
      await resetPassword({
        verifyId,
        verifyCode: code,
        password,
        password_confirmation: passwordConfirm,
      })
      showError(t('auth.resetSuccess'), 'success')
      navigate('/', { replace: true })
    } catch (err) {
      const msg = getApiErrorMessage(err, t)
      setOtpError(msg)
      showError(msg, 'error')
    }
  }

  if (verifyId) {
    return (
      <OtpStep
        title={t('auth.resetTitle')}
        subtitle={t('auth.resetSubtitle')}
        phone={phone.trim()}
        verifyId={verifyId}
        error={otpError}
        loading={loading}
        submitLabel={t('auth.submitReset')}
        onSubmit={handleReset}
        onResend={handleResend}
        onBack={() => {
          setVerifyId(null)
          setOtpError(null)
        }}
      >
        <AuthPasswordField
          name="password"
          autoComplete="new-password"
          label={t('auth.newPassword')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <AuthPasswordField
          name="passwordConfirm"
          autoComplete="new-password"
          label={t('auth.passwordConfirm')}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          disabled={loading}
        />
      </OtpStep>
    )
  }

  return (
    <AuthShell title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      <AuthError message={error} />
      <form className={styles.form} onSubmit={handleSendCode}>
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
        <button type="submit" disabled={loading} className={`ds-btn ds-btn-filled ds-btn-lg ds-btn-block ${styles.submit}`}>
          {loading ? t('common.loading') : t('auth.sendCode')}
        </button>
      </form>
      <p className={styles.foot}>
        <Link to="/login">{t('auth.backToLogin')}</Link>
      </p>
    </AuthShell>
  )
}
