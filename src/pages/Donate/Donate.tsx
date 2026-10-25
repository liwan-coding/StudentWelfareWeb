import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuth } from '../../context/AuthContext'
import { resolveImageUrl } from '../../config/api'
import { campaignService } from '../../services/campaignService'
import { donationService } from '../../services/donationService'
import { paymentService } from '../../services/paymentService'
import { ApiError, clearToken } from '../../services/apiClient'
import type { CampaignOrProgram } from '../../types/api'
import { getCampaignProgressPercent } from '../../components/CampaignAmountGoal'
import { PageHero } from '../../components/design/PageHero'
import { Train } from '../../components/design/Train'
import { FxDot } from '../../components/design/FxDot'
import styles from './Donate.module.css'

/** Same number format as CampaignAmountGoal */
function formatAmount(amount?: number): string {
  return (amount != null ? Number(amount) : 0).toLocaleString('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

const FALLBACK_QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500]

function getShareUrl(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${window.location.pathname}${window.location.search}`
}

export function Donate() {
  const { t, i18n } = useTranslation('common')
  const { isAuthenticated, user, refreshProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const campaignIdParam = searchParams.get('campaign_id')
  const programIdParam = searchParams.get('program_id')
  const [copySuccess, setCopySuccess] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)

  // التبرع يكون فقط من خلال اختيار حملة أو برنامج — إعادة توجيه الصفحة العامة إلى الحملات
  useEffect(() => {
    if (!campaignIdParam && !programIdParam) {
      navigate('/campaigns', { replace: true })
    }
  }, [campaignIdParam, programIdParam, navigate])

  const [campaigns, setCampaigns] = useState<CampaignOrProgram[]>([])
  const [programs, setPrograms] = useState<CampaignOrProgram[]>([])
  const [quickAmounts, setQuickAmounts] = useState<number[]>(FALLBACK_QUICK_AMOUNTS)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryDonationId, setRetryDonationId] = useState<number | null>(null)

  const [selectedType, setSelectedType] = useState<'campaign' | 'program'>('campaign')
  const [selectedId, setSelectedId] = useState<string>(campaignIdParam ?? programIdParam ?? '')
  const [amount, setAmount] = useState<string>(programIdParam || campaignIdParam ? '' : '')
  const [donorPhone, setDonorPhone] = useState('')
  const [campaignDetails, setCampaignDetails] = useState<CampaignOrProgram | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    if (campaignIdParam) {
      setSelectedType('campaign')
      setSelectedId(campaignIdParam)
    }
    if (programIdParam) {
      setSelectedType('program')
      setSelectedId(programIdParam)
    }
  }, [campaignIdParam, programIdParam])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [campList, progList, amounts] = await Promise.all([
          campaignService.getCampaigns().catch(() => []),
          campaignService.getPrograms().catch(() => []),
          campaignService.getQuickAmounts().catch(() => FALLBACK_QUICK_AMOUNTS),
        ])
        if (!cancelled) {
          setCampaigns(campList)
          setPrograms(progList)
          setQuickAmounts(amounts.length ? amounts : FALLBACK_QUICK_AMOUNTS)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false)
      }
    }
    if (shareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [shareMenuOpen])

  useEffect(() => {
    if (!selectedId) {
      setCampaignDetails(null)
      return
    }
    const id = parseInt(selectedId, 10)
    if (!Number.isFinite(id)) {
      setCampaignDetails(null)
      return
    }
    let cancelled = false
    setDetailsLoading(true)
    const fetchDetails = selectedType === 'campaign' ? campaignService.getCampaign(id) : campaignService.getProgram(id)
    fetchDetails
      .then((item) => {
        if (!cancelled && item) setCampaignDetails(item)
        if (!cancelled && !item) setCampaignDetails(null)
      })
      .catch(() => {
        if (!cancelled) setCampaignDetails(null)
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedId, selectedType])

  const options = selectedType === 'campaign' ? campaigns : programs
  const lang = i18n.language === 'ar' ? 'ar' : 'en'
  const titleKey = lang === 'ar' ? 'title_ar' : 'title_en'
  const descKey = lang === 'ar' ? 'description_ar' : 'description_en'
  const impactKey = lang === 'ar' ? 'impact_description_ar' : 'impact_description_en'
  const getTitle = (item: CampaignOrProgram) =>
    (item[titleKey as keyof CampaignOrProgram] as string) || item.title || `#${item.id}`
  const getDescription = (item: CampaignOrProgram) => {
    const text = (item[descKey as keyof CampaignOrProgram] as string) || item.description || ''
    return text
  }
  const getImpact = (item: CampaignOrProgram) =>
    (item[impactKey as keyof CampaignOrProgram] as string) || item.impact_description || ''
  const shareUrl = getShareUrl()
  const shareTitle = campaignDetails ? getTitle(campaignDetails) : t('donate.title')

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopySuccess(true)
      window.setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      setCopySuccess(false)
    }
  }

  function openShare(channel: 'whatsapp' | 'twitter' | 'facebook') {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(shareTitle)
    const urls: Record<typeof channel, string> = {
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    }
    window.open(urls[channel], '_blank', 'noopener,noreferrer,width=600,height=400')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setRetryDonationId(null)
    const numAmount = parseFloat(amount)
    if (!Number.isFinite(numAmount) || numAmount < 0.001) {
      setError(t('donate.amount') + ' required')
      return
    }
    if (!isAuthenticated && !donorPhone.trim()) {
      setError(`${t('donate.phone')} ${t('common.required')}`)
      return
    }
    const id = selectedId ? parseInt(selectedId, 10) : undefined
    setSubmitting(true)
    try {
      const returnOrigin = typeof window !== 'undefined' ? window.location.origin : ''
      const phoneForDonation = isAuthenticated && user?.phone
        ? user.phone.trim()
        : donorPhone.trim()
      const body = {
        amount: numAmount,
        return_origin: returnOrigin,
        is_anonymous: false,
        ...(phoneForDonation ? { donor_phone: phoneForDonation } : {}),
        ...(selectedType === 'campaign' && id ? { campaign_id: id } : {}),
        ...(selectedType === 'program' && id ? { program_id: id } : {}),
      }
      const anonymousBody = !isAuthenticated ? { ...body, is_anonymous: true, donor_name: 'متبرع' } : body
      let res: Awaited<ReturnType<typeof donationService.createWithPayment>>
      try {
        res = isAuthenticated
          ? await donationService.createWithPayment(body)
          : await donationService.createAnonymousWithPayment(anonymousBody)
      } catch (firstErr) {
        // If 401 (e.g. expired token), clear token and retry as anonymous so donation without login works
        if (firstErr instanceof ApiError && firstErr.status === 401) {
          clearToken()
          refreshProfile()
          res = await donationService.createAnonymousWithPayment(anonymousBody)
        } else {
          throw firstErr
        }
      }
      if (res.payment_error && !res.payment_url) {
        setError(res.payment_error || t('donate.error'))
        if (res.donation_id) setRetryDonationId(res.donation_id)
        return
      }
      if (res.payment_url) {
        window.location.href = res.payment_url
        return
      }
      setError(t('donate.error'))
    } catch (err) {
      let msg = err instanceof Error ? err.message : t('donate.error')
      if (err instanceof ApiError && err.status === 422 && err.data && typeof err.data === 'object') {
        const d = err.data as { message?: string; errors?: Record<string, string[]> }
        if (d.errors && typeof d.errors === 'object') {
          const first = Object.values(d.errors).flat().find(Boolean)
          if (first) msg = first
        } else if (typeof d.message === 'string' && d.message) {
          msg = d.message
        }
      }
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!campaignIdParam && !programIdParam) {
    return null
  }

  if (loading && options.length === 0) {
    return (
      <PageLayout noPadding design>
        <div className={styles.page}>
          <PageHero title={t('donate.title')} subtitle={t('donate.subtitle')} />
          <div className={`ds-wrap ${styles.main}`}>
            <p className={styles.placeholder}>{t('common.loading')}</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  // ===== presentation only below: the request logic above is unchanged =====
  const detailImage = campaignDetails
    ? campaignDetails.image_url || campaignDetails.image || campaignDetails.banner_url || campaignDetails.banner
    : undefined
  const raised = Number(campaignDetails?.raised_amount) || 0
  const goal = Number(campaignDetails?.goal_amount) || 0
  const nowPercent = goal > 0 ? getCampaignProgressPercent(raised, goal) : 0
  // striped preview of the typed amount on the bar (visual only; never sent anywhere)
  const typedAmount = parseFloat(amount)
  const previewPercent = goal > 0 && Number.isFinite(typedAmount) && typedAmount > 0
    ? Math.min(100 - nowPercent, Math.max(1.5, (typedAmount / goal) * 100))
    : 0
  const currency = t('donate.currencyShort')
  const percentSign = lang === 'ar' ? '٪' : '%'
  const showDetails = !!selectedId && (detailsLoading || !!campaignDetails)

  return (
    <PageLayout noPadding design>
      <div className={styles.page}>
        <PageHero title={t('donate.title')} subtitle={t('donate.subtitle')} />

        <div className={`ds-wrap ${styles.main}`}>
          <Train className={`${styles.layout} ${showDetails ? '' : styles.layoutSingle}`}>
            {showDetails && (
              <article className={`ds-card ${styles.detail}`} aria-busy={detailsLoading} aria-labelledby={campaignDetails ? 'donate-campaign-title' : undefined}>
                {detailsLoading ? (
                  <div className={styles.skeleton}>
                    <div className={styles.skeletonImage} />
                    <div className={styles.skeletonBody}>
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLine} style={{ width: '80%' }} />
                      <div className={styles.skeletonLine} style={{ width: '60%' }} />
                    </div>
                  </div>
                ) : campaignDetails ? (
                  <>
                    <div className={styles.media}>
                      {detailImage && (
                        <div
                          className={styles.mediaImage}
                          style={{ backgroundImage: `url(${resolveImageUrl(detailImage)})` }}
                          role="img"
                          aria-label={getTitle(campaignDetails)}
                        />
                      )}
                      <div className={styles.share} ref={shareMenuRef}>
                        <button
                          type="button"
                          className={styles.shareBtn}
                          onClick={() => setShareMenuOpen((o) => !o)}
                          aria-label={t('donate.shareCampaign')}
                          aria-expanded={shareMenuOpen}
                          aria-haspopup="true"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                          </svg>
                        </button>
                        <div className={`${styles.shareMenu} ${shareMenuOpen ? styles.shareMenuOpen : ''}`} role="menu" aria-hidden={!shareMenuOpen}>
                          <button type="button" role="menuitem" tabIndex={shareMenuOpen ? 0 : -1} onClick={() => { handleCopyLink(); setShareMenuOpen(false); }}>
                            {copySuccess ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                            )}
                            <span>{copySuccess ? t('donate.copied') : t('donate.copyLink')}</span>
                          </button>
                          <button type="button" role="menuitem" tabIndex={shareMenuOpen ? 0 : -1} onClick={() => { openShare('whatsapp'); setShareMenuOpen(false); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z" /></svg>
                            <span>WhatsApp</span>
                          </button>
                          <button type="button" role="menuitem" tabIndex={shareMenuOpen ? 0 : -1} onClick={() => { openShare('twitter'); setShareMenuOpen(false); }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.2 2.3h3.3l-7.2 8.3 8.5 11.2h-6.7l-5.2-6.8-6 6.8H1.6l7.7-8.8L1.3 2.3H8l4.7 6.2 5.5-6.2Z" /></svg>
                            <span>X (Twitter)</span>
                          </button>
                          <button type="button" role="menuitem" tabIndex={shareMenuOpen ? 0 : -1} onClick={() => { openShare('facebook'); setShareMenuOpen(false); }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.33l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z" /></svg>
                            <span>Facebook</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className={styles.body}>
                      <h2 id="donate-campaign-title">{getTitle(campaignDetails)}</h2>
                      {getDescription(campaignDetails) && (
                        <p className={styles.description}>{getDescription(campaignDetails)}</p>
                      )}
                      {getImpact(campaignDetails) && (
                        <p className={styles.impact}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 8.6a5.5 5.5 0 0 0-7.8 0L12 9.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
                          <span>{getImpact(campaignDetails)}</span>
                        </p>
                      )}
                      {(campaignDetails.goal_amount != null && campaignDetails.goal_amount > 0) && (
                        <div className={styles.progress}>
                          <div className={styles.progressRow}>
                            <span>{t('campaigns.raised')} <b>{formatAmount(raised)} {currency}</b></span>
                            <span className={styles.pct}>{nowPercent}{percentSign}</span>
                            <span>{t('campaigns.goal')} <b>{formatAmount(goal)} {currency}</b></span>
                          </div>
                          <div
                            className={styles.bar}
                            role="progressbar"
                            aria-valuenow={nowPercent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={t('campaigns.raised')}
                            style={{ '--now': `${nowPercent}%`, '--add': `${previewPercent}%` } as CSSProperties}
                          >
                            <i className={styles.barNow} />
                            <i className={styles.barAdd} />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
                <FxDot index={0} />
              </article>
            )}

            <form onSubmit={handleSubmit} className={`ds-card ${styles.formCard}`}>
              <h3 id="donate-amounts-heading">{t('donate.quickAmounts')}</h3>
              <div className={styles.quickAmounts} role="group" aria-labelledby="donate-amounts-heading">
                {quickAmounts.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={amount === String(n) ? `${styles.quickBtn} ${styles.active}` : styles.quickBtn}
                    onClick={() => setAmount(String(n))}
                  >
                    {n} {t('donate.currencyShort')}
                  </button>
                ))}
              </div>

              <div className={styles.field}>
                <label htmlFor="donate-amount-input">{t('donate.amount')}</label>
                <div className={styles.control}>
                  <input
                    id="donate-amount-input"
                    type="number"
                    min={0.001}
                    step="any"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    disabled={submitting}
                  />
                  <span className={styles.unit} aria-hidden="true">{currency}</span>
                </div>
              </div>

              {!isAuthenticated && (
                <div className={`${styles.field} ${styles.tel}`}>
                  <label htmlFor="donate-phone-input">{t('donate.phone')}</label>
                  <div className={styles.control}>
                    <input
                      id="donate-phone-input"
                      type="tel"
                      inputMode="numeric"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder={t('donate.phonePlaceholder')}
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className={styles.errorWrap} role="alert" key={error}>
                  <p className={styles.error}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                    <span>{error}</span>
                  </p>
                  {retryDonationId != null && (
                    <button
                      type="button"
                      className={`ds-btn ds-btn-ghost ${styles.retry}`}
                      disabled={submitting}
                      onClick={async () => {
                        setError(null)
                        setSubmitting(true)
                        try {
                          const numAmount = parseFloat(amount)
                          if (!Number.isFinite(numAmount)) return
                          const origin = typeof window !== 'undefined' ? window.location.origin : ''
                          const res = await paymentService.createWithDonation(retryDonationId, numAmount, origin)
                          if (res.payment_url) window.location.href = res.payment_url
                          else setError(t('donate.error'))
                        } catch {
                          setError(t('donate.error'))
                        } finally {
                          setSubmitting(false)
                        }
                      }}
                    >
                      {t('common.retry')}
                    </button>
                  )}
                </div>
              )}

              <button type="submit" className={`ds-btn ds-btn-ink ${styles.pay}`} disabled={submitting}>
                {submitting ? t('common.loading') : t('donate.submit')}
                {!submitting && (
                  <svg className="ds-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 12H5M11 18l-6-6 6-6" />
                  </svg>
                )}
              </button>
              <FxDot index={1} />
            </form>
          </Train>
        </div>
      </div>
    </PageLayout>
  )
}
