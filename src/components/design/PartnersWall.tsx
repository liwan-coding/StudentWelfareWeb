import type { CSSProperties, ReactNode } from 'react'
import { useInViewOnce } from './useInViewOnce'
import styles from './PartnersWall.module.css'

export interface WallPartner {
  key: string
  name: string
  logoUrl: string
  link?: string
}

interface PartnersWallProps {
  partners: WallPartner[]
  /** heading placed above the wall */
  children: ReactNode
}

/** Partners as a calm wall of logo tiles that fade in once. */
export function PartnersWall({ partners, children }: PartnersWallProps) {
  const [ref, shown] = useInViewOnce<HTMLDivElement>(0.15)

  return (
    <div ref={ref} className={`${styles.wall} ${shown ? styles.in : ''}`}>
      <div className={styles.head}>{children}</div>
      <ul className={styles.grid}>
        {partners.map((p, i) => {
          const inner = p.logoUrl ? (
            <img src={p.logoUrl} alt={p.name} className={styles.logo} loading="lazy" />
          ) : (
            <span className={styles.name}>{p.name}</span>
          )
          return (
            <li key={p.key} className={styles.item} style={{ '--i': Math.min(i, 10) } as CSSProperties}>
              {p.link ? (
                <a href={p.link} target="_blank" rel="noopener noreferrer" className={styles.tile} title={p.name}>
                  {inner}
                </a>
              ) : (
                <div className={styles.tile} title={p.name}>
                  {inner}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
