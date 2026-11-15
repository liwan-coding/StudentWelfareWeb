import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setOnUnauthorized } from '../services/apiClient'
import { useErrorToast } from '../context/ErrorContext'
import { isDonateCheckoutPath } from '../utils/donateUrl'

/**
 * Sets global 401 handler to redirect to login. Must be inside Router and ErrorProvider.
 * Skips redirect on /donate, /c/:slug, /p/:slug, /donate/return, and /payments/success so donation/return flow works without login (API_DOCUMENTATION.md §5).
 */
export function AuthRedirectEffect() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showError } = useErrorToast()
  useEffect(() => {
    setOnUnauthorized(() => {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      if (isDonateCheckoutPath(path) || path.startsWith('/donate/') || path === '/payments/success') return
      showError(t('auth.loginRequired'), 'info')
      navigate('/login', { replace: true })
    })
    return () => setOnUnauthorized(() => {})
  }, [navigate, showError, t])
  return null
}
