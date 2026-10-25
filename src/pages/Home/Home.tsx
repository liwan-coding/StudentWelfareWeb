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
import { Backdrop } from '../../components/design/Backdrop'
import { CampaignCard } from '../../components/design/CampaignCard'
import { PartnersWall, type WallPartner } from '../../components/design/PartnersWall'
import { FeatBadge } from '../../components/design/FeatBadge'
import { useInViewOnce } from '../../components/design/useInViewOnce'
import styles from './Home.module.css'

function ArrowIcon() {
  return (
    <svg className="ds-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  )
}

/** apple.com style "Learn more" chevron: points left for RTL, flipped in LTR by .ds-arrow. */
function Chevron() {
  return (
    <svg className={`ds-arrow ${styles.chev}`} width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 1L1 7l6 6" />
    </svg>
  )
}

/** Centred section header that fades up once when it scrolls into view. */
function SectionHead({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>(0.3)
  return (
    <div ref={ref} className={`ds-vx ${inView ? 'ds-in' : ''} ${styles.head} ${className}`.trim()}>
      {children}
    </div>
  )
}

/** News card: image, date, title and a short excerpt; fades up on entry. */
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
  const [ref, inView] = useInViewOnce<HTMLElement>(0.2)
  return (
    <article
      ref={ref}
      className={`ds-card ds-reveal ${inView ? 'ds-in' : ''} ${styles.nw}`}
      style={{ '--i': index % 3 } as CSSProperties}
    >
      <div className={styles.nwMedia}>
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" className={styles.nwImg} />
        ) : (
          <span className={styles.nwPlaceholder} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M7 9h10M7 13h10M7 17h6" />
            </svg>
          </span>
        )}
        {featured && <FeatBadge label={featuredLabel} small className={styles.nwBadge} />}
      </div>
      <div className={styles.nwBody}>
        {date && <time dateTime={dateTime}>{date}</time>}
        <h3>{title}</h3>
        {excerpt && <p>{excerpt}</p>}
      </div>
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

  // "now" captured once at mount so render stays pure
  const [nowMs] = useState(() => Date.now())
  const getTimeAgoKey = (iso?: string): { key: string; count?: number } => {
    if (!iso) return { key: 'home.timeAgoJustNow' }
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return { key: 'home.timeAgoJustNow' }
    const diffMs = nowMs - d.getTime()
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
    // signed out: the stale value is ignored below (see activeRegistration), no reset needed
    if (!isAuthenticated) return
    let cancelled = false
    studentRegistrationService
      .getMyRegistration()
      .then((reg) => { if (!cancelled) setMyRegistration(reg ?? null) })
      .catch(() => { if (!cancelled) setMyRegistration(null) })
    return () => { cancelled = true }
  }, [isAuthenticated])

  const activeRegistration = isAuthenticated ? myRegistration : undefined
  const regStatus = activeRegistration && typeof activeRegistration.status === 'string' ? String(activeRegistration.status).toLowerCase() : ''
  const isRegisteredInFund = Boolean(isAuthenticated && activeRegistration)
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
  const [regRef, regInView] = useInViewOnce<HTMLDivElement>(0.25)
  const percentSign = lang === 'ar' ? '٪' : '%'
  const currency = t('donate.currencyShort')
  const wallPartners: WallPartner[] = partnersList.map((p) => {
    const nameKey = lang === 'ar' ? 'name_ar' : 'name_en'
    const name = (p[nameKey as keyof FundPartner] as string) || p.name_ar || p.name_en || `Partner ${p.id}`
    return { key: String(p.id), name, logoUrl: resolveImageUrl(p.logo_url ?? p.logo), link: p.link || undefined }
  })
  const dir = isRtl ? 'rtl' : 'ltr'

  const partnersHead = (
    <SectionHead>
      <span className="ds-eyebrow ds-vx-copy">{t('partners.featured')}</span>
      <h2 id="partners-heading" className="ds-title-1 ds-vx-title">{t('nav.partners')}</h2>
      <p className="ds-subhead ds-vx-copy">{t('partners.subtitle')}</p>
      <Link to="/partners" className="ds-btn ds-btn-plain">{t('home.viewAll')}<Chevron /></Link>
    </SectionHead>
  )

  return (
    <PageLayout noPadding design>
      <Loader onDone={() => setReady(true)} />

      {/* ================= Hero ================= */}
      <section className={`ds-dark ${styles.hero}`} data-dark-hero aria-label={t('app.name')} dir={dir} lang={i18n.language || 'ar'}>
        <Backdrop className={styles.heroMesh} />
        <div className={`ds-wrap ${styles.heroInner}`}>
          <div className={`ds-vx ${ready ? 'ds-in' : ''} ${styles.heroText}`}>
            <span className={`ds-eyebrow ds-vx-copy ${styles.heroEyebrow}`}>{t('app.tagline')}</span>
            <h1 className={`ds-vx-title ds-gradient-text ${styles.heroTitle}`}>{t('home.heroTitle')}</h1>
            <p className={`ds-vx-copy ${styles.heroSub}`}>{t('home.heroSubtitle')}</p>
            <div className={styles.heroCtas}>
              <Link to="/donate" className="ds-btn ds-btn-glow ds-btn-lg">{t('home.ctaDonate')}</Link>
              <a href="#campaigns" className="ds-btn ds-btn-plain ds-btn-lg">
                {t('home.campaignsSectionTitle')}
                <Chevron />
              </a>
            </div>
          </div>

          {hasBanners && (
            <div className={`${styles.banners} ${ready ? styles.bannersOn : ''}`} aria-label={t('home.bannersLabel')}>
              <div className={styles.bannerFrame}>
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
              </div>
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
                    >
                      <i aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ================= Student registration ================= */}
      <section className={`${styles.section} ${styles.alt}`} aria-label={t('home.regCardTag')} dir={dir}>
        <div className="ds-wrap">
          <div
            ref={regRef}
            className={`ds-dark ds-glow-card ds-reveal ${regInView ? 'ds-in' : ''} ${styles.reg} ${cardBgImage ? styles.regHasMedia : ''}`}
          >
            <Backdrop className={styles.regAurora} />
            <div className={styles.regText}>
              <span className={styles.regIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10L12 5 2 10l10 5 10-5z" />
                  <path d="M6 12v5c3 2 9 2 12 0v-5" />
                </svg>
              </span>
              <span className="ds-eyebrow">{t('home.regCardTag')}</span>
              <h2 className={styles.regTitle}>{cardHeadline}</h2>
              <p className={styles.regSub}>{cardSubtitle}</p>
              <Link to="/student-registration" className={`ds-btn ds-btn-filled ds-btn-lg ${styles.regBtn} ${statusClass}`}>
                {statusLabel}
                <ArrowIcon />
              </Link>
            </div>
            {cardBgImage && (
              <div className={styles.regMedia} aria-hidden="true">
                <img src={cardBgImage} alt="" loading="lazy" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= Initiatives ================= */}
      <section className={styles.section} id="campaigns" aria-labelledby="campaigns-heading" dir={dir}>
        <div className="ds-wrap">
          <SectionHead>
            <h2 id="campaigns-heading" className="ds-title-1 ds-vx-title">{t('home.campaignsSectionTitle')}</h2>
            <p className="ds-subhead ds-vx-copy">{t('campaigns.subtitle')}</p>
            {campaigns.length > 0 && (
              <Link to="/campaigns" className="ds-btn ds-btn-plain">{t('home.viewAll')}<Chevron /></Link>
            )}
          </SectionHead>
          {loadingCampaigns ? (
            <div className={styles.grid3} aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`ds-card ${styles.skeleton}`}>
                  <span className={styles.skeletonRing} />
                  <span className={styles.skeletonLine} />
                  <span className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
                </div>
              ))}
              <span className={styles.srOnly}>{t('common.loading')}</span>
            </div>
          ) : campaigns.length === 0 ? (
            <p className={styles.empty}>{t('campaigns.noCampaigns')}</p>
          ) : (
            <div className={styles.grid3}>
              {campaigns.map((item, i) => {
                const raised = Number(item.raised_amount) || 0
                const goal = Number(item.goal_amount) || 0
                return (
                  <CampaignCard
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
        </div>
      </section>

      {/* ================= News ================= */}
      <section className={`${styles.section} ${styles.alt}`} id="news" aria-labelledby="news-heading" dir={dir}>
        <div className="ds-wrap">
          <SectionHead>
            <span className="ds-eyebrow ds-vx-copy">{t('news.featured')}</span>
            <h2 id="news-heading" className="ds-title-1 ds-vx-title">{t('nav.news')}</h2>
            <p className="ds-subhead ds-vx-copy">{t('news.subtitle')}</p>
            {newsList.length > 0 && (
              <Link to="/news" className="ds-btn ds-btn-plain">{t('home.viewAll')}<Chevron /></Link>
            )}
          </SectionHead>
          {loadingNews ? (
            <div className={styles.grid3} aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`ds-card ${styles.nwSkeleton}`}>
                  <span className={styles.nwSkeletonMedia} />
                  <span className={styles.skeletonLine} />
                  <span className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
                </div>
              ))}
              <span className={styles.srOnly}>{t('common.loading')}</span>
            </div>
          ) : newsList.length === 0 ? (
            <p className={styles.empty}>{t('news.noNews')}</p>
          ) : (
            <div className={styles.grid3}>
              {newsList.map((item, i) => {
                const titleKey = lang === 'ar' ? 'title_ar' : 'title_en'
                const contentKey = lang === 'ar' ? 'content_ar' : 'content_en'
                const title = (item[titleKey as keyof FundNews] as string) || `#${item.id}`
                const content = (item[contentKey as keyof FundNews] as string) || ''
                const plain = stripHtml(content)
                const excerpt = plain.slice(0, 120) + (plain.length > 120 ? '…' : '')
                return (
                  <NewsBox
                    key={item.id}
                    index={i}
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
          )}
        </div>
      </section>

      {SHOW_RECENT_DONATIONS && (
        <section className={styles.section} aria-labelledby="recent-donations-heading" dir={dir}>
          <div className="ds-wrap ds-wrap-narrow">
            <SectionHead>
              <h2 id="recent-donations-heading" className="ds-title-1 ds-vx-title">{t('home.recentDonations')}</h2>
              <p className="ds-subhead ds-vx-copy">{t('home.recentDonationsSubtitle')}</p>
            </SectionHead>
            {loadingDonations ? (
              <p className={styles.srOnly}>{t('common.loading')}</p>
            ) : (
              <ul className={`ds-list ${styles.donationList}`}>
                {recentDonations.map((d, i) => {
                  const donation = d as RecentDonation
                  const timeAgo = getTimeAgoKey(donation.created_at)
                  return (
                    <li key={`${donation.id ?? i}-${i}`}>
                      <span className={styles.donor}>{t('home.benefactorLabel')}</span>
                      {timeAgo.key !== 'home.timeAgoJustNow' && (
                        <span className={styles.donTime}>{t(timeAgo.key, { count: timeAgo.count ?? 0 })}</span>
                      )}
                      <b className={styles.donAmount}>{formatDonationAmount(donation.amount)} {t('donate.currencyShort', 'OMR')}</b>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ================= Partners ================= */}
      <section className={`${styles.section} ${SHOW_RECENT_DONATIONS ? styles.alt : ''}`} id="partners" aria-labelledby="partners-heading" dir={dir}>
        <div className="ds-wrap">
          {!loadingPartners && wallPartners.length > 0 ? (
            <PartnersWall partners={wallPartners}>{partnersHead}</PartnersWall>
          ) : (
            <>
              {partnersHead}
              {loadingPartners ? (
                <p className={styles.srOnly}>{t('common.loading')}</p>
              ) : (
                <p className={styles.empty}>{t('partners.noPartners')}</p>
              )}
            </>
          )}
        </div>
      </section>
    </PageLayout>
  )
}
