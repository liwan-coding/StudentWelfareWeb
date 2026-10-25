import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Header.module.css'

const STORAGE_KEY = 'swf_theme'

function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

/** Dark / light switch; the choice is remembered in localStorage (applied early in index.html). */
export function ThemeToggle() {
  const { t } = useTranslation('common')
  const [dark, setDark] = useState(isDark)

  function toggle() {
    const root = document.documentElement
    const next = !isDark()
    root.classList.add('theme-anim')
    if (next) root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      // storage can be unavailable (private mode); the theme still applies for this visit
    }
    setDark(next)
    window.setTimeout(() => root.classList.remove('theme-anim'), 600)
  }

  return (
    <button type="button" className={styles.themeBtn} onClick={toggle} aria-pressed={dark} aria-label={t('common.darkMode')}>
      <svg className={styles.tbSun} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      </svg>
      <svg className={styles.tbMoon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    </button>
  )
}
