import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '../Header'
import { Footer } from '../Footer'
import styles from './PageLayout.module.css'

interface PageLayoutProps {
  children: ReactNode
  /** Optional: no padding for full-bleed sections (e.g. hero) */
  noPadding?: boolean
  /** Pages built on the Apple design layer (`ds-` primitives) */
  design?: boolean
}

export function PageLayout({ children, noPadding = false, design = false }: PageLayoutProps) {
  const { t } = useTranslation('common')
  return (
    <div className={design ? `${styles.layout} ds-page` : styles.layout}>
      <a href="#main" className={styles.skipLink}>
        {t('common.skipToContent')}
      </a>
      <Header />
      <main id="main" className={noPadding ? styles.mainNoPadding : styles.main} role="main">
        {noPadding ? children : <div className={styles.mainInner}>{children}</div>}
      </main>
      <Footer />
    </div>
  )
}
