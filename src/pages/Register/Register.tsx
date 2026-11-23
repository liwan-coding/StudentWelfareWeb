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
  UserIcon,
  PhoneIcon,
  MailIcon,
} from '../AuthShell'
import { OtpStep } from '../OtpStep'
import styles from '../Auth.module.css'

export function Register() {
  const { t } = useTranslation('common')
  const { registerWithPhone, verifyOtp, resendOtp, loading } = useAuth()
  const { showError } = useErrorToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [verifyId, setVerifyId] = useState<string | null>(null)
  const [phoneForResend, setPhoneForResend] = useState<string>('')
  const [otpError, setOtpError] = useState<string | null>(null)

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !phone.trim() || !password) {
      setError(t('auth.requiredFields'))
      return
    }
    if (password !== passwordConfirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    try {
      const { verifyId: id } = await registerWithPhone({
        name: name.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: passwordConfirm,
        email: email.trim() || undefined,
      })
      setVerifyId(id)
      setPhoneForResend(phone.trim())
      setOtpError(null)
      setStep('otp')
    } catch (err) {
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
      navigate('/', { replace: true })
    } catch (err) {
      const msg = getApiErrorMessage(err, t)
      setOtpError(msg)
      showError(msg, 'error')
    }
  }

  async function handleResendOtp() {
    setOtpError(null)
    try {
      const { verifyId: newId } = await resendOtp(phoneForResend)
      setVerifyId(newId)
    } catch (err) {
      const msg = getApiErrorMessage(err, t)
      setOtpError(msg)
      showError(msg, 'error')
      throw err
    }
  }

  const steps = (
    <div className={styles.steps}>
      <span className={`${styles.step} ${step === 'form' ? styles.stepOn : styles.stepDone}`}>
        <span className={styles.sd}>1</span>
        {t('auth.stepAccount')}
      </span>
      <span className={`${styles.sline} ${step === 'otp' ? styles.slineFill : ''}`}>
        <i />
      </span>
      <span className={`${styles.step} ${step === 'otp' ? styles.stepOn : ''}`}>
        <span className={styles.sd}>2</span>
        {t('auth.stepVerify')}
      </span>
    </div>
  )

  if (step === 'otp' && verifyId) {
    return (
      <OtpStep
        title={t('auth.otpVerify')}
        subtitle={t('auth.otpSubtitle')}
        top={steps}
        phone={phoneForResend}
        verifyId={verifyId}
        error={otpError}
        loading={loading}
        submitLabel={t('auth.verifyCode')}
        onSubmit={handleVerifyOtp}
        onResend={handleResendOtp}
        onBack={() => {
          setStep('form')
          setVerifyId(null)
          setOtpError(null)
        }}
      />
    )
  }

  return (
    <AuthShell title={t('auth.register')} subtitle={t('auth.registerSubtitle')} top={steps}>
      <AuthError message={error} />
      <form className={styles.form} onSubmit={handleSubmitForm}>
        <AuthField
          name="name"
          type="text"
          autoComplete="name"
          label={t('auth.name')}
          icon={<UserIcon />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
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
        <AuthField
          name="email"
          type="email"
          autoComplete="email"
          label={t('auth.email')}
          hint={`(${t('auth.emailOptional')})`}
          icon={<MailIcon />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <AuthPasswordField
          name="password"
          autoComplete="new-password"
          label={t('auth.password')}
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
        <button type="submit" disabled={loading} className={`ds-btn ds-btn-filled ds-btn-lg ds-btn-block ${styles.submit}`}>
          {loading ? t('common.loading') : t('auth.submitRegister')}
        </button>
      </form>
      <p className={styles.foot}>
        {t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link>
      </p>
    </AuthShell>
  )
}
