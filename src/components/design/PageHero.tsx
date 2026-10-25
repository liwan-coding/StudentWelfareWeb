import { Backdrop } from './Backdrop'
import styles from './PageHero.module.css'

interface PageHeroProps {
  title: string
  subtitle?: string
  id?: string
  /** small tinted line above the title */
  eyebrow?: string
}

/** Inner-page header: aurora light behind a centred gradient large title and a quiet subtitle. */
export function PageHero({ title, subtitle, id, eyebrow }: PageHeroProps) {
  return (
    <header className={styles.ph}>
      <Backdrop className={styles.aurora} />
      <div className={`ds-wrap ${styles.inner}`}>
        {eyebrow && <span className={`ds-eyebrow ${styles.eyebrow}`}>{eyebrow}</span>}
        <h1 id={id} className={`ds-large-title ds-gradient-text ${styles.title}`}>{title}</h1>
        {subtitle && <p className={`ds-subhead ${styles.sub}`}>{subtitle}</p>}
      </div>
    </header>
  )
}
