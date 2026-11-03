import styles from './PageHero.module.css'

interface PageHeroProps {
  title: string
  subtitle?: string
  id?: string
  /** small line above the title */
  eyebrow?: string
}

/** Inner-page header: start-aligned title and subtitle beside a small copy of the logo's staircase. */
export function PageHero({ title, subtitle, id, eyebrow }: PageHeroProps) {
  return (
    <header className={styles.ph}>
      <div className={`ds-wrap ${styles.inner}`}>
        <div className={styles.text}>
          {eyebrow && <span className="ds-eyebrow">{eyebrow}</span>}
          <h1 id={id} className={`ds-large-title ${styles.title}`}>{title}</h1>
          {subtitle && <p className={`ds-subhead ${styles.sub}`}>{subtitle}</p>}
        </div>
        <span className={styles.mark} aria-hidden="true">
          <i /><i /><i /><i />
        </span>
      </div>
    </header>
  )
}
