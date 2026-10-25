import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useErrorToast } from '../../context/ErrorContext'
import { getApiErrorMessage } from '../../services/apiClient'
import { authService } from '../../services/authService'
import {
  AuthShell,
  AuthField,
  AuthPasswordField,
  AuthError,
  OtpBoxes,
  UserIcon,
  PhoneIcon,
  MailIcon,
  SmartphoneIcon,
} from '../AuthShell'
import styles from '../Auth.module.css'

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

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
  const [maskedPhone, setMaskedPhone] = useState<string>('')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

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
      const { verifyId: id, phone: masked } = await registerWithPhone({
        name: name.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: passwordConfirm,
        email: email.trim() || undefined,
      })
      setVerifyId(id)
      setPhoneForResend(phone.trim())
      setMaskedPhone(masked || phone.trim())
      setOtpCode('')
      setOtpError(null)
      setDevOtp(null)
      setStep('otp')
      if (isDev) setResendCooldown(60)
    } catch (err) {
      const msg = getApiErrorMessage(err, t('common.error'))
      setError(msg)
      showError(msg, 'error')
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!verifyId || !otpCode.trim()) {
      setOtpError(t('auth.otpVerify'))
      return
    }
    setOtpError(null)
    try {
      await verifyOtp(verifyId, otpCode.trim())
      navigate('/', { replace: true })
    } catch (err) {
      const msg = getApiErrorMessage(err, t('common.error'))
      setOtpError(msg)
      showError(msg, 'error')
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || !phoneForResend) return
    setOtpError(null)
    try {
      const { verifyId: newId } = await resendOtp(phoneForResend)
      setVerifyId(newId)
      setOtpCode('')
      setDevOtp(null)
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) clearInterval(interval)
          return c - 1
        })
      }, 1000)
    } catch (err) {
      const msg = getApiErrorMessage(err, t('common.error'))
      setOtpError(msg)
      showError(msg, 'error')
    }
  }

  async function handleGetDevOtp() {
    if (!verifyId) return
    try {
      const code = await authService.getDevOtp(verifyId)
      setDevOtp(code ?? '')
    } catch {
      setDevOtp('')
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

  if (step === 'otp') {
    return (
      <AuthShell title={t('auth.otpVerify')} subtitle={t('auth.otpSubtitle')} top={steps}>
        <p className={styles.otpSent}>
          <SmartphoneIcon />
          <span>{t('auth.otpSent', { phone: maskedPhone || phoneForResend })}</span>
        </p>
        <AuthError message={otpError} />
        <form className={styles.form} onSubmit={handleVerifyOtp}>
          <OtpBoxes
            label={t('auth.otpVerify')}
            value={otpCode}
            onChange={(code) => setOtpCode(code.replace(/\D/g, '').slice(0, 6))}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !otpCode.trim()} className={`ds-btn ds-btn-filled ds-btn-lg ds-btn-block ${styles.submit}`}>
            {loading ? t('common.loading') : t('auth.verifyCode')}
          </button>
        </form>
        <div className={styles.linksRow}>
          <button
            type="button"
            className={`${styles.lnk} ${styles.back}`}
            onClick={() => {
              setStep('form')
              setVerifyId(null)
              setOtpError(null)
            }}
          >
            {t('common.back')}
          </button>
          <button
            type="button"
            className={styles.lnk}
            onClick={handleResendOtp}
            disabled={loading || resendCooldown > 0}
          >
            {resendCooldown > 0 ? `${t('auth.resendOtp')} (${resendCooldown}s)` : t('auth.resendOtp')}
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
