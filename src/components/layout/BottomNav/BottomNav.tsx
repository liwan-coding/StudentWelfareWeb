import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import { setDocumentDirection, type Locale } from '../../../i18n/config'
import styles from './BottomNav.module.css'

const THEME_KEY = 'swf_theme'

/** routes that bring their own bottom bar (the donate checkout) */
const HIDDEN_ON = ['/donate']

type Tab = { to: string; label: string; icon: ReactNode; match: (path: string) => boolean }

/**
 * App-style tab bar for phones and tablets (hidden from 1000px up, where the
 * header shows the full navigation). "More" opens a bottom sheet with the
 * secondary pages, language, appearance and sign-out.
 */
export function BottomNav() {
  const { t, i18n } = useTranslation('common')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  // the sheet remembers the page it was opened on, so it closes by itself on navigation
  const [sheetPath, setSheetPath] = useState<string | null>(null)
  const sheetOpen = sheetPath === pathname
  const setSheetOpen = (open: boolean) => setSheetPath(open ? pathname : null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark')

  const isRtl = (i18n.language || '').startsWith('ar')
  const otherLang: Locale = isRtl ? 'en' : 'ar'

  // sheet: focus moves in on open, Escape closes, focus returns to "More"
  useEffect(() => {
    if (!sheetOpen) return
    const first = sheetRef.current?.querySelector<HTMLElement>('a, button')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheetPath(null)
        moreRef.current?.focus()
      }
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [sheetOpen])

  if (HIDDEN_ON.some((p) => pathname === p)) return null

  const tabs: Tab[] = [
    { to: '/', label: t('nav.home'), icon: <HomeIcon />, match: (p) => p === '/' },
    { to: '/campaigns', label: t('nav.campaigns'), icon: <HeartIcon />, match: (p) => p.startsWith('/campaigns') },
    { to: '/student-registration', label: t('nav.apply'), icon: <CapIcon />, match: (p) => p.startsWith('/student-registration') },
    isAuthenticated
      ? { to: '/my-donations', label: t('nav.account'), icon: <UserIcon />, match: (p) => p.startsWith('/my-donations') }
      : { to: '/login', label: t('nav.signInShort'), icon: <UserIcon />, match: (p) => p.startsWith('/login') || p.startsWith('/register') },
  ]

  const moreLinks = [
    { to: '/news', label: t('nav.news') },
    { to: '/partners', label: t('nav.partners') },
    { to: '/about', label: t('nav.about') },
  ]
  const moreActive = moreLinks.some((l) => pathname.startsWith(l.to))

  function toggleTheme() {
    const root = document.documentElement
    const next = root.getAttribute('data-theme') !== 'dark'
    if (next) root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    } catch {
      // storage can be unavailable (private mode); the theme still applies for this visit
    }
    setDark(next)
  }

  function changeLanguage() {
    setDocumentDirection(otherLang)
    i18n.changeLanguage(otherLang)
  }

  async function handleLogout() {
    await logout()
    setSheetOpen(false)
    navigate('/')
  }

  return (
    <>
      {/* keeps the page's last content clear of the fixed bar */}
      <div className={styles.spacer} aria-hidden="true" />

      <nav className={styles.bar} aria-label={t('nav.main')}>
        {tabs.map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link key={tab.to} to={tab.to} className={`${styles.tab} ${active ? styles.active : ''}`} aria-current={active ? 'page' : undefined}>
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          )
        })}
        <button
          ref={moreRef}
          type="button"
          className={`${styles.tab} ${moreActive || sheetOpen ? styles.active : ''}`}
          aria-expanded={sheetOpen}
          aria-controls="more-sheet"
          onClick={() => setSheetOpen(!sheetOpen)}
        >
          <MoreIcon />
          <span>{t('nav.more')}</span>
        </button>
      </nav>

      <div className={`${styles.backdrop} ${sheetOpen ? styles.backdropOn : ''}`} onClick={() => setSheetOpen(false)} aria-hidden="true" />
      <div
        id="more-sheet"
        ref={sheetRef}
        className={`${styles.sheet} ${sheetOpen ? styles.sheetOn : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.more')}
        inert={!sheetOpen}
      >
        <span className={styles.grabber} aria-hidden="true" />
        <ul className={styles.sheetList}>
          {moreLinks.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className={styles.sheetRow} aria-current={pathname.startsWith(l.to) ? 'page' : undefined}>
                {l.label}
                <ChevronIcon />
              </Link>
            </li>
          ))}
        </ul>
        <ul className={styles.sheetList}>
          <li>
            <button type="button" className={styles.sheetRow} onClick={changeLanguage} lang={otherLang}>
              {t('common.language')}
              <span className={styles.value}>{otherLang === 'en' ? t('common.english') : t('common.arabic')}</span>
            </button>
          </li>
          <li>
            <button type="button" className={styles.sheetRow} onClick={toggleTheme} role="switch" aria-checked={dark}>
              {t('common.darkMode')}
              <span className={`${styles.switch} ${dark ? styles.switchOn : ''}`} aria-hidden="true"><i /></span>
            </button>
          </li>
        </ul>
        <ul className={styles.sheetList}>
          {isAuthenticated && user ? (
            <li>
              <button type="button" className={`${styles.sheetRow} ${styles.danger}`} onClick={handleLogout}>
                {t('nav.logout')}
              </button>
            </li>
          ) : (
            <li>
              <Link to="/register" className={styles.sheetRow}>
                {t('nav.register')}
                <ChevronIcon />
              </Link>
            </li>
          )}
        </ul>
      </div>
    </>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 8.6a5.5 5.5 0 0 0-7.8 0L12 9.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}

function CapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 9.5 12 5 2 9.5l10 4.5 10-4.5z" />
      <path d="M6 11.5v4.5c3 2 9 2 12 0v-4.5" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

/** "More": three steps, the logo's staircase in miniature */
function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M4 12h11M4 17h6" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="ds-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}
