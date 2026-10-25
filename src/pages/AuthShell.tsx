import { useRef, useState, type InputHTMLAttributes, type ReactNode, type ClipboardEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../components/layout/PageLayout'
import { SilkCanvas } from '../components/design/SilkCanvas'
import { LOGO_SRC, LOGO_WIDTH, LOGO_HEIGHT } from '../components/design/logo'
import styles from './Auth.module.css'

interface AuthShellProps {
  title: string
  subtitle: string
  /** shown between the logo and the title (e.g. register steps) */
  top?: ReactNode
  children: ReactNode
}

/** Auth pages from design-reference/account-pages.html: silk fills the screen behind a small glass box. */
export function AuthShell({ title, subtitle, top, children }: AuthShellProps) {
  const { t } = useTranslation('common')

  return (
    <PageLayout noPadding design>
      <section className={styles.page} aria-labelledby="auth-title">
        <SilkCanvas className={styles.silk} />
        <span className={styles.vignette} aria-hidden="true" />
        <div className={`ds-wrap ${styles.wrap}`}>
          <div className={styles.auth}>
            <div className={styles.formside}>
              <div className={styles.boxLogo}>
                <img src={LOGO_SRC} alt={t('app.name')} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
              </div>
              {top}
              <div className={styles.revealIn} key={title}>
                <header className={styles.head}>
                  <h1 id="auth-title">{title}</h1>
                  <p className={styles.sub}>{subtitle}</p>
                </header>
                {children}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  hint?: string
}

export function AuthField({ label, icon, hint, className = '', id, ...inputProps }: AuthFieldProps) {
  const inputId = id ?? inputProps.name

  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>
        {label}
        {hint ? <span className={styles.opt}> {hint}</span> : null}
      </label>
      <div className={styles.ctl}>
        <input id={inputId} className={`${icon ? '' : styles.noIcon} ${className}`.trim() || undefined} {...inputProps} />
        {icon ? (
          <span className={styles.ic} aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  )
}

interface AuthPasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function AuthPasswordField({ label, id, ...inputProps }: AuthPasswordFieldProps) {
  const { t } = useTranslation('common')
  const [visible, setVisible] = useState(false)
  const inputId = id ?? inputProps.name

  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <div className={`${styles.ctl} ${styles.pw}`}>
        <input id={inputId} type={visible ? 'text' : 'password'} {...inputProps} />
        <span className={styles.ic} aria-hidden>
          <LockIcon />
        </span>
        <button
          type="button"
          className={styles.eye}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  )
}

/** Six boxes for the verification code; reads and writes the same code string as before. */
export function OtpBoxes({ label, value, onChange, disabled }: {
  label: string
  value: string
  onChange: (code: string) => void
  disabled?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const focusBox = (i: number) => refs.current[Math.max(0, Math.min(5, i))]?.focus()
  // The boxes themselves hold the newest digits (they update before React re-renders,
  // which matters when digits are typed quickly), so the code is always read from them.
  const boxes = () => refs.current.slice(0, 6)
  const readCode = () => boxes().map((el) => (el?.value ?? '').replace(/\D/g, '')).join('').slice(0, 6)
  const firstEmpty = () => {
    const idx = boxes().findIndex((el) => !el?.value)
    return idx === -1 ? 6 : idx
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    const prev = refs.current[i - 1]
    if (e.key === 'Backspace' && !e.currentTarget.value && i > 0 && prev) {
      e.preventDefault()
      prev.value = ''
      onChange(readCode())
      focusBox(i - 1)
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6)
    if (!digits) return
    e.preventDefault()
    boxes().forEach((el, k) => {
      if (el) el.value = digits[k] ?? ''
    })
    onChange(digits)
    focusBox(digits.length)
  }

  return (
    <div className={styles.field} role="group" aria-label={label}>
      <span className={styles.groupLabel}>{label}</span>
      <div className={styles.otp}>
        {Array.from({ length: 6 }, (_, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={String(i + 1)}
            value={value[i] ?? ''}
            disabled={disabled}
            className={value[i] ? styles.filled : undefined}
            onFocus={() => {
              const empty = firstEmpty()
              if (i > empty) focusBox(empty)
            }}
            onChange={(e) => {
              const typed = e.target.value.replace(/\D/g, '')
              // one new digit replaces the box; several (SMS autofill, fast input) spread forward
              const digits = typed.length === 2 && value[i] ? typed.slice(-1) : typed
              const els = boxes()
              if (digits.length <= 1) {
                e.target.value = digits
              } else {
                digits.split('').forEach((d, k) => {
                  const el = els[i + k]
                  if (el) el.value = d
                })
              }
              onChange(readCode())
              if (digits) focusBox(Math.min(5, i + digits.length))
            }}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
          />
        ))}
      </div>
    </div>
  )
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className={styles.error} role="alert" key={message}>
      <AlertIcon />
      <span>{message}</span>
    </p>
  )
}

export function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

export function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

export function SmartphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <path d="M11 18h2" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="11" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="m1 1 22 22" />
      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}

/** Arrow pointing in the reading direction (left in Arabic, flipped in English via .ds-arrow). */
export function ArrowIcon() {
  return (
    <svg className="ds-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  )
}
