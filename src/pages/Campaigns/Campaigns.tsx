import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { campaignService } from '../../services/campaignService'
import type { CampaignOrProgram } from '../../types/api'
import { getCampaignProgressPercent } from '../../components/CampaignAmountGoal'
import { PageHero } from '../../components/design/PageHero'
import { CampaignCard } from '../../components/design/CampaignCard'
import { Train } from '../../components/design/Train'
import styles from './Campaigns.module.css'

/** Same number format as CampaignAmountGoal */
function formatAmount(amount?: number): string {
  return (amount != null ? Number(amount) : 0).toLocaleString('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function Campaigns() {
  const { t, i18n } = useTranslation('common')
  const [campaigns, setCampaigns] = useState<CampaignOrProgram[]>([])
  const [loading, setLoading] = useState(true)

  const lang = i18n.language === 'ar' ? 'ar' : 'en'
  const titleKey = lang === 'ar' ? 'title_ar' : 'title_en'
  const getTitle = (item: CampaignOrProgram) =>
    (item[titleKey as keyof CampaignOrProgram] as string) || item.title || `#${item.id}`

  useEffect(() => {
    let cancelled = false
    campaignService
      .getCampaigns()
      .then((list) => {
        if (!cancelled) setCampaigns(list)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const currency = t('donate.currencyShort')
  const percentSign = lang === 'ar' ? '٪' : '%'

  return (
    <PageLayout noPadding design>
      <div className={styles.page}>
        <PageHero title={t('campaigns.title')} subtitle={t('campaigns.subtitle')} />

        <section className={styles.content}>
          <div className="ds-wrap">
            {loading ? (
              <div className={styles.grid} aria-busy="true" aria-label={t('common.loading')}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={`ds-card ${styles.skeletonCard}`} aria-hidden="true">
                    <div className={styles.skeletonRing} />
                    <div className={styles.skeletonLine} style={{ width: '70%' }} />
                    <div className={styles.skeletonBlock} />
                    <div className={styles.skeletonButton} />
                  </div>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className={styles.empty} role="status">
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
                  <path d="m3 6.5 9 6.5 9-6.5" />
                </svg>
                <h2 className={styles.emptyTitle}>{t('campaigns.noCampaigns')}</h2>
                <p className={styles.emptyDescription}>{t('campaigns.noCampaignsDescription')}</p>
              </div>
            ) : (
              <Train className={styles.grid}>
                {campaigns.map((item, i) => {
                  const raised = Number(item.raised_amount) || 0
                  const goal = Number(item.goal_amount) || 0
                  return (
                    <CampaignCard
                      key={item.id}
                      index={i}
                      reveal={false}
                      percent={getCampaignProgressPercent(raised, goal > 0 ? goal : 1)}
                      title={getTitle(item)}
                      raisedLabel={t('campaigns.raised')}
                      goalLabel={t('campaigns.goal')}
                      raisedText={`${formatAmount(raised)} ${currency}`}
                      goalText={`${formatAmount(goal)} ${currency}`}
                      donateLabel={t('campaigns.donate')}
                      donateTo={`/donate?campaign_id=${item.id}`}
                      percentSign={percentSign}
                    />
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
