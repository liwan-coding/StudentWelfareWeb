import { useTranslation } from 'react-i18next'
import { getCampaignProgressPercent } from './progress'
import styles from './CampaignAmountGoal.module.css'

function formatAmount(amount?: number): string {
  return (amount != null ? Number(amount) : 0).toLocaleString('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export interface CampaignAmountGoalProps {
  raisedAmount?: number
  goalAmount?: number
  progressPercent?: number
  className?: string
  progressSize?: 'sm' | 'md'
}

export function CampaignAmountGoal({
  raisedAmount,
  goalAmount,
  progressPercent,
  className = '',
  progressSize = 'sm',
}: CampaignAmountGoalProps) {
  const { t } = useTranslation('common')
  const raised = Number(raisedAmount) || 0
  const goal = Number(goalAmount) || 0
  const percent =
    progressPercent ?? getCampaignProgressPercent(raised, goal > 0 ? goal : 1)
  const currency = t('donate.currencyShort')

  return (
    <div className={`${styles.wrap} ${className}`.trim()}>
      <div
        className={`${styles.progress} ${progressSize === 'md' ? styles.progressMd : ''}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('campaigns.raised')}
      >
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
      <dl className={styles.row}>
        <div className={styles.col}>
          <dt className={styles.label}>{t('campaigns.raised')}</dt>
          <dd className={`${styles.amount} ${styles.amountRaised}`}>
            {formatAmount(raised)} <span className={styles.unit}>{currency}</span>
          </dd>
        </div>
        <div className={`${styles.col} ${styles.colEnd}`}>
          <dt className={styles.label}>{t('campaigns.goal')}</dt>
          <dd className={`${styles.amount} ${styles.amountGoal}`}>
            {formatAmount(goal)} <span className={styles.unit}>{currency}</span>
          </dd>
        </div>
      </dl>
    </div>
  )
}
