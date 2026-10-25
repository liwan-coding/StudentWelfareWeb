import { useTranslation } from 'react-i18next'
import { PageLayout } from '../../components/layout/PageLayout'
import { Container } from '../../components/ui/Container'
import { useAuth } from '../../context/AuthContext'
import styles from './Profile.module.css'

export function Profile() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const initial = ((user?.name || user?.phone || t('nav.profile')) as string).trim().charAt(0)

  return (
    <PageLayout design>
      <Container size="narrow">
        <header className={styles.head}>
          <span className={styles.avatar} aria-hidden="true">{initial}</span>
          <h1 className={styles.title}>{t('nav.profile')}</h1>
          {user?.name ? <p className={styles.name}>{user.name}</p> : null}
        </header>
        <ul className={`ds-list ${styles.list}`}>
          <li>
            <span className={styles.label}>{t('auth.name')}</span>
            <span className={styles.value}>{user?.name ?? '—'}</span>
          </li>
          <li>
            <span className={styles.label}>{t('auth.phone')}</span>
            <span className={styles.value} dir="ltr">{user?.phone ?? '—'}</span>
          </li>
          <li>
            <span className={styles.label}>{t('auth.email')}</span>
            <span className={styles.value}>{user?.email ?? '—'}</span>
          </li>
        </ul>
      </Container>
    </PageLayout>
  )
}
