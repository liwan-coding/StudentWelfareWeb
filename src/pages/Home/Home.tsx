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

/** Editorial section head: an ink rule, a running number, the title and an optional link. */
function SectionHead({ index, id, title, subtitle, action }: {
  index: string
  id: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className={styles.head}>
      <span className={`ds-num ${styles.headIndex}`} aria-hidden="true">{index}</span>
      <div className={styles.headText}>
        <h2 id={id} className="ds-title-1">{title}</h2>
        {subtitle && <p className="ds-subhead">{subtitle}</p>}
      </div>
      {action && <div className={styles.headAction}>{action}</div>}
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
  const locale = lang === 'ar' ? 'ar-OM' : 'en-GB'
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

  // ===== the climb: live totals for the hero staircase =====
  const totalRaised = campaigns.reduce((s, c) => s + (Number(c.raised_amount) || 0), 0)
  const totalGoal = campaigns.reduce((s, c) => s + (Number(c.goal_amount) || 0), 0)
  const overallPct = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0
  const compact = new Intl.NumberFormat(`${locale}-u-nu-latn`, { notation: 'compact', maximumFractionDigits: 1 })
  const percentSign = lang === 'ar' ? '٪' : '%'
  const currency = t('donate.currencyShort')
  const statsReady = !loadingCampaigns && !loadingPrograms
  const climb = [
    { value: String(programs.length), label: t('home.statPrograms') },
    { value: String(campaigns.length), label: t('home.statInitiatives') },
    { value: `${overallPct}${percentSign}`, label: t('home.statGoal') },
    { value: compact.format(totalRaised), label: t('home.statRaised') },
  ]

  const featured = campaigns.slice(0, HOME_CAMPAIGNS)
  const tagFor = (c: CampaignOrProgram) => (c.is_urgent ? t('campaigns.urgent') : c.category ? (lang === 'ar' ? c.category.name_ar : c.category.name_en) || undefined : undefined)

  // running section numbers only count sections that are shown
  let sectionNo = 0
  const nextIndex = () => String(++sectionNo).padStart(2, '0')

  return (
    <PageLayout noPadding design>
      {/* ================= Hero: the logo, drawn with live numbers ================= */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`ds-wrap ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <span className="ds-eyebrow">{t('app.tagline')}</span>
            <h1 id="hero-title" className={styles.heroTitle}>
              {t('home.heroLead')}{' '}
              <span className="ds-mark">{t('home.heroMark')}</span>{' '}
              {t('home.heroTail')}
            </h1>
            <p className={styles.heroBody}>{t('home.heroBody')}</p>
            <div className={styles.heroCtas}>
              <a href="#campaigns" className="ds-btn ds-btn-filled ds-btn-lg">
                {t('home.ctaDonate')}
                <ArrowIcon />
              </a>
              <Link to="/student-registration" className="ds-btn ds-btn-outline ds-btn-lg">
                {t('home.ctaApply')}
              </Link>
            </div>
          </div>

          <figure className={styles.climb} aria-labelledby="climb-caption">
            <span className={styles.climbSky} aria-hidden="true" />
            <figcaption id="climb-caption" className={styles.climbCaption}>
              <span className={styles.nib} aria-hidden="true" />
              {t('home.climbLabel')}
            </figcaption>
            <ol className={styles.steps}>
              {climb.map((s, i) => (
                <li key={s.label} className={styles.step} style={{ '--n': i } as CSSProperties}>
                  <b className="ds-num">{statsReady ? s.value : '—'}</b>
                  <span>{s.label}</span>
                </li>
              ))}
            </ol>
          </figure>
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
      <section className={styles.section} id="campaigns" aria-labelledby="campaigns-heading">
        <div className="ds-wrap">
          <SectionHead
            index={nextIndex()}
            id="campaigns-heading"
            title={t('home.campaignsSectionTitle')}
            subtitle={t('campaigns.subtitle')}
            action={campaigns.length > 0 && (
              <Link to="/campaigns" className="ds-btn ds-btn-plain">
                {t('home.viewAll')} <span className="ds-num">({campaigns.length})</span>
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

      {/* ================= Support programs: an index on ink ================= */}
      {programs.length > 0 && (
        <section className={`ds-dark ${styles.section} ${styles.programs}`} aria-labelledby="programs-heading">
          <div className="ds-wrap">
            <SectionHead
              index={nextIndex()}
              id="programs-heading"
              title={t('home.programsTitle')}
              subtitle={t('home.programsSubtitle')}
            />
            <ol className={styles.programList}>
              {programs.map((p, i) => (
                <li key={p.id}>
                  <Link to={`/donate?program_id=${p.id}`} className={styles.program}>
                    <span className={`ds-num ${styles.programNo}`} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.programText}>
                      <span className={styles.programTitle}>{getTitle(p)}</span>
                      {getDesc(p) && <span className={styles.programDesc}>{getDesc(p)}</span>}
                    </span>
                    <span className={styles.programGo}>
                      <span className={styles.programGoLabel}>{t('home.programDonate')}</span>
                      <ArrowIcon />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ================= Students: apply, in three steps ================= */}
      <section className={`${styles.section} ${styles.apply}`} aria-labelledby="apply-heading">
        <span className={styles.applyCorner} aria-hidden="true" />
        <div className={`ds-wrap ${styles.applyInner}`}>
          <div className={styles.applyText}>
            <span className={`ds-eyebrow ${styles.applyEyebrow}`}>{t('home.regCardTag')}</span>
            <h2 id="apply-heading" className={styles.applyTitle}>{cardHeadline}</h2>
            <p className={styles.applySub}>{cardSubtitle}</p>
            <Link to="/student-registration" className={`ds-btn ds-btn-light ds-btn-lg ${styles.applyBtn} ${statusClass}`}>
              {statusLabel}
              <ArrowIcon />
            </Link>
          </div>
          <ol className={styles.applySteps}>
            {[1, 2, 3].map((n) => (
              <li key={n} style={{ '--n': n - 1 } as CSSProperties}>
                <span className={`ds-num ${styles.applyNo}`} aria-hidden="true">{n}</span>
                <h3>{t(`home.applyStep${n}`)}</h3>
                <p>{t(`home.applyStep${n}Body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= News (only when there is some) ================= */}
      {newsList.length > 0 && (
        <section className={styles.section} id="news" aria-labelledby="news-heading">
          <div className="ds-wrap">
            <SectionHead
              index={nextIndex()}
              id="news-heading"
              title={t('nav.news')}
              subtitle={t('news.subtitle')}
              action={<Link to="/news" className="ds-btn ds-btn-plain">{t('home.viewAll')}</Link>}
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
        <section className={`${styles.section} ${styles.partners}`} id="partners" aria-labelledby="partners-heading">
          <div className="ds-wrap">
            <SectionHead
              index={nextIndex()}
              id="partners-heading"
              title={t('nav.partners')}
              subtitle={t('partners.subtitle')}
              action={<Link to="/partners" className="ds-btn ds-btn-plain">{t('home.viewAll')}</Link>}
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
