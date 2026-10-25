import { Children, type CSSProperties, type ReactNode } from 'react'
import { useInViewOnce } from './useInViewOnce'
import styles from './Train.module.css'

interface TrainProps {
  /** layout of the grid (columns, gap) from the page's CSS module */
  className?: string
  children: ReactNode
  /** extra class for every item wrapper (e.g. to stretch a card) */
  carClassName?: string
}

/**
 * Grid entrance: items fade up in a short stagger the first time the grid comes into view.
 * Each child becomes one item.
 */
export function Train({ className = '', children, carClassName = '' }: TrainProps) {
  const [ref, shown] = useInViewOnce<HTMLDivElement>(0.1)
  const items = Children.toArray(children)

  return (
    <div ref={ref} className={`${styles.grid} ${shown ? styles.in : ''} ${className}`.trim()}>
      {items.map((item, i) => (
        <div key={i} className={`${styles.item} ${carClassName}`.trim()} style={{ '--ti': Math.min(i, 8) } as CSSProperties}>
          {item}
        </div>
      ))}
    </div>
  )
}
