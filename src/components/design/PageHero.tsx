import type { CSSProperties } from 'react'
import { SilkCanvas } from './SilkCanvas'
import styles from './PageHero.module.css'

interface PageHeroProps {
  title: string
  subtitle?: string
  id?: string
}

/**
 * Page hero from design-reference/inner-pages.html: a dark silk band (paused off screen),
 * the title arriving word by word, and the logo's stairs with a light climbing them.
 */
export function PageHero({ title, subtitle, id }: PageHeroProps) {
  let wordIndex = 0
  const words = title.split(/(\s+)/).map((part, k) =>
    !part.trim() ? part : (
      <span key={k} className={styles.w} style={{ '--i': wordIndex++ } as CSSProperties}>
        <span>{part}</span>
      </span>
    ),
  )

  return (
    <header className={styles.ph}>
      <SilkCanvas className={styles.canvas} />
      <svg className={styles.stairs} viewBox="0 0 160 140" aria-hidden="true">
        <path d="M60 6h88a6 6 0 0 1 6 6v88z" fill="#D47EC0" opacity=".7" />
        <g fill="#7FD0E6">
          {[0, 1, 2, 3].map((s) => (
            <rect
              key={s}
              className={styles.st}
              style={{ '--s': s } as CSSProperties}
              x={6 + s * 34}
              y={112 - s * 30}
              width="34"
              height={28 + s * 30}
              rx="4"
            />
          ))}
        </g>
        <circle className={styles.walker} cx="23" cy="104" r="6" fill="#FFFFFF" />
      </svg>
      <div className={`ds-wrap ${styles.inner}`}>
        <span className={styles.rule} aria-hidden="true" />
        <h1 id={id}>{words}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  )
}
