import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuth } from '../../context/AuthContext'
import { campaignService } from '../../services/campaignService'
import { studentRegistrationService, type StudentRegistrationResponse } from '../../services/studentRegistrationService'
import { studentRegistrationCardService } from '../../services/studentRegistrationCardService'
import { bannerService } from '../../services/bannerService'
import { fundNewsService } from '../../services/fundNewsService'
import { fundPartnerService } from '../../services/fundPartnerService'
import { resolveImageUrl } from '../../config/api'
import type { CampaignOrProgram, Banner, StudentRegistrationCard, FundNews, FundPartner } from '../../types/api'
import { getCampaignProgressPercent } from '../../components/CampaignAmountGoal'
import { CampaignCard } from '../../components/design/CampaignCard'
import styles from './Home.module.css'

function ArrowIcon() {
  return (
    <svg className="ds-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  )
}

/** Section head: the title (and an optional line under it) at the start, the action at the end of the same row. */
function SectionHead({ id, title, subtitle, action }: {
  id: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className={styles.head}>
      <div className={styles.headText}>
        <h2 id={id} className={styles.headTitle}>{title}</h2>
        {subtitle && <p className={styles.headSub}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

const FALLBACK_CARD_DESC_AR = 'سجّل طلبك للاستفادة من برامج الدعم الدراسي. استكمل بياناتك وارفع المستندات المطلوبة.'
const FALLBACK_CARD_DESC_EN = 'Register your application for student support programs. Complete your details and upload required documents.'

/** campaigns shown on the home page: one wide feature + a row of three */
const HOME_CAMPAIGNS = 4

function formatNewsDate(isoDate: string | undefined, locale: string): string {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-GB', { dateStyle: 'medium' }).format(d)
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
  const [programs, setPrograms] = useState<CampaignOrProgram[]>([])
  const [myRegistration, setMyRegistration] = useState<StudentRegistrationResponse | null | undefined>(undefined)
  const [registrationCard, setRegistrationCard] = useState<StudentRegistrationCard | null | undefined>(undefined)
  const [banners, setBanners] = useState<Banner[]>([])
  const [newsList, setNewsList] = useState<FundNews[]>([])
  const [partnersList, setPartnersList] = useState<FundPartner[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [loadingPrograms, setLoadingPrograms] = useState(true)

  const lang = i18n.language === 'ar' ? 'ar' : 'en'
  const titleKey = lang === 'ar' ? 'title_ar' : 'title_en'
  const descKey = lang === 'ar' ? 'description_ar' : 'description_en'
  const getTitle = (item: CampaignOrProgram) =>
    (item[titleKey as keyof CampaignOrProgram] as string) || item.title || `#${item.id}`
  const getDesc = (item: CampaignOrProgram) =>
    (item[descKey as keyof CampaignOrProgram] as string) || item.description || ''

  const formatAmount = (amount?: number) =>
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
    let cancelled = false
    campaignService
      .getPrograms()
      .then((list) => { if (!cancelled) setPrograms(list) })
      .catch((err) => {
        if (!cancelled) console.error('[Home] programs failed:', err)
      })
      .finally(() => { if (!cancelled) setLoadingPrograms(false) })
    return () => { cancelled = true }
  }, [])

  // بطاقة تسجيل الطالب للصندوق — GET /api/v1/student-registration-card
  useEffect(() => {
    let cancelled = false
    studentRegistrationCardService
      .getCard()
      .then((card) => { if (!cancelled) setRegistrationCard(card ?? null) })
      .catch(() => { if (!cancelled) setRegistrationCard(null) })
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
      })
    return () => { cancelled = true }
  }, [])

  // الأخبار — GET /api/v1/fund-news
  useEffect(() => {
    let cancelled = false
    fundNewsService
      .getList()
      .then((list) => { if (!cancelled) setNewsList(list || []) })
      .catch((err) => {
        if (!cancelled) console.error('[Home] fund-news failed:', err)
      })
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
      })
    return () => { cancelled = true }
  }, [])

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
    regStatus === 'approved' ? styles.statusApproved
      : regStatus === 'rejected' ? styles.statusRejected
        : regStatus ? styles.statusPending
          : ''

  const cardHeadline =
    registrationCard && (lang === 'ar' ? registrationCard.headline_ar : registrationCard.headline_en)
      ? (lang === 'ar' ? registrationCard.headline_ar : registrationCard.headline_en)!
      : t('home.ctaRegister')
  const cardSubtitle =
    registrationCard && (lang === 'ar' ? registrationCard.subtitle_ar : registrationCard.subtitle_en)
      ? (lang === 'ar' ? registrationCard.subtitle_ar : registrationCard.subtitle_en)!
      : (lang === 'ar' ? FALLBACK_CARD_DESC_AR : FALLBACK_CARD_DESC_EN)

  const percentSign = lang === 'ar' ? '٪' : '%'
  const currency = t('donate.currencyShort')
  const statsReady = !loadingCampaigns && !loadingPrograms

  const featured = campaigns.slice(0, HOME_CAMPAIGNS)
  // hero: the first campaign is the featured tile
  const heroCampaign = campaigns[0]
  const heroImage = heroCampaign && (heroCampaign.image_url || heroCampaign.image) ? resolveImageUrl(heroCampaign.image_url || heroCampaign.image) : ''
  const heroPct = heroCampaign
    ? Math.round(getCampaignProgressPercent(Number(heroCampaign.raised_amount) || 0, Number(heroCampaign.goal_amount) || 1))
    : 0
  const tagFor = (c: CampaignOrProgram) => (c.is_urgent ? t('campaigns.urgent') : c.category ? (lang === 'ar' ? c.category.name_ar : c.category.name_en) || undefined : undefined)

  return (
    <PageLayout noPadding design>
      {/* ================= Hero: a bento grid of the fund's real content =================
          headline (magenta, with the logo's steps) · featured campaign photo ·
          apply for support · the support programs (ink) */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`ds-wrap ${styles.bento}`}>
          <div className={`${styles.tile} ${styles.tHead}`}>
            <p className={styles.kicker}>
              <span className={styles.nib} aria-hidden="true" />
              {t('app.name')}
            </p>
            <h1 id="hero-title" className={styles.heroTitle}>
              {t('home.heroLead')} {t('home.heroMark')} {t('home.heroTail')}
            </h1>
            <p className={styles.heroBody}>{t('home.heroBody')}</p>
            <div className={styles.heroCtas}>
              <a href="#campaigns" className="ds-btn ds-btn-light ds-btn-lg">
                {t('home.ctaDonate')}
                <ArrowIcon />
              </a>
              <Link to="/student-registration" className={`ds-btn ds-btn-lg ${styles.ghost}`}>
                {t('home.ctaApply')}
              </Link>
            </div>
            <span className={styles.headSteps} aria-hidden="true"><i /><i /><i /><i /></span>
          </div>

          {heroCampaign ? (
            <Link to={`/donate?campaign_id=${heroCampaign.id}`} className={`${styles.tile} ${styles.tFeature}`}>
              {heroImage && <img src={heroImage} alt="" decoding="async" />}
              <span className={styles.scrim} aria-hidden="true" />
              {tagFor(heroCampaign) && <span className={`ds-badge ${styles.fTag}`}>{tagFor(heroCampaign)}</span>}
              <span className={styles.fBody}>
                <span className={styles.fLabel}>{t('home.featuredLabel')}</span>
                <span className={styles.fTitle}>{getTitle(heroCampaign)}</span>
                <span
                  className={styles.fBar}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={heroPct}
                  aria-label={t('campaigns.raised')}
                >
                  <i style={{ width: `${heroPct}%` }} />
                </span>
                <span className={styles.fMeta}>
                  <b className="ds-num">{heroPct}{percentSign}</b>
                  <span className="ds-num">{formatAmount(Number(heroCampaign.raised_amount) || 0)} / {formatAmount(Number(heroCampaign.goal_amount) || 0)} {currency}</span>
                </span>
                <span className={styles.fCta}>
                  {t('campaigns.donate')}
                  <ArrowIcon />
                </span>
              </span>
            </Link>
          ) : (
            <div className={`${styles.tile} ${styles.tFeature} ${styles.tSkeleton}`} aria-hidden="true" />
          )}

          <Link to="/student-registration" className={`${styles.tile} ${styles.tApply}`}>
            <span className={styles.tIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 9.5 12 5 2 9.5l10 4.5 10-4.5z" />
                <path d="M6 11.5v4.5c3 2 9 2 12 0v-4.5" />
              </svg>
            </span>
            <span className={styles.tTitle}>{t('home.ctaApply')}</span>
            <span className={styles.tText}>{t('home.applyTileBody')}</span>
            <span className={styles.tGo} aria-hidden="true"><ArrowIcon /></span>
          </Link>

          <div className={`${styles.tile} ${styles.tPrograms}`}>
            <div className={styles.pHead}>
              <div>
                <h2 className={styles.pTitle}>{t('home.programsTitle')}</h2>
                <p className={styles.pSub}>
                  {statsReady ? t('home.programsCount', { count: programs.length }) : t('common.loading')}
                </p>
              </div>
              <a href="#programs" className={styles.pAll}>
                {t('home.viewAll')}
                <ArrowIcon />
              </a>
            </div>
            <ul className={styles.pGrid}>
              {programs.map((p, i) => (
                <li key={p.id}>
                  <Link to={`/donate?program_id=${p.id}`} className={styles.pItem}>
                    <span className={`ds-num ${styles.pNo}`} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.pName}>{getTitle(p)}</span>
                    <span className={styles.pGo} aria-hidden="true"><ArrowIcon /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= Banners (admin-managed), swipeable, no autoplay ================= */}
      {banners.length > 0 && (
        <section className={styles.banners} aria-label={t('home.bannersLabel')}>
          <div className={`ds-wrap ${styles.bannerRow}`}>
            {banners.map((banner, i) => (
              <img
                key={banner.id}
                src={resolveImageUrl(banner.image_url || banner.image)}
                alt={t('home.bannerSlide', { number: i + 1 })}
                loading="lazy"
                className={styles.banner}
              />
            ))}
          </div>
        </section>
      )}

      {/* ================= Initiatives ================= */}
      <section className={`${styles.section} ${styles.surface}`} id="campaigns" aria-labelledby="campaigns-heading">
        <div className="ds-wrap">
          <SectionHead
            id="campaigns-heading"
            title={t('home.campaignsSectionTitle')}
            action={campaigns.length > 0 && (
              <Link to="/campaigns" className={styles.headLink}>
                {t('home.viewAll')} <span className="ds-num">({campaigns.length})</span>
                <ArrowIcon />
              </Link>
            )}
          />
          {loadingCampaigns ? (
            <div className={styles.campaignGrid} aria-busy="true">
              <div className={`${styles.skeleton} ${styles.skeletonFeature}`} />
              {[0, 1, 2].map((i) => <div key={i} className={styles.skeleton} />)}
              <span className={styles.srOnly}>{t('common.loading')}</span>
            </div>
          ) : campaigns.length === 0 ? (
            <p className={styles.empty}>{t('campaigns.noCampaigns')}</p>
          ) : (
            <div className={styles.campaignGrid}>
              {featured.map((item, i) => {
                const raised = Number(item.raised_amount) || 0
                const goal = Number(item.goal_amount) || 0
                const image = item.image_url || item.image
                return (
                  <div key={item.id} className={i === 0 ? styles.featureCell : undefined}>
                    <CampaignCard
                      index={i}
                      feature={i === 0}
                      percent={getCampaignProgressPercent(raised, goal > 0 ? goal : 1)}
                      title={getTitle(item)}
                      description={getDesc(item)}
                      imageUrl={image ? resolveImageUrl(image) : undefined}
                      tag={tagFor(item)}
                      raisedLabel={t('campaigns.raised')}
                      goalLabel={t('campaigns.goal')}
                      raisedText={`${formatAmount(raised)} ${currency}`}
                      goalText={`${formatAmount(goal)} ${currency}`}
                      donateLabel={t('campaigns.donate')}
                      donateTo={`/donate?campaign_id=${item.id}`}
                      percentSign={percentSign}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= Support programs: the logo's staircase, one step per program ================= */}
      {programs.length > 0 && (
        <section className={styles.section} id="programs" aria-labelledby="programs-heading">
          <div className="ds-wrap">
            <SectionHead id="programs-heading" title={t('home.programsTitle')} subtitle={t('home.programsSubtitle')} />
            <ol className={styles.stairs}>
              {programs.map((p, i) => (
                <li key={p.id} style={{ '--n': i } as CSSProperties}>
                  <Link to={`/donate?program_id=${p.id}`} className={styles.stair}>
                    <span className={styles.stairTitle}>{getTitle(p)}</span>
                    {getDesc(p) && <span className={styles.stairDesc}>{getDesc(p)}</span>}
                    <span className={styles.stairGo}>
                      {t('home.programDonate')}
                      <ArrowIcon />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ================= Students: apply along the logo's pen line + why it is safe to give ================= */}
      <section className={`${styles.section} ${styles.surface}`} aria-labelledby="apply-heading">
        <div className="ds-wrap">
          <div className={styles.apply}>
            <div className={styles.applyText}>
              <span className="ds-eyebrow">{t('home.regCardTag')}</span>
              <h2 id="apply-heading" className={styles.applyTitle}>{cardHeadline}</h2>
              <p className={styles.applySub}>{cardSubtitle}</p>
              <Link to="/student-registration" className={`ds-btn ds-btn-filled ds-btn-lg ${statusClass}`}>
                {statusLabel}
                <ArrowIcon />
              </Link>
            </div>
            <ol className={styles.timeline}>
              {[1, 2, 3].map((n) => (
                <li key={n}>
                  <span className={styles.dot} aria-hidden="true" />
                  <h3>{t(`home.applyStep${n}`)}</h3>
                  <p>{t(`home.applyStep${n}Body`)}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.trust}>
            <h2 className={styles.trustTitle}>{t('home.trustTitle')}</h2>
            <ul className={styles.trustList}>
              {(['legalStatus1', 'legalStatus3', 'legalStatus5'] as const).map((key) => (
                <li key={key}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <span>{t(`about.${key}`)}</span>
                </li>
              ))}
            </ul>
            <Link to="/about" className={styles.headLink}>
              {t('home.trustMore')}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= News (only when there is some) ================= */}
      {newsList.length > 0 && (
        <section className={styles.section} id="news" aria-labelledby="news-heading">
          <div className="ds-wrap">
            <SectionHead
              id="news-heading"
              title={t('nav.news')}
              action={<Link to="/news" className={styles.headLink}>{t('home.viewAll')}<ArrowIcon /></Link>}
            />
            <div className={styles.newsGrid}>
              {newsList.slice(0, 3).map((item) => {
                const title = (item[(lang === 'ar' ? 'title_ar' : 'title_en') as keyof FundNews] as string) || `#${item.id}`
                const plain = stripHtml((item[(lang === 'ar' ? 'content_ar' : 'content_en') as keyof FundNews] as string) || '')
                const image = resolveImageUrl(item.image_url ?? item.image)
                return (
                  <article key={item.id} className={styles.news}>
                    {image && <img src={image} alt="" loading="lazy" className={styles.newsImg} />}
                    {item.published_at && (
                      <time dateTime={item.published_at} className={styles.newsDate}>{formatNewsDate(item.published_at, lang)}</time>
                    )}
                    <h3 className={styles.newsTitle}>{title}</h3>
                    {plain && <p className={styles.newsExcerpt}>{plain.slice(0, 140)}{plain.length > 140 ? '…' : ''}</p>}
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= Partners (only when there are some) ================= */}
      {partnersList.length > 0 && (
        <section className={`${styles.section} ${styles.surface}`} id="partners" aria-labelledby="partners-heading">
          <div className="ds-wrap">
            <SectionHead
              id="partners-heading"
              title={t('nav.partners')}
              action={<Link to="/partners" className={styles.headLink}>{t('home.viewAll')}<ArrowIcon /></Link>}
            />
            <ul className={styles.partnerRow}>
              {partnersList.map((p) => {
                const name = (lang === 'ar' ? p.name_ar : p.name_en) || p.name_ar || p.name_en || ''
                const logo = resolveImageUrl(p.logo_url ?? p.logo)
                const inner = logo ? <img src={logo} alt={name} loading="lazy" /> : <span>{name}</span>
                return (
                  <li key={p.id}>
                    {p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer">{inner}</a> : inner}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}
    </PageLayout>
  )
}
