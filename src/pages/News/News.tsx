import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { fundNewsService } from '../../services/fundNewsService'
import { resolveImageUrl } from '../../config/api'
import type { FundNews } from '../../types/api'
import { PageHero } from '../../components/design/PageHero'
import { Train } from '../../components/design/Train'
import { LoadError } from '../../components/design/LoadError'
import styles from './News.module.css'

function formatNewsDate(isoDate: string | undefined, locale: string): string {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-GB', {
      dateStyle: 'medium',
    }).format(d)
  } catch {
    return ''
  }
}

/** Strip HTML tags for optional use (e.g. meta or aria). */
function stripHtml(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim()
}

export function News() {
  const { t, i18n } = useTranslation('common')
  const [list, setList] = useState<FundNews[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const lang = i18n.language === 'ar' ? 'ar' : 'en'
  const titleKey = lang === 'ar' ? 'title_ar' : 'title_en'
  const contentKey = lang === 'ar' ? 'content_ar' : 'content_en'

  useEffect(() => {
    let cancelled = false
    fundNewsService
      .getList()
      .then((data) => {
        if (!cancelled) setList(data)
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
        <PageHero title={t('nav.news')} subtitle={t('news.subtitle')} />

        <section className={styles.content}>
          <div className="ds-wrap">
            {loading ? (
              <div className={styles.grid} aria-busy="true" aria-label={t('common.loading')}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={`ds-card ${styles.skeletonCard}`} aria-hidden="true">
                    <div className={styles.skeletonImage} />
                    <div className={styles.skeletonContent}>
                      <div className={styles.skeletonLine} style={{ width: '35%' }} />
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLine} style={{ width: '75%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : failed ? (
              <LoadError onRetry={retry} />
            ) : list.length === 0 ? (
              <div className={styles.empty} role="status">
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.5 20H5a2 2 0 0 1-2-2V5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5V18a2 2 0 0 0 2 2 2 2 0 0 0 2-2V8.5A1.5 1.5 0 0 0 19.5 7H17" />
                  <path d="M6.5 8h7M6.5 12h7M6.5 16h4" />
                </svg>
                <h2 className={styles.emptyTitle}>{t('news.noNews')}</h2>
                <p className={styles.emptyDescription}>{t('news.noNewsDescription')}</p>
              </div>
            ) : (
              <Train className={styles.grid}>
                {list.map((item) => {
                  const title = (item[titleKey as keyof FundNews] as string) || `#${item.id}`
                  const content = (item[contentKey as keyof FundNews] as string) || ''
                  const dateStr = formatNewsDate(item.published_at, lang)
                  const image = item.image_url || item.image

                  return (
                    <article key={item.id} className={`ds-card ${styles.card} ${item.is_featured ? styles.featured : ''}`.trim()}>
                      <div className={styles.media}>
                        {image ? (
                          <img src={resolveImageUrl(image)} alt="" className={styles.image} loading="lazy" />
                        ) : (
                          <svg className={styles.placeholder} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="16" rx="2.5" />
                            <circle cx="8.5" cy="9.5" r="1.5" />
                            <path d="m21 15-4.5-4.5L7 20" />
                          </svg>
                        )}
                      </div>
                      <div className={styles.body}>
                        {(item.is_featured || dateStr) && (
                          <p className={styles.caption}>
                            {item.is_featured && <span className={styles.featuredLabel}>{t('news.featured')}</span>}
                            {dateStr && <time dateTime={item.published_at}>{dateStr}</time>}
                          </p>
                        )}
                        <h2 className={styles.title}>{title}</h2>
                        <div
                          className={styles.excerpt}
                          dangerouslySetInnerHTML={{ __html: content }}
                          aria-label={stripHtml(content).slice(0, 120)}
                        />
                      </div>
                    </article>
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
