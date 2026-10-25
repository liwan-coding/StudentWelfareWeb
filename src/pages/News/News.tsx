import { useEffect, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { fundNewsService } from '../../services/fundNewsService'
import { resolveImageUrl } from '../../config/api'
import type { FundNews } from '../../types/api'
import { PageHero } from '../../components/design/PageHero'
import { Train } from '../../components/design/Train'
import { FeatBadge } from '../../components/design/FeatBadge'
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

/** placeholder colours when a news item has no picture */
const COVERS = [
  'linear-gradient(150deg,#A2458C,#D47EC0)',
  'linear-gradient(150deg,#32A1BF,#7FD0E6)',
  'linear-gradient(150deg,#7E2F6C,#32A1BF)',
]

export function News() {
  const { t, i18n } = useTranslation('common')
  const [list, setList] = useState<FundNews[]>([])
  const [loading, setLoading] = useState(true)

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
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <PageLayout noPadding design>
      <div className={styles.page}>
        <PageHero title={t('nav.news')} subtitle={t('news.subtitle')} />

        <div className={`ds-wrap ${styles.main}`}>
          {loading ? (
            <div className={styles.grid} aria-busy="true" aria-label={t('common.loading')}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`ds-card ${styles.skeletonCard}`}>
                  <div className={styles.skeletonImage} />
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLine} style={{ width: '80%' }} />
                    <div className={styles.skeletonLine} style={{ width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className={`ds-card ${styles.empty}`} role="status">
              <div className={styles.emptyIcon} aria-hidden>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>{t('news.noNews')}</h2>
              <p className={styles.emptyDescription}>{t('news.noNewsDescription')}</p>
            </div>
          ) : (
            <Train className={styles.grid}>
              {list.map((item, i) => {
                const title = (item[titleKey as keyof FundNews] as string) || `#${item.id}`
                const content = (item[contentKey as keyof FundNews] as string) || ''
                const dateStr = formatNewsDate(item.published_at, lang)
                const image = item.image_url || item.image

                return (
                  <article key={item.id} className={`ds-card ${styles.card}`} style={{ '--ring-delay': `${-(i % 3) * 2.3}s` } as CSSProperties}>
                    <div className={styles.imageWrap} style={{ '--cv': COVERS[i % COVERS.length] } as CSSProperties}>
                      {image && (
                        <div className={styles.image} style={{ backgroundImage: `url(${resolveImageUrl(image)})` }} />
                      )}
                      {item.is_featured && <FeatBadge label={t('news.featured')} sparks className={styles.featuredBadge} />}
                    </div>
                    <div className={styles.cardContent}>
                      {dateStr && (
                        <time className={styles.date} dateTime={item.published_at}>
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="16" rx="3" />
                            <path d="M8 3v4M16 3v4M3 10h18" />
                          </svg>
                          {dateStr}
                        </time>
                      )}
                      <h2 className={styles.itemTitle}>{title}</h2>
                      <div
                        className={styles.content}
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
      </div>
    </PageLayout>
  )
}
