import { useEffect, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { fundPartnerService } from '../../services/fundPartnerService'
import { resolveImageUrl } from '../../config/api'
import type { FundPartner } from '../../types/api'
import { PageHero } from '../../components/design/PageHero'
import { Train } from '../../components/design/Train'
import { FeatBadge } from '../../components/design/FeatBadge'
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
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <PageLayout noPadding design>
      <div className={styles.page}>
        <PageHero title={t('nav.partners')} subtitle={t('partners.subtitle')} />

        <div className={`ds-wrap ${styles.main}`}>
          {loading ? (
            <div className={styles.grid} aria-busy="true" aria-label={t('common.loading')}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`ds-card ${styles.skeletonCard}`}>
                  <div className={styles.skeletonLogo} />
                  <div className={styles.skeletonMeta}>
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLine} style={{ width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className={`ds-card ${styles.empty}`} role="status">
              <div className={styles.emptyIcon} aria-hidden>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>{t('partners.noPartners')}</h2>
              <p className={styles.emptyDescription}>{t('partners.noPartnersDescription')}</p>
            </div>
          ) : (
            <Train className={styles.grid}>
              {list.map((item, i) => {
                const name = (item[nameKey as keyof FundPartner] as string) || `#${item.id}`
                const desc = (item[descKey as keyof FundPartner] as string) || ''
                const logoUrl = item.logo_url || item.logo
                const link = item.link
                const displayUrl = getDisplayUrl(link)
                const className = `ds-card ${styles.tile} ${item.is_featured ? styles.featured : ''}`.trim()
                const style = { '--ring-delay': `${-(i % 3) * 2.3}s` } as CSSProperties

                const content = (
                  <>
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
                    </span>
                    {item.is_featured && <FeatBadge label={t('partners.featured')} small />}
                    <h2 className={styles.name}>{name}</h2>
                    {desc && <p className={styles.desc}>{desc}</p>}
                    {link && (
                      <span className={styles.visit}>
                        <span>{t('partners.visitWebsite')}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 7 7 17M8 7h9v9" />
                        </svg>
                      </span>
                    )}
                    {displayUrl && (
                      <span className={styles.url} aria-hidden>{displayUrl}</span>
                    )}
                  </>
                )

                if (link) {
                  return (
                    <a key={item.id} href={link} target="_blank" rel="noopener noreferrer" className={className} style={style}>
                      {content}
                    </a>
                  )
                }

                return (
                  <div key={item.id} className={className} style={style}>
                    {content}
                  </div>
                )
              })}
            </Train>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
