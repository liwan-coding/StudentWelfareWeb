import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuth } from '../../context/AuthContext'
import { resolveImageUrl } from '../../config/api'
import { campaignService } from '../../services/campaignService'
import { donationService } from '../../services/donationService'
import { paymentService } from '../../services/paymentService'
import { ApiError, clearToken, getApiErrorMessage } from '../../services/apiClient'
import type { CampaignOrProgram } from '../../types/api'
import { getCampaignProgressPercent } from '../../components/CampaignAmountGoal'
import { PageHero } from '../../components/design/PageHero'
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
      setError(t('donate.amountRequired'))
      return
    }
    if (!isAuthenticated && !donorPhone.trim()) {
      setError(t('donate.phoneRequired'))
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
      setError(getApiErrorMessage(err, t))
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
          <div className={styles.main}>
            <div className="ds-wrap">
              <p className={styles.placeholder} role="status">
                <span className={styles.spinner} aria-hidden="true" />
                <span>{t('common.loading')}</span>
              </p>
            </div>
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
  // preview of the typed amount on the bar (visual only; never sent anywhere)
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

        <div className={styles.main}>
          <div className={`ds-wrap ${styles.layout} ${showDetails ? '' : styles.layoutSingle}`}>
            {showDetails && (
              <article className={styles.summary} aria-busy={detailsLoading} aria-labelledby={campaignDetails ? 'donate-campaign-title' : undefined}>
                {detailsLoading ? (
                  <div className={styles.skeleton} aria-hidden="true">
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
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" /><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16" />
                          </svg>
                        </button>
                        <div className={`${styles.shareMenu} ${shareMenuOpen ? styles.shareMenuOpen : ''}`} role="menu" aria-hidden={!shareMenuOpen}>
                          <button type="button" role="menuitem" tabIndex={shareMenuOpen ? 0 : -1} onClick={() => { handleCopyLink(); setShareMenuOpen(false); }}>
                            <span>{copySuccess ? t('donate.copied') : t('donate.copyLink')}</span>
                            {copySuccess ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2.5" /><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" /></svg>
                            )}
                          </button>
                          <button type="button" role="menuitem" tabIndex={shareMenuOpen ? 0 : -1} onClick={() => { openShare('whatsapp'); setShareMenuOpen(false); }}>
                            <span>WhatsApp</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z" /></svg>
                          </button>
                          <button type="button" role="menuitem" tabIndex={shareMenuOpen ? 0 : -1} onClick={() => { openShare('twitter'); setShareMenuOpen(false); }}>
                            <span>X (Twitter)</span>
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.2 2.3h3.3l-7.2 8.3 8.5 11.2h-6.7l-5.2-6.8-6 6.8H1.6l7.7-8.8L1.3 2.3H8l4.7 6.2 5.5-6.2Z" /></svg>
                          </button>
                          <button type="button" role="menuitem" tabIndex={shareMenuOpen ? 0 : -1} onClick={() => { openShare('facebook'); setShareMenuOpen(false); }}>
                            <span>Facebook</span>
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.33l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className={styles.body}>
                      <h2 id="donate-campaign-title" className={styles.title}>{getTitle(campaignDetails)}</h2>
                      {getDescription(campaignDetails) && (
                        <p className={styles.description}>{getDescription(campaignDetails)}</p>
                      )}
                      {getImpact(campaignDetails) && (
                        <p className={styles.impact}>
                          <span className={styles.impactIcon} aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.6 10.7 19.4C5.9 15.1 3 12.4 3 8.9 3 6.1 5.2 4 7.9 4c1.6 0 3.1.7 4.1 1.9C13 4.7 14.5 4 16.1 4 18.8 4 21 6.1 21 8.9c0 3.5-2.9 6.2-7.7 10.5L12 20.6Z" /></svg>
                          </span>
                          <span>{getImpact(campaignDetails)}</span>
                        </p>
                      )}
                      {(campaignDetails.goal_amount != null && campaignDetails.goal_amount > 0) && (
                        <div className={styles.progress}>
                          <div className={styles.progressHead}>
                            <span className={styles.pct}>{nowPercent}{percentSign}</span>
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
                          <dl className={styles.stats}>
                            <div>
                              <dt>{t('campaigns.raised')}</dt>
                              <dd>{formatAmount(raised)} <small>{currency}</small></dd>
                            </div>
                            <div>
                              <dt>{t('campaigns.goal')}</dt>
                              <dd>{formatAmount(goal)} <small>{currency}</small></dd>
                            </div>
                          </dl>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </article>
            )}

            <div className={styles.checkoutCol}>
              <form onSubmit={handleSubmit} className={styles.checkout}>
                <section className={styles.group} aria-labelledby="donate-amounts-heading">
                  <h2 id="donate-amounts-heading" className={styles.groupTitle}>{t('donate.quickAmounts')}</h2>
                  <div className={styles.tiles} role="group" aria-labelledby="donate-amounts-heading">
                    {quickAmounts.map((n) => {
                      const selected = amount === String(n)
                      return (
                        <button
                          key={n}
                          type="button"
                          className={selected ? `${styles.tile} ${styles.tileOn}` : styles.tile}
                          aria-pressed={selected}
                          onClick={() => setAmount(String(n))}
                          disabled={submitting}
                        >
                          <span className={styles.tileValue}>{n}</span>{' '}
                          <span className={styles.tileUnit}>{t('donate.currencyShort')}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className={`ds-field ${styles.field}`}>
                    <label htmlFor="donate-amount-input" className="ds-label">{t('donate.amount')}</label>
                    <div className={styles.control}>
                      <input
                        id="donate-amount-input"
                        className={`ds-input ${styles.amountInput}`}
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
                </section>

                {!isAuthenticated && (
                  <section className={styles.group}>
                    <div className="ds-field">
                      <label htmlFor="donate-phone-input" className="ds-label">{t('donate.phone')}</label>
                      <input
                        id="donate-phone-input"
                        className={`ds-input ${styles.telInput}`}
                        type="tel"
                        inputMode="numeric"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        placeholder={t('donate.phonePlaceholder')}
                        disabled={submitting}
                        required
                      />
                    </div>
                  </section>
                )}

                {error && (
                  <div className={styles.errorWrap} role="alert" key={error}>
                    <p className={styles.error}>
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5.5h2v7h-2v-7Zm1 11.2a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z" /></svg>
                      <span>{error}</span>
                    </p>
                    {retryDonationId != null && (
                      <button
                        type="button"
                        className="ds-btn ds-btn-gray ds-btn-sm"
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

                <div className={styles.payBar}>
                  <button type="submit" className={`ds-btn ds-btn-filled ds-btn-lg ds-btn-block ${styles.pay}`} disabled={submitting} aria-busy={submitting}>
                    {submitting ? (
                      <span className={`${styles.spinner} ${styles.spinnerOnTint}`} aria-hidden="true" />
                    ) : (
                      <svg className={styles.lock} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2.5a4.75 4.75 0 0 0-4.75 4.75V10H7a2.5 2.5 0 0 0-2.5 2.5v6.5A2.5 2.5 0 0 0 7 21.5h10a2.5 2.5 0 0 0 2.5-2.5v-6.5A2.5 2.5 0 0 0 17 10h-.25V7.25A4.75 4.75 0 0 0 12 2.5Zm-2.75 4.75a2.75 2.75 0 0 1 5.5 0V10h-5.5V7.25Z" />
                      </svg>
                    )}
                    <span>{submitting ? t('common.loading') : t('donate.submit')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
