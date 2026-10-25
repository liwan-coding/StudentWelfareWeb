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
          ) : campaigns.length === 0 ? (
            <div className={`ds-card ${styles.empty}`} role="status">
              <div className={styles.emptyIcon} aria-hidden>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
              </div>
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
      </div>
    </PageLayout>
  )
}
