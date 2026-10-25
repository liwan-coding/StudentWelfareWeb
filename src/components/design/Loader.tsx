import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SilkCanvas } from './SilkCanvas'
import { LOGO_SRC, LOGO_WIDTH, LOGO_HEIGHT } from './logo'
import styles from './Loader.module.css'

/** The loading screen runs once per full page load, not on every visit to the page. */
let finishedThisLoad = false

/** Loading screen from the design: silk, logo, name and a filling bar, then it fades open. */
export function Loader({ onDone }: { onDone?: () => void }) {
  const { t } = useTranslation('common')
  const [phase, setPhase] = useState<'on' | 'out' | 'gone'>(() => (finishedThisLoad ? 'gone' : 'on'))
  const [nameOn, setNameOn] = useState(false)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    if (phase === 'gone') onDoneRef.current?.()
    // only the first render matters here: an already-finished loader reports done immediately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== 'on') return
    const timers = [
      window.setTimeout(() => setNameOn(true), 350),
      window.setTimeout(() => {
        finishedThisLoad = true
        setPhase('out')
        onDoneRef.current?.()
      }, 2100),
    ]
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [phase])

  useEffect(() => {
    if (phase !== 'out') return
    const id = window.setTimeout(() => setPhase('gone'), 700)
    return () => window.clearTimeout(id)
  }, [phase])

  if (phase === 'gone') return null

  function finish() {
    if (phase !== 'on') return
    finishedThisLoad = true
    setPhase('out')
    onDoneRef.current?.()
  }

  return (
    <div className={`${styles.loader} ${phase === 'out' ? styles.out : ''}`} aria-hidden="true" onClick={finish}>
      <SilkCanvas className={styles.canvas} />
      <div className={styles.inner}>
        <div className={styles.logo}>
          <img src={LOGO_SRC} alt="" width={LOGO_WIDTH} height={LOGO_HEIGHT} />
        </div>
        <div className={`${styles.name} ${nameOn ? styles.nameOn : ''}`}>{t('app.name')}</div>
        <div className={styles.bar}>
          <i />
        </div>
      </div>
    </div>
  )
}
