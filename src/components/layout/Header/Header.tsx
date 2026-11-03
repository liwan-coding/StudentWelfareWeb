import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import { setDocumentDirection } from '../../../i18n/config'
import type { Locale } from '../../../i18n/config'
import { LOGO_SRC, LOGO_WIDTH, LOGO_HEIGHT } from '../../design/logo'
import { ThemeToggle } from './ThemeToggle'
import styles from './Header.module.css'

/**
 * Top bar. From 1000px up it carries the full navigation; below that the
 * bottom tab bar (BottomNav) takes over and this bar keeps only the logo
 * and the Donate action.
 */
export function Header() {
  const { t, i18n } = useTranslation('common')
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth()
  // the menu remembers the page it was opened on, so it closes by itself on navigation
  const [userMenuOpenPath, setUserMenuOpenPath] = useState<string | null>(null)
  const userMenuOpen = userMenuOpenPath === location.pathname
  const setUserMenuOpen = (open: boolean) => setUserMenuOpenPath(open ? location.pathname : null)

  // over a dark hero (marked data-dark-hero) the bar turns dark so it reads as part of it
  const [onDark, setOnDark] = useState(false)
  useEffect(() => {
    const check = () => {
      const hero = document.querySelector('[data-dark-hero]')
      setOnDark(!!hero && hero.getBoundingClientRect().bottom > 60)
    }
    const raf = requestAnimationFrame(check)
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [location.pathname])

  const isActive = (path: string) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path))

  const navItems = [
    { to: '/', label: t('nav.home') },
    { to: '/campaigns', label: t('nav.campaigns') },
    ...(isAuthenticated ? [{ to: '/my-donations', label: t('nav.myDonations') }] : []),
    { to: '/news', label: t('nav.news') },
    { to: '/partners', label: t('nav.partners') },
    { to: '/about', label: t('nav.about') },
  ]

  async function handleLogout() {
    await logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  function changeLanguage(lng: Locale) {
    setDocumentDirection(lng)
    i18n.changeLanguage(lng)
  }

  useEffect(() => {
    if (!userMenuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    const onDocClick = () => setUserMenuOpenPath(null)
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('click', onDocClick)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('click', onDocClick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userMenuOpen])

  const isRtl = (i18n.language || '').startsWith('ar')
  const otherLang: Locale = isRtl ? 'en' : 'ar'
  const userLabel = (user?.name || user?.phone || t('nav.myDonations')) as string
  const headerClass = [styles.header, onDark ? `ds-dark ${styles.onDark}` : ''].join(' ').trim()

  return (
    <header className={headerClass} role="banner">
      <div className={`ds-wrap ${styles.inner}`}>
        <div className={styles.start}>
          <Link to="/" className={`ds-logo-chip ${styles.logo}`} aria-label={t('app.name')}>
            <img src={LOGO_SRC} alt={t('app.name')} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
          </Link>
          <nav className={styles.nav} aria-label={t('nav.main')}>
            {navItems.map(({ to, label }) => (
              <Link key={to} to={to} className={isActive(to) ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.acts}>
          <span className={styles.wide}>
            <ThemeToggle />
            <button type="button" className={styles.lang} onClick={() => changeLanguage(otherLang)} lang={otherLang}>
              {otherLang === 'en' ? t('common.english') : t('common.arabic')}
            </button>

            {isAuthenticated && user ? (
              <span className={styles.userWrap}>
                <button
                  type="button"
                  className={styles.userBtn}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setUserMenuOpen(!userMenuOpen)
                  }}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="user-menu"
                  id="user-menu-button"
                >
                  <span className={styles.userAvatar} aria-hidden="true">{userLabel.trim().charAt(0)}</span>
                  <span className={styles.userName}>{userLabel}</span>
                  <svg className={styles.chev} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <span
                  id="user-menu"
                  className={`${styles.userMenu} ${userMenuOpen ? styles.userMenuOpen : ''}`}
                  role="menu"
                  aria-labelledby="user-menu-button"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to="/my-donations" role="menuitem" tabIndex={userMenuOpen ? 0 : -1} onClick={() => setUserMenuOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
                    </svg>
                    {t('nav.myDonations')}
                  </Link>
                  <hr />
                  <button type="button" role="menuitem" tabIndex={userMenuOpen ? 0 : -1} className={styles.logout} onClick={handleLogout} disabled={authLoading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    {t('nav.logout')}
                  </button>
                </span>
              </span>
            ) : (
              <span className={styles.authLinks}>
                <Link to="/login" className={styles.signIn}>{t('nav.login')}</Link>
              </span>
            )}
          </span>

          <Link to="/campaigns" className={`ds-btn ds-btn-filled ${styles.donate}`}>
            {t('nav.donate')}
          </Link>
        </div>
      </div>
    </header>
  )
}
