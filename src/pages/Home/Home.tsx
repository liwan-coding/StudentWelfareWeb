import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setDocumentDirection } from '../../i18n/config'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuth } from '../../context/AuthContext'
import { campaignService } from '../../services/campaignService'
import { donationService } from '../../services/donationService'
import { studentRegistrationService, type StudentRegistrationResponse } from '../../services/studentRegistrationService'
import { studentRegistrationCardService } from '../../services/studentRegistrationCardService'
import { bannerService } from '../../services/bannerService'
import { fundNewsService } from '../../services/fundNewsService'
import { fundPartnerService } from '../../services/fundPartnerService'
import { resolveImageUrl } from '../../config/api'
import type { CampaignOrProgram, RecentDonation, Banner, StudentRegistrationCard, FundNews, FundPartner } from '../../types/api'
import { getCampaignProgressPercent } from '../../components/CampaignAmountGoal'
import { Loader } from '../../components/design/Loader'
import { SilkCanvas } from '../../components/design/SilkCanvas'
import { HourglassCard } from '../../components/design/Hourglass'
import { PartnersArc, type ArcPartner } from '../../components/design/PartnersArc'
import { FeatBadge } from '../../components/design/FeatBadge'
import { FxDot } from '../../components/design/FxDot'
import { useInViewOnce } from '../../components/design/useInViewOnce'
import styles from './Home.module.css'

function ArrowIcon() {
  return (
    <svg className="ds-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  )
}

/** Section heading with the framed entrance: a rule draws, the title rises, the copy fades, buttons open. */
function SectionHead({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>(0.3)
  return (
    <div ref={ref} className={`ds-vx ${inView ? 'ds-in' : ''} ${styles.head} ${className}`.trim()}>
      <i className="ds-vx-rule" aria-hidden="true" />
      {children}
    </div>
  )
}

/** A news box: equal boxes, the one under the pointer opens wider; rises and unveils on entry. */
function NewsBox({ index, featured, featuredLabel, imageUrl, date, dateTime, title, excerpt }: {
  index: number
  featured: boolean
  featuredLabel: string
  imageUrl: string
  date: string
  dateTime: string
  title: string
  excerpt: string
}) {
  const [ref, inView] = useInViewOnce<HTMLElement>(0.25)
  const gradients = [
    'linear-gradient(150deg,#A2458C,#D47EC0 55%,#32A1BF)',
    'linear-gradient(150deg,#32A1BF,#7FD0E6)',
    'linear-gradient(150deg,#7E2F6C,#32A1BF)',
  ]
  const style = { '--i': index % 3, '--ring-delay': `${-(index % 3) * 2.3}s` } as CSSProperties
  const imgStyle = { '--cv': gradients[index % 3], ...(imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}) } as CSSProperties
  return (
    <article ref={ref} className={`ds-card ${styles.nw} ${featured ? styles.nwF : ''} ${inView ? styles.nwIn : ''}`} style={style}>
      <div className={styles.nwImg} style={imgStyle} />
      {featured && <FeatBadge label={featuredLabel} sparks className={styles.nwBadge} />}
      <div className={styles.nwBody}>
        <time dateTime={dateTime}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
          {date}
        </time>
        <h3>{title}</h3>
        <p>{excerpt}</p>
      </div>
      <FxDot index={index} />
    </article>
  )
}


const FALLBACK_CARD_DESC_AR = 'سجّل طلبك للاستفادة من برامج الدعم الدراسي. استكمل بياناتك وارفع المستندات المطلوبة.'
const FALLBACK_CARD_DESC_EN = 'Register your application for student support programs. Complete your details and upload required documents.'

/** إخفاء قسم آخر التبرعات من الصفحة الرئيسية */
const SHOW_RECENT_DONATIONS = false

function formatNewsDate(isoDate: string | undefined, locale: string): string {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-GB', { dateStyle: 'medium' }).format(d)
  } catch {
    return ''
  }
}

function stripHtml(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim()
}

export function Home() {
  const { t, i18n } = useTranslation('common')
  const { isAuthenticated } = useAuth()
  const [campaigns, setCampaigns] = useState<CampaignOrProgram[]>([])
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([])
  const [myRegistration, setMyRegistration] = useState<StudentRegistrationResponse | null | undefined>(undefined)
  const [registrationCard, setRegistrationCard] = useState<StudentRegistrationCard | null | undefined>(undefined)
  const [banners, setBanners] = useState<Banner[]>([])
  const [newsList, setNewsList] = useState<FundNews[]>([])
  const [partnersList, setPartnersList] = useState<FundPartner[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [loadingDonations, setLoadingDonations] = useState(true)
  const [loadingNews, setLoadingNews] = useState(true)
  const [loadingPartners, setLoadingPartners] = useState(true)
  const [bannerIndex, setBannerIndex] = useState(0)

  const lang = i18n.language === 'ar' ? 'ar' : 'en'
  const isRtl = (i18n.language || '').startsWith('ar')
  const titleKey = lang === 'ar' ? 'title_ar' : 'title_en'
  const getTitle = (item: CampaignOrProgram) =>
    (item[titleKey as keyof CampaignOrProgram] as string) || item.title || `#${item.id}`

  const getTimeAgoKey = (iso?: string): { key: string; count?: number } => {
    if (!iso) return { key: 'home.timeAgoJustNow' }
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return { key: 'home.timeAgoJustNow' }
    const diffMs = Date.now() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMins < 1) return { key: 'home.timeAgoJustNow' }
    if (diffMins < 60) return { key: 'home.timeAgoMinutes', count: diffMins }
    if (diffHours < 24) return { key: 'home.timeAgoHours', count: diffHours }
    if (diffDays < 7) return { key: 'home.timeAgoDays', count: diffDays }
    if (diffWeeks < 4) return { key: 'home.timeAgoWeeks', count: diffWeeks }
    return { key: 'home.timeAgoMonths', count: diffMonths }
  }

  const formatDonationAmount = (amount?: number) =>
    (amount != null ? Number(amount) : 0).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

  useEffect(() => {
    let cancelled = false
    campaignService
      .getAllCampaigns()
      .then((list) => { if (!cancelled) setCampaigns(list) })
      .catch((err) => {
        if (!cancelled) console.error('[Home] campaigns failed:', err)
      })
      .finally(() => { if (!cancelled) setLoadingCampaigns(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!SHOW_RECENT_DONATIONS) return
    let cancelled = false
    donationService
      .getRecent(10)
      .then((list) => { if (!cancelled) setRecentDonations(list) })
      .catch((err) => {
        if (!cancelled) console.error('[Home] donations/recent failed:', err)
      })
      .finally(() => { if (!cancelled) setLoadingDonations(false) })
    return () => { cancelled = true }
  }, [])

  // Keep document RTL/LTR in sync when this page is shown (e.g. after language switch)
  useEffect(() => {
    setDocumentDirection(i18n.language || 'ar')
  }, [i18n.language])

  // بطاقة تسجيل الطالب للصندوق — GET /api/v1/student-registration-card
  useEffect(() => {
    let cancelled = false
    studentRegistrationCardService
      .getCard()
      .then((card) => { if (!cancelled) setRegistrationCard(card ?? null) })
      .catch(() => { if (!cancelled) setRegistrationCard(null) })
      .finally(() => {})
    return () => { cancelled = true }
  }, [])

  // البانرات المميزة — GET /api/v1/banners/featured
  useEffect(() => {
    let cancelled = false
    bannerService
      .getFeatured()
      .then((list) => { if (!cancelled) setBanners(list || []) })
      .catch((err) => {
        if (!cancelled) console.error('[Home] banners/featured failed:', err)
        if (!cancelled) setBanners([])
      })
      .finally(() => {})
    return () => { cancelled = true }
  }, [])

  // الأخبار المميزة — GET /api/v1/fund-news (أو featured)
  useEffect(() => {
    let cancelled = false
    fundNewsService
      .getList()
      .then((list) => { if (!cancelled) setNewsList(list || []) })
      .catch((err) => {
        if (!cancelled) console.error('[Home] fund-news failed:', err)
        if (!cancelled) setNewsList([])
      })
      .finally(() => { if (!cancelled) setLoadingNews(false) })
    return () => { cancelled = true }
  }, [])

  // الشركاء — GET /api/v1/fund-partners
  useEffect(() => {
    let cancelled = false
    fundPartnerService
      .getList()
      .then((list) => { if (!cancelled) setPartnersList(list || []) })
      .catch((err) => {
        if (!cancelled) console.error('[Home] fund-partners failed:', err)
        if (!cancelled) setPartnersList([])
      })
      .finally(() => { if (!cancelled) setLoadingPartners(false) })
    return () => { cancelled = true }
  }, [])

  // Rotate hero banners every 5s
  useEffect(() => {
    if (banners.length <= 1) return
    const id = setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length)
    }, 5000)
    return () => clearInterval(id)
  }, [banners.length])

  // جلب حالة طلب المستخدم المسجّل
  useEffect(() => {
    if (!isAuthenticated) {
      setMyRegistration(undefined)
      return
    }
    let cancelled = false
    studentRegistrationService
      .getMyRegistration()
      .then((reg) => { if (!cancelled) setMyRegistration(reg ?? null) })
      .catch(() => { if (!cancelled) setMyRegistration(null) })
    return () => { cancelled = true }
  }, [isAuthenticated])

  const regStatus = myRegistration && typeof myRegistration.status === 'string' ? String(myRegistration.status).toLowerCase() : ''
  const isRegisteredInFund = Boolean(isAuthenticated && myRegistration)
  const statusLabel =
    isRegisteredInFund && regStatus
      ? (t(`studentRegistration.status_${regStatus}`) !== `studentRegistration.status_${regStatus}` ? t(`studentRegistration.status_${regStatus}`) : t('studentRegistration.status_pending'))
      : isRegisteredInFund
        ? t('home.ctaRequestStatus')
        : t('home.ctaStartRegistration')
  const statusClass =
    regStatus === 'approved' ? styles.regCardButtonStatusApproved
      : regStatus === 'rejected' ? styles.regCardButtonStatusRejected
        : (regStatus === 'pending' || regStatus) ? styles.regCardButtonStatusPending
          : ''

  const hasBanners = banners.length > 0
  const cardHeadline =
    registrationCard && (i18n.language === 'ar' ? registrationCard.headline_ar : registrationCard.headline_en)
      ? (i18n.language === 'ar' ? registrationCard.headline_ar : registrationCard.headline_en)!
      : t('home.ctaRegister')
  const cardSubtitle =
    registrationCard && (i18n.language === 'ar' ? registrationCard.subtitle_ar : registrationCard.subtitle_en)
      ? (i18n.language === 'ar' ? registrationCard.subtitle_ar : registrationCard.subtitle_en)!
      : (lang === 'ar' ? FALLBACK_CARD_DESC_AR : FALLBACK_CARD_DESC_EN)
  const cardBgImage =
    registrationCard?.background_image_url ?? registrationCard?.background_image
      ? resolveImageUrl(registrationCard.background_image_url || registrationCard.background_image)
      : undefined


  // ===== presentation only below: the data and logic above are unchanged =====
  const [ready, setReady] = useState(false)
  const [regRef, regInView] = useInViewOnce<HTMLDivElement>(0.3)
  const heroWords = t('home.heroTitle').split(' ')
  const gradFrom = Math.floor(heroWords.length / 2)
  const percentSign = lang === 'ar' ? '٪' : '%'
  const currency = t('donate.currencyShort')
  const newsRows: FundNews[][] = []
  for (let i = 0; i < newsList.length; i += 3) newsRows.push(newsList.slice(i, i + 3))
  const arcPartners: ArcPartner[] = partnersList.map((p) => {
    const nameKey = lang === 'ar' ? 'name_ar' : 'name_en'
    const name = (p[nameKey as keyof FundPartner] as string) || p.name_ar || p.name_en || `Partner ${p.id}`
    return { key: String(p.id), name, logoUrl: resolveImageUrl(p.logo_url ?? p.logo), link: p.link || undefined }
  })

  return (
    <PageLayout noPadding design>
      <Loader onDone={() => setReady(true)} />

      {/* ================= Hero: dark silk band ================= */}
      <section className={styles.hero} data-hero aria-label={t('app.name')} dir={isRtl ? 'rtl' : 'ltr'} lang={i18n.language || 'ar'}>
        <SilkCanvas className={styles.heroCanvas} />
        <div className={`ds-wrap ${styles.heroGrid}`}>
          <div className={`ds-vx ${ready ? 'ds-in' : ''} ${styles.heroText}`}>
            <i className="ds-vx-rule" aria-hidden="true" />
            <span className={`ds-vx-copy ${styles.heroEyebrow}`}>{t('app.tagline')}</span>
            <h1 className="ds-vx-title">
              {heroWords.slice(0, gradFrom).join(' ')}{gradFrom > 0 ? ' ' : ''}
              <span className={styles.grad}>{heroWords.slice(gradFrom).join(' ')}</span>
            </h1>
            <p className={`ds-vx-copy ${styles.heroSub}`}>{t('home.heroSubtitle')}</p>
          </div>

          {hasBanners ? (
            <div className={`${styles.banners} ${ready ? styles.bannersOn : ''}`} aria-label={t('home.bannersLabel')}>
              {banners.map((banner, i) => (
                <div
                  key={banner.id}
                  className={`${styles.bannerSlide} ${i === bannerIndex ? styles.bannerSlideActive : ''}`}
                  style={{
                    backgroundImage: banner.image_url || banner.image
                      ? `url(${resolveImageUrl(banner.image_url || banner.image)})`
                      : undefined,
                  }}
                  aria-hidden={i !== bannerIndex}
                />
              ))}
              {banners.length > 1 && (
                <div className={styles.bannerDots} role="tablist" aria-label={t('home.bannersLabel')}>
                  {banners.map((b, i) => (
                    <button
                      key={b.id}
                      type="button"
                      role="tab"
                      aria-selected={i === bannerIndex}
                      aria-label={t('home.bannerSlide', { number: i + 1 })}
                      className={`${styles.bannerDot} ${i === bannerIndex ? styles.bannerDotActive : ''}`}
                      onClick={() => setBannerIndex(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`${styles.climb} ${ready ? styles.climbOn : ''}`} aria-hidden="true">
              <svg viewBox="0 0 320 320">
                <defs>
                  <linearGradient id="ds-climb-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FD0E6" /><stop offset="1" stopColor="#1F6E85" /></linearGradient>
                  <linearGradient id="ds-climb-p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E7A6D8" /><stop offset="1" stopColor="#7E2F6C" /></linearGradient>
                </defs>
                <path d="M120 20h170a20 20 0 0 1 20 20v170z" fill="url(#ds-climb-p)" opacity=".85" />
                <rect className={styles.st} style={{ '--s': 0 } as CSSProperties} x="20" y="250" width="70" height="60" rx="6" fill="url(#ds-climb-t)" />
                <rect className={styles.st} style={{ '--s': 1 } as CSSProperties} x="90" y="188" width="70" height="122" rx="6" fill="url(#ds-climb-t)" />
                <rect className={styles.st} style={{ '--s': 2 } as CSSProperties} x="160" y="126" width="70" height="184" rx="6" fill="url(#ds-climb-t)" />
                <rect className={styles.st} style={{ '--s': 3 } as CSSProperties} x="230" y="64" width="70" height="246" rx="6" fill="url(#ds-climb-t)" />
                <g className={styles.walker}><circle cx="55" cy="236" r="11" fill="#FFFFFF" /><circle cx="55" cy="236" r="18" fill="none" stroke="#FFFFFF" strokeOpacity=".4" strokeWidth="2" /></g>
                <g className={styles.cap} transform="translate(245 22)"><path d="M20 10L0 0-20 10 0 20z" fill="#FFFFFF" /><path d="M-12 14v8c6 5 18 5 24 0v-8" fill="none" stroke="#FFFFFF" strokeWidth="3" /></g>
              </svg>
            </div>
          )}
        </div>
      </section>

      {/* ================= Student registration card (overlaps the hero) ================= */}
      <div className={`ds-wrap ${styles.regWrap}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div ref={regRef} className={`ds-ringbox ds-reveal ds-vx ${regInView ? 'ds-in' : ''} ${styles.regcard}`}>
          {cardBgImage && <span className={styles.regBg} style={{ backgroundImage: `url(${cardBgImage})` }} aria-hidden="true" />}
          <span className={styles.regIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <g className={styles.capg}><path d="M22 10L12 5 2 10l10 5 10-5z" /></g>
              <path d="M6 12v5c3 2 9 2 12 0v-5" />
            </svg>
          </span>
          <div className={styles.regText}>
            <span className={styles.eyebrow}>{t('home.regCardTag')}</span>
            <h3>{cardHeadline}</h3>
            <p>{cardSubtitle}</p>
          </div>
          <Link to="/student-registration" className={`ds-btn ds-btn-ink ${styles.regBtn} ${statusClass}`}>
            {statusLabel}
            <ArrowIcon />
          </Link>
          <FxDot index={0} />
        </div>
      </div>

      <div className="ds-wrap" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* ================= Initiatives: one hourglass per campaign ================= */}
        <section className={styles.block} id="campaigns" aria-labelledby="campaigns-heading">
          <div className={styles.headRow}>
            <SectionHead>
              <h2 id="campaigns-heading" className="ds-vx-title">{t('home.campaignsSectionTitle')}</h2>
              <p className="ds-vx-copy">{t('campaigns.subtitle')}</p>
            </SectionHead>
            {campaigns.length > 0 && (
              <Link to="/campaigns" className={`ds-btn ds-btn-ghost ${styles.viewAll}`}>{t('home.viewAll')}</Link>
            )}
          </div>
          {loadingCampaigns ? (
            <div className={styles.grid3} aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`ds-card ${styles.skeleton}`}>
                  <span className={styles.skeletonStage} />
                  <span className={styles.skeletonLine} />
                  <span className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
                </div>
              ))}
              <span className={styles.srOnly}>{t('common.loading')}</span>
            </div>
          ) : campaigns.length === 0 ? (
            <p className={`ds-card ${styles.empty}`}>{t('campaigns.noCampaigns')}</p>
          ) : (
            <div className={styles.grid3}>
              {campaigns.map((item, i) => {
                const raised = Number(item.raised_amount) || 0
                const goal = Number(item.goal_amount) || 0
                return (
                  <HourglassCard
                    key={item.id}
                    index={i}
                    percent={getCampaignProgressPercent(raised, goal > 0 ? goal : 1)}
                    title={getTitle(item)}
                    raisedLabel={t('campaigns.raised')}
                    goalLabel={t('campaigns.goal')}
                    raisedText={`${formatDonationAmount(raised)} ${currency}`}
                    goalText={`${formatDonationAmount(goal)} ${currency}`}
                    donateLabel={t('campaigns.donate')}
                    donateTo={`/donate?campaign_id=${item.id}`}
                    percentSign={percentSign}
                  />
                )
              })}
            </div>
          )}
        </section>

        {/* ================= News: boxes that open wider under the pointer ================= */}
        <section className={`${styles.block} ${styles.newsBlock}`} id="news" aria-labelledby="news-heading">
          <SectionHead>
            <span className="ds-vx-copy"><FeatBadge label={t('news.featured')} small /></span>
            <h2 id="news-heading" className="ds-vx-title">{t('nav.news')}</h2>
            <p className="ds-vx-copy">{t('news.subtitle')}</p>
          </SectionHead>
          {loadingNews ? (
            <div className={styles.newsGrid} aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className={`ds-card ${styles.nwSkeleton}`} />)}
              <span className={styles.srOnly}>{t('common.loading')}</span>
            </div>
          ) : newsList.length === 0 ? (
            <p className={`ds-card ${styles.empty}`}>{t('news.noNews')}</p>
          ) : (
            newsRows.map((row, r) => (
              <div key={r} className={styles.newsGrid}>
                {row.map((item, i) => {
                  const titleKey = lang === 'ar' ? 'title_ar' : 'title_en'
                  const contentKey = lang === 'ar' ? 'content_ar' : 'content_en'
                  const title = (item[titleKey as keyof FundNews] as string) || `#${item.id}`
                  const content = (item[contentKey as keyof FundNews] as string) || ''
                  const excerpt = stripHtml(content).slice(0, 120) + (stripHtml(content).length > 120 ? '…' : '')
                  return (
                    <NewsBox
                      key={item.id}
                      index={r * 3 + i}
                      featured={!!item.is_featured}
                      featuredLabel={t('news.featured')}
                      imageUrl={resolveImageUrl(item.image_url ?? item.image)}
                      date={formatNewsDate(item.published_at, lang)}
                      dateTime={item.published_at ?? ''}
                      title={title}
                      excerpt={excerpt}
                    />
                  )
                })}
              </div>
            ))
          )}
        </section>

        {SHOW_RECENT_DONATIONS && (
          <section className={styles.block} aria-labelledby="recent-donations-heading">
            <SectionHead>
              <h2 id="recent-donations-heading" className="ds-vx-title">{t('home.recentDonations')}</h2>
              <p className="ds-vx-copy">{t('home.recentDonationsSubtitle')}</p>
            </SectionHead>
            {loadingDonations ? (
              <p className={styles.srOnly}>{t('common.loading')}</p>
            ) : (
              <ul className={styles.donationList}>
                {recentDonations.map((d, i) => {
                  const donation = d as RecentDonation
                  const timeAgo = getTimeAgoKey(donation.created_at)
                  return (
                    <li key={`${donation.id ?? i}-${i}`} className="ds-card">
                      <b>{formatDonationAmount(donation.amount)} {t('donate.currencyShort', 'OMR')}</b>
                      <span>{t('home.benefactorLabel')}</span>
                      {timeAgo.key !== 'home.timeAgoJustNow' && <span>{t(timeAgo.key, { count: timeAgo.count ?? 0 })}</span>}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* ================= Partners: a turning half-circle of real logos ================= */}
      <section className={styles.arcSec} id="partners" aria-labelledby="partners-heading" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="ds-wrap">
          {!loadingPartners && arcPartners.length > 0 ? (
            <PartnersArc partners={arcPartners}>
              <SectionHead className={styles.arcHead}>
                <span className={`ds-vx-copy ${styles.eyebrow}`}>{t('partners.featured')}</span>
                <h2 id="partners-heading" className={`ds-vx-title ${styles.arcTitle}`}>{t('nav.partners')}</h2>
                <p className="ds-vx-copy">{t('partners.subtitle')}</p>
              </SectionHead>
            </PartnersArc>
          ) : (
            <>
              <SectionHead className={styles.arcHeadStatic}>
                <span className={`ds-vx-copy ${styles.eyebrow}`}>{t('partners.featured')}</span>
                <h2 id="partners-heading" className={`ds-vx-title ${styles.arcTitle}`}>{t('nav.partners')}</h2>
                <p className="ds-vx-copy">{t('partners.subtitle')}</p>
              </SectionHead>
              {loadingPartners ? (
                <p className={styles.srOnly}>{t('common.loading')}</p>
              ) : (
                <p className={`ds-card ${styles.empty}`}>{t('partners.noPartners')}</p>
              )}
            </>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
