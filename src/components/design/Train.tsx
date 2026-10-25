import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import styles from './Train.module.css'

interface TrainProps {
  /** layout of the grid (columns, gap) from the page's CSS module */
  className?: string
  children: ReactNode
  /** extra class for every car wrapper (e.g. to stretch a card) */
  carClassName?: string
}

/**
 * The "train" entrance from design-reference/inner-pages.html: a glowing engine runs
 * along a rail under the grid and each card springs into place as the engine passes it.
 * Plays once, when the grid first comes into view. Each child becomes one car.
 */
export function Train({ className = '', children, carClassName = '' }: TrainProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [go, setGo] = useState(false)
  const cars = Children.toArray(children)
  const n = Math.max(1, cars.length)
  const duration = Math.min(0.55 * n + 0.3, 4.2)

  useEffect(() => {
    const el = ref.current
    if (!el || go) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setGo(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [go])

  const style = { '--n': n, '--D': `${duration}s` } as CSSProperties

  return (
    <div ref={ref} className={`${styles.train} ${go ? styles.go : styles.armed} ${className}`.trim()} style={style}>
      {cars.map((car, i) => (
        <div key={i} className={`${styles.car} ${carClassName}`.trim()} style={{ '--ti': i } as CSSProperties}>
          {car}
          <i className={styles.flash} aria-hidden="true" />
        </div>
      ))}
      <i className={styles.fill} aria-hidden="true" />
      <i className={styles.engine} aria-hidden="true" />
    </div>
  )
}
