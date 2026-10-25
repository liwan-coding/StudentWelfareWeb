import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuth } from '../../context/AuthContext'
import { donationService } from '../../services/donationService'
import { campaignService } from '../../services/campaignService'
import type { CampaignOrProgram, RecentDonation } from '../../types/api'
import { LoadError } from '../../components/design/LoadError'
import styles from './MyDonations.module.css'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return undefined
}

function formatDate(iso?: string, locale: string = 'ar'): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString(locale.startsWith('ar') ? 'ar-OM' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatAmount(amount?: number): string {
  if (amount == null) return '0'
  return Number(amount).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function pickTitle(obj: Record<string, unknown> | undefined, lang: string): string | undefined {
  if (!obj) return undefined
  const ar = typeof obj.title_ar === 'string' ? obj.title_ar : undefined
  const en = typeof obj.title_en === 'string' ? obj.title_en : undefined
  const title = typeof obj.title === 'string' ? obj.title : typeof obj.name === 'string' ? obj.name : undefined
  return ((lang === 'ar' ? ar || title || en : en || title || ar) || '').trim() || undefined
}

function getTargetTitle(
  donation: RecentDonation,
  lang: string,
  campaigns: CampaignOrProgram[],
  programs: CampaignOrProgram[],
): string | undefined {
  const nested =
    pickTitle(isRecord(donation.campaign) ? donation.campaign : undefined, lang) ||
    pickTitle(isRecord(donation.program) ? donation.program : undefined, lang) ||
    pickTitle(isRecord(donation.item) ? donation.item : undefined, lang) ||
    (typeof donation.campaign_title === 'string' ? donation.campaign_title : undefined) ||
    (typeof donation.program_title === 'string' ? donation.program_title : undefined)
  if (nested) return nested

  const campaignId = toNumber(donation.campaign_id)
  const programId = toNumber(donation.program_id)
  const item = campaignId != null
    ? campaigns.find((c) => c.id === campaignId)
    : programId != null
      ? programs.find((p) => p.id === programId)
      : undefined
  if (!item) return undefined
  return (lang === 'ar' ? item.title_ar || item.title || item.title_en : item.title_en || item.title || item.title_ar) || undefined
}

export function MyDonations() {
  const { t, i18n } = useTranslation('common')
  const [list, setList] = useState<RecentDonation[]>([])
  const [campaigns, setCampaigns] = useState<CampaignOrProgram[]>([])
  const [programs, setPrograms] = useState<CampaignOrProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      donationService.getMyDonations({ limit: 100 }),
      campaignService.getCampaigns({ limit: 100, per_page: 100 }).catch(() => [] as CampaignOrProgram[]),
      campaignService.getPrograms().catch(() => [] as CampaignOrProgram[]),
    ])
      .then(([data, campList, progList]) => {
        if (cancelled) return
        setList(data)
        setCampaigns(campList)
        setPrograms(progList)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [attempt])

  function retry() {
    setFailed(false)
    setLoading(true)
    setAttempt((n) => n + 1)
  }

  const total = list.reduce((sum, d) => sum + (Number((d as RecentDonation).amount) || 0), 0)
  const locale = i18n.language || 'ar'
  const lang = locale.startsWith('ar') ? 'ar' : 'en'
  const rows = list.map((d, i) => {
    const donation = d as RecentDonation
    return {
      key: donation.id ?? i,
      title: getTargetTitle(donation, lang, campaigns, programs) || '—',
      date: formatDate(donation.created_at, locale),
      amount: formatAmount(donation.amount),
    }
  })


  // ===== presentation only below: data, totals and rows above are unchanged =====
  const { user } = useAuth()
  const initial = ((user?.name || user?.phone || t('myDonations.title')) as string).trim().charAt(0)

  return (
    <PageLayout design>
      <div className={styles.page}>
        <header className={styles.head}>
          <span className={styles.avatar} aria-hidden="true">{initial}</span>
          <div className={styles.headText}>
            <h1>{t('myDonations.title')}</h1>
            <p>{t('myDonations.subtitle')}</p>
          </div>
        </header>

        <ul className={`ds-list ${styles.account}`}>
          <li>
            <span className={styles.rowLabel}>{t('auth.name')}</span>
            <span className={styles.rowValue}>{user?.name ?? '—'}</span>
          </li>
          <li>
            <span className={styles.rowLabel}>{t('auth.phone')}</span>
            <span className={styles.rowValue} dir="ltr">{user?.phone ?? '—'}</span>
          </li>
          <li>
            <span className={styles.rowLabel}>{t('auth.email')}</span>
            <span className={styles.rowValue}>{user?.email ?? '—'}</span>
          </li>
        </ul>

        {loading ? (
          <div className={styles.loadingWrap} aria-busy="true">
            <div className={styles.sum}>
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
            </div>
            <div className={`${styles.skeleton} ${styles.skeletonList}`} />
            <span className={styles.srOnly}>{t('common.loading')}</span>
          </div>
        ) : failed ? (
          <LoadError onRetry={retry} />
        ) : list.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <HeartIcon />
            </div>
            <h2>{t('myDonations.emptyTitle')}</h2>
            <p>{t('myDonations.emptyDescription')}</p>
            <Link to="/campaigns" className="ds-btn ds-btn-filled ds-btn-lg">
              {t('myDonations.ctaDonate')}
            </Link>
          </div>
        ) : (
          <>
            <section className={styles.sum} aria-labelledby="my-donations-summary">
              <div className={styles.stat}>
                <div className={styles.lbl} id="my-donations-summary">{t('myDonations.totalDonated')}</div>
                <div className={styles.val}>
                  <CountUp value={total} format={formatAmount} />
                  <small>{t('donate.currencyShort')}</small>
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.lbl}>{t('myDonations.donationCount')}</div>
                <div className={styles.val}><CountUp value={list.length} /></div>
              </div>
            </section>

            <section aria-labelledby="donations-list-title">
              <h2 id="donations-list-title" className={styles.listTitle}>{t('myDonations.donationsListTitle')}</h2>
              <div className={styles.table}>
                <div className={styles.thead} aria-hidden="true">
                  <span>{t('myDonations.campaign')}</span>
                  <span>{t('myDonations.donationDate')}</span>
                  <span className={styles.endCol}>{t('myDonations.amount')}</span>
                </div>
                <ul className={styles.dlist}>
                  {rows.map((row) => (
                    <li key={row.key} className={styles.drow}>
                      <span className={styles.dic} aria-hidden="true"><HeartIcon /></span>
                      <span className={styles.dt}>
                        <span className={styles.srOnly}>{t('myDonations.campaign')}: </span>
                        {row.title}
                      </span>
                      <span className={styles.dd}>
                        <span className={styles.srOnly}>{t('myDonations.donationDate')}: </span>
                        {row.date}
                      </span>
                      <span className={styles.da}>
                        <span className={styles.srOnly}>{t('myDonations.amount')}: </span>
                        {row.amount} <small>{t('donate.currencyShort')}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}
      </div>
    </PageLayout>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 8.6a5.5 5.5 0 0 0-7.8 0L12 9.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}

function formatCount(n: number): string {
  return String(Math.round(n))
}

/** Totals count up from 0 when they appear. */
function CountUp({ value, format = formatCount }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const t0 = performance.now()
    const dur = 1400
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      const v = value * (1 - Math.pow(1 - k, 3))
      el.textContent = k < 1 ? format(Number.isInteger(value) ? Math.round(v) : v) : format(value)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, format])
  return <span ref={ref}>{format(0)}</span>
}
