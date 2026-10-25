import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { fundPartnerService } from '../../services/fundPartnerService'
import { resolveImageUrl } from '../../config/api'
import type { FundPartner } from '../../types/api'
import { PageHero } from '../../components/design/PageHero'
import { Train } from '../../components/design/Train'
import { FeatBadge } from '../../components/design/FeatBadge'
import { LoadError } from '../../components/design/LoadError'
import styles from './Partners.module.css'

function getDisplayUrl(link: string | undefined): string {
  if (!link) return ''
  try {
    const url = new URL(link)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

export function Partners() {
  const { t, i18n } = useTranslation('common')
  const [list, setList] = useState<FundPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const lang = i18n.language === 'ar' ? 'ar' : 'en'
  const nameKey = lang === 'ar' ? 'name_ar' : 'name_en'
  const descKey = lang === 'ar' ? 'description_ar' : 'description_en'

  useEffect(() => {
    let cancelled = false
    fundPartnerService
      .getList()
      .then((data) => {
        if (!cancelled) {
          const sorted = [...data].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
          setList(sorted)
        }
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

  return (
    <PageLayout noPadding design>
      <div className={styles.page}>
        <PageHero title={t('nav.partners')} subtitle={t('partners.subtitle')} />

        <section className={styles.content}>
          <div className="ds-wrap">
            {loading ? (
              <div className={styles.grid} aria-busy="true" aria-label={t('common.loading')}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={`ds-card ${styles.skeletonCard}`} aria-hidden="true">
                    <div className={styles.skeletonLogo} />
                    <div className={styles.skeletonMeta}>
                      <div className={styles.skeletonLine} style={{ width: '55%' }} />
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLine} style={{ width: '35%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : failed ? (
              <LoadError onRetry={retry} />
            ) : list.length === 0 ? (
              <div className={styles.empty} role="status">
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 20v-.5A5.5 5.5 0 0 1 8 14h2a5.5 5.5 0 0 1 5.5 5.5v.5" />
                  <path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a5.5 5.5 0 0 1 3.5 5.3v.5" />
                </svg>
                <h2 className={styles.emptyTitle}>{t('partners.noPartners')}</h2>
                <p className={styles.emptyDescription}>{t('partners.noPartnersDescription')}</p>
              </div>
            ) : (
              <Train className={styles.grid}>
                {list.map((item) => {
                  const name = (item[nameKey as keyof FundPartner] as string) || `#${item.id}`
                  const desc = (item[descKey as keyof FundPartner] as string) || ''
                  const logoUrl = item.logo_url || item.logo
                  const link = item.link
                  const displayUrl = getDisplayUrl(link)
                  const className = `ds-card ${styles.tile} ${link ? styles.linked : ''}`.trim()

                  const content = (
                    <>
                      {/* the logo always sits on white so real logos stay legible in dark mode */}
                      <span className={styles.logoWrap}>
                        {logoUrl ? (
                          <img
                            src={resolveImageUrl(logoUrl)}
                            alt=""
                            className={styles.logo}
                            loading="lazy"
                          />
                        ) : (
                          <span className={styles.initial} aria-hidden>
                            {name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {item.is_featured && (
                          <FeatBadge label={t('partners.featured')} small className={styles.badge} />
                        )}
                      </span>
                      <span className={styles.body}>
                        <h2 className={styles.name}>{name}</h2>
                        {displayUrl && (
                          <span className={styles.url} aria-hidden>{displayUrl}</span>
                        )}
                        {desc && <p className={styles.desc}>{desc}</p>}
                        {link && (
                          <span className={styles.visit}>
                            <span>{t('partners.visitWebsite')}</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M17 7 7 17M8 7h9v9" />
                            </svg>
                          </span>
                        )}
                      </span>
                    </>
                  )

                  if (link) {
                    return (
                      <a key={item.id} href={link} target="_blank" rel="noopener noreferrer" className={className}>
                        {content}
                      </a>
                    )
                  }

                  return (
                    <div key={item.id} className={className}>
                      {content}
                    </div>
                  )
                })}
              </Train>
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
