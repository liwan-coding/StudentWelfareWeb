import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setDocumentDirection } from '../../i18n/config'
import { PageLayout } from '../../components/layout/PageLayout'
import { Container } from '../../components/ui/Container'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { studentRegistrationService } from '../../services/studentRegistrationService'
import { ApiError } from '../../services/apiClient'
import type { CampaignOrProgram } from '../../types/api'
import type { StudentRegistrationResponse } from '../../services/studentRegistrationService'
import styles from './StudentRegistration.module.css'

const SuccessCheckIcon = () => (
  <svg className={styles.successIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const ACCEPT_FILE = '.jpg,.jpeg,.png,.pdf'
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

const DOCUMENT_KEYS = [
  'application_letter',
  'id_card',
  'enrollment_letter',
  'tuition_letter',
  'income_proof',
  'bank_statements',
  'debt_proof',
  'supporting_documents',
  'housing_letter',
] as const

type DocumentKey = (typeof DOCUMENT_KEYS)[number]

const DOCUMENT_LABEL_KEYS: Record<DocumentKey, string> = {
  application_letter: 'docApplicationLetter',
  id_card: 'docIdCard',
  enrollment_letter: 'docEnrollmentLetter',
  tuition_letter: 'docTuitionLetter',
  income_proof: 'docIncomeProof',
  bank_statements: 'docBankStatements',
  debt_proof: 'docDebtProof',
  supporting_documents: 'docSupportingDocuments',
  housing_letter: 'docHousingLetter',
}

function getProgramTitle(item: CampaignOrProgram, lang: 'ar' | 'en') {
  const key = lang === 'ar' ? 'title_ar' : 'title_en'
  return (item[key as keyof CampaignOrProgram] as string) || item.title || `#${item.id}`
}

function isAllowedFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const type = file.type?.toLowerCase()
  const okExt = ['jpg', 'jpeg', 'png', 'pdf'].includes(ext ?? '')
  const okType = type === 'image/jpeg' || type === 'image/png' || type === 'image/jpg' || type === 'application/pdf'
  return okExt || okType
}

export function StudentRegistration() {
  const { t, i18n } = useTranslation('common')
  const { isAuthenticated, checked } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/student-registration'
  const lang = i18n.language === 'ar' ? 'ar' : 'en'
  const isRtl = (i18n.language || '').startsWith('ar')

  const [programs, setPrograms] = useState<CampaignOrProgram[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [existingRegistration, setExistingRegistration] = useState<StudentRegistrationResponse | null | undefined>(undefined)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [programId, setProgramId] = useState('')
  const [personal, setPersonal] = useState({
    full_name: '',
    civil_id: '',
    date_of_birth: '',
    phone: '',
    address: '',
    marital_status: 'single',
    email: '',
  })
  const [academic, setAcademic] = useState({
    institution: '',
    student_id: '',
    college: '',
    major: '',
    program: '',
    academic_year: '',
    gpa: '',
  })
  const [guardian, setGuardian] = useState({
    name: '',
    job: '',
    monthly_income: '',
    family_size: '',
    is_father_alive: '1',
    is_mother_alive: '1',
    parents_marital_status: 'stable',
  })
  const [documents, setDocuments] = useState<Partial<Record<DocumentKey, FileList | null>>>({})

  useEffect(() => {
    setDocumentDirection(i18n.language || 'ar')
  }, [i18n.language])

  useEffect(() => {
    if (!checked || !isAuthenticated) return
    let cancelled = false
    studentRegistrationService
      .getSupportPrograms()
      .then((list) => { if (!cancelled) setPrograms(list) })
      .catch(() => { if (!cancelled) setPrograms([]) })
      .finally(() => { if (!cancelled) setLoadingPrograms(false) })
    return () => { cancelled = true }
  }, [checked, isAuthenticated])

  useEffect(() => {
    if (!checked || !isAuthenticated) return
    let cancelled = false
    studentRegistrationService
      .getMyRegistration()
      .then((reg) => { if (!cancelled) setExistingRegistration(reg ?? null) })
      .catch(() => { if (!cancelled) setExistingRegistration(null) })
    return () => { cancelled = true }
  }, [checked, isAuthenticated])

  useEffect(() => {
    if (!checked) return
    if (!isAuthenticated) {
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true })
    }
  }, [checked, isAuthenticated, navigate, returnUrl])

  function buildFormData(): FormData {
    const fd = new FormData()
    if (programId) fd.append('program_id', programId)
    fd.append('personal[full_name]', personal.full_name)
    fd.append('personal[civil_id]', personal.civil_id)
    fd.append('personal[date_of_birth]', personal.date_of_birth)
    fd.append('personal[phone]', personal.phone)
    fd.append('personal[address]', personal.address)
    fd.append('personal[marital_status]', personal.marital_status)
    if (personal.email) fd.append('personal[email]', personal.email)
    fd.append('academic[institution]', academic.institution)
    fd.append('academic[student_id]', academic.student_id)
    if (academic.college) fd.append('academic[college]', academic.college)
    if (academic.major) fd.append('academic[major]', academic.major)
    if (academic.program) fd.append('academic[program]', academic.program)
    if (academic.academic_year) fd.append('academic[academic_year]', academic.academic_year)
    if (academic.gpa) fd.append('academic[gpa]', academic.gpa)
    fd.append('guardian[name]', guardian.name)
    fd.append('guardian[job]', guardian.job)
    fd.append('guardian[monthly_income]', guardian.monthly_income)
    fd.append('guardian[family_size]', guardian.family_size)
    fd.append('guardian[is_father_alive]', guardian.is_father_alive)
    fd.append('guardian[is_mother_alive]', guardian.is_mother_alive)
    fd.append('guardian[parents_marital_status]', guardian.parents_marital_status)
    DOCUMENT_KEYS.forEach((key) => {
      const file = documents[key]?.[0]
      if (file) fd.append(`documents[${key}]`, file)
    })
    return fd
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (programs.length > 0 && !programId) {
      setError(t('studentRegistration.required') + ' – ' + t('studentRegistration.selectProgram'))
      return
    }
    if (!personal.full_name.trim() || !personal.civil_id.trim() || !personal.date_of_birth || !personal.phone.trim() || !personal.address.trim()) {
      setError(t('studentRegistration.required') + ' – ' + t('studentRegistration.personal'))
      return
    }
    if (!academic.institution.trim() || !academic.student_id.trim()) {
      setError(t('studentRegistration.required') + ' – ' + t('studentRegistration.academic'))
      return
    }
    if (!guardian.name.trim() || !guardian.job.trim() || guardian.monthly_income === '' || guardian.family_size === '') {
      setError(t('studentRegistration.required') + ' – ' + t('studentRegistration.guardian'))
      return
    }
    for (const key of DOCUMENT_KEYS) {
      const file = documents[key]?.[0]
      if (!file) {
        setError(t('studentRegistration.required') + ' – ' + t(`studentRegistration.${DOCUMENT_LABEL_KEYS[key]}`))
        return
      }
      if (!isAllowedFile(file)) {
        setError(t('studentRegistration.documentInvalidType'))
        return
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(t('studentRegistration.documentTooLarge'))
        return
      }
    }
    setSubmitting(true)
    try {
      await studentRegistrationService.createRegistration(buildFormData())
      setSubmitted(true)
    } catch (err) {
      const msg = err instanceof ApiError && err.data && typeof err.data === 'object'
        ? ((err.data as { message?: string }).message ?? (err.data as { errors?: Record<string, string[]> }).errors
          ? Object.values((err.data as { errors: Record<string, string[]> }).errors).flat().join(' ')
          : t('common.error'))
        : err instanceof Error ? err.message : t('common.error')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!checked || !isAuthenticated) {
    return null
  }

  const isLoadingRegistration = existingRegistration === undefined
  if (isLoadingRegistration) {
    return (
      <PageLayout design>
        <Container size="narrow">
          <header className={styles.hero} aria-label={t('studentRegistration.title')} dir={isRtl ? 'rtl' : 'ltr'}>
            <h1 className={styles.heroTitle}>{t('studentRegistration.title')}</h1>
            <p className={styles.heroSubtitle} aria-busy="true">{t('common.loading')}</p>
          </header>
          <div className={styles.skeleton} aria-hidden="true" />
        </Container>
      </PageLayout>
    )
  }

  if (existingRegistration) {
    const reg = existingRegistration
    const personal = (reg.personal ?? {}) as Record<string, unknown>
    const academic = (reg.academic ?? {}) as Record<string, unknown>
    const guardian = (reg.guardian ?? {}) as Record<string, unknown>
    const status = typeof reg.status === 'string' ? reg.status : ''
    const program = programs.find((p) => p.id === reg.program_id)
    const programTitle = program ? getProgramTitle(program, lang) : reg.program_id ? String(reg.program_id) : '—'

    const statusKey = status ? `studentRegistration.status_${status}` : ''
    const statusLabel = statusKey && t(statusKey) !== statusKey ? t(statusKey) : status || t('studentRegistration.status_pending')
    const statusClass = status.toLowerCase() === 'approved' ? styles.status_approved : status.toLowerCase() === 'rejected' ? styles.status_rejected : styles.status_pending

    return (
      <PageLayout design>
        <Container size="narrow">
          <div dir={isRtl ? 'rtl' : 'ltr'}>
            <header className={styles.hero} aria-label={t('studentRegistration.alreadyRegisteredTitle')}>
              <h1 className={styles.heroTitle}>{t('studentRegistration.alreadyRegisteredTitle')}</h1>
              <p className={styles.heroSubtitle}>{t('studentRegistration.alreadyRegisteredMessage')}</p>
            </header>

            <div className={styles.readOnlyRoot}>
              <Section title={t('studentRegistration.registrationStatus')}>
                <div className={styles.rows}>
                  <div className={styles.readOnlyItem}>
                    <span className={styles.readOnlyLabel}>{t('studentRegistration.selectProgram')}</span>
                    <span className={styles.readOnlyValue}>{programTitle}</span>
                  </div>
                  <div className={styles.readOnlyItem}>
                    <span className={styles.readOnlyLabel}>{t('studentRegistration.statusLabel')}</span>
                    <span className={status ? `${styles.statusBadge} ${statusClass}` : styles.readOnlyValue}>{statusLabel}</span>
                  </div>
                </div>
              </Section>

              <Section step={1} title={t('studentRegistration.personal')}>
                <div className={styles.rows}>
                  {(['full_name', 'civil_id', 'date_of_birth', 'phone', 'address', 'marital_status', 'email'] as const).map((key) => {
                    let val = personal[key]
                    if (key === 'marital_status') val = (val === 'married' ? t('studentRegistration.maritalMarried') : t('studentRegistration.maritalSingle')) as unknown
                    return (
                      <div key={key} className={styles.readOnlyItem}>
                        <span className={styles.readOnlyLabel}>{t(`studentRegistration.${key === 'full_name' ? 'fullName' : key === 'civil_id' ? 'civilId' : key === 'date_of_birth' ? 'dateOfBirth' : key === 'marital_status' ? 'maritalStatus' : key}`)}</span>
                        <span className={styles.readOnlyValue}>{String(val ?? '—')}</span>
                      </div>
                    )
                  })}
                </div>
              </Section>

              <Section step={2} title={t('studentRegistration.academic')}>
                <div className={styles.rows}>
                  {(['institution', 'student_id', 'college', 'major', 'program', 'academic_year', 'gpa'] as const).map((key) => (
                    <div key={key} className={styles.readOnlyItem}>
                      <span className={styles.readOnlyLabel}>{t(`studentRegistration.${key === 'student_id' ? 'studentId' : key === 'academic_year' ? 'academicYear' : key}`)}</span>
                      <span className={styles.readOnlyValue}>{String(academic[key] ?? '—')}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section step={3} title={t('studentRegistration.guardian')}>
                <div className={styles.rows}>
                  {(['name', 'job', 'monthly_income', 'family_size', 'is_father_alive', 'is_mother_alive', 'parents_marital_status'] as const).map((key) => {
                    let val: string
                    if (key === 'is_father_alive' || key === 'is_mother_alive') val = guardian[key] === '1' || guardian[key] === 1 ? t('studentRegistration.yes') : t('studentRegistration.no')
                    else if (key === 'parents_marital_status') val = guardian[key] === 'separated' ? t('studentRegistration.parentsSeparated') : t('studentRegistration.parentsStable')
                    else val = String(guardian[key] ?? '—')
                    return (
                      <div key={key} className={styles.readOnlyItem}>
                        <span className={styles.readOnlyLabel}>{t(`studentRegistration.${key === 'name' ? 'guardianName' : key === 'job' ? 'guardianJob' : key === 'monthly_income' ? 'monthlyIncome' : key === 'family_size' ? 'familySize' : key === 'is_father_alive' ? 'isFatherAlive' : key === 'is_mother_alive' ? 'isMotherAlive' : 'parentsMaritalStatus'}`)}</span>
                        <span className={styles.readOnlyValue}>{val}</span>
                      </div>
                    )
                  })}
                </div>
              </Section>

              <div className={styles.formActions}>
                <Link to="/" className={styles.actionLink}>
                  <Button variant="primary" size="lg" fullWidth>{t('studentRegistration.backHome')}</Button>
                </Link>
                <Link to="/my-donations" className={styles.backLinkBlock}>{t('nav.myDonations')}</Link>
              </div>
            </div>
          </div>
        </Container>
      </PageLayout>
    )
  }

  if (submitted) {
    return (
      <PageLayout design>
        <Container size="narrow">
          <section
            className={styles.successCard}
            aria-label={t('studentRegistration.successTitle')}
            dir={isRtl ? 'rtl' : 'ltr'}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className={styles.successIconWrap}>
              <SuccessCheckIcon />
            </div>
            <h1 className={styles.successTitle}>{t('studentRegistration.successTitle')}</h1>
            <p className={styles.successMessage}>{t('studentRegistration.successMessage')}</p>
            <p className={styles.successNextSteps}>{t('studentRegistration.successNextSteps')}</p>
            <div className={styles.successActions}>
              <Link to="/" className={styles.actionLink}>
                <Button variant="primary" size="lg" fullWidth>{t('studentRegistration.viewMyRegistration')}</Button>
              </Link>
              <Link to="/" className={styles.successBackLink}>{t('studentRegistration.backHome')}</Link>
            </div>
          </section>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout design>
      <Container size="narrow">
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          <header className={styles.hero} aria-label="Registration">
            <h1 className={styles.heroTitle}>{t('studentRegistration.title')}</h1>
            <p className={styles.heroSubtitle}>{t('studentRegistration.subtitle')}</p>
          </header>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error} role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Section step={1} title={t('studentRegistration.selectProgram')}>
              <div className={styles.fields}>
                <label className={styles.label}>
                  {t('studentRegistration.selectProgram')}
                  <select
                    className={styles.input}
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    disabled={loadingPrograms}
                  >
                    <option value="">{loadingPrograms ? t('common.loading') : ' — '}</option>
                    {programs.map((p) => (
                      <option key={p.id} value={String(p.id)}>{getProgramTitle(p, lang)}</option>
                    ))}
                  </select>
                </label>
              </div>
            </Section>

            <Section step={2} title={t('studentRegistration.personal')}>
              <div className={styles.grid2}>
                <label className={styles.label}>
                  <span>{t('studentRegistration.fullName')} <span className={styles.required}>*</span></span>
                  <input type="text" className={styles.input} value={personal.full_name} onChange={(e) => setPersonal((s) => ({ ...s, full_name: e.target.value }))} required disabled={submitting} />
                </label>
                <label className={styles.label}>
                  <span>{t('studentRegistration.civilId')} <span className={styles.required}>*</span></span>
                  <input type="text" className={styles.input} value={personal.civil_id} onChange={(e) => setPersonal((s) => ({ ...s, civil_id: e.target.value }))} required disabled={submitting} />
                </label>
                <label className={styles.label}>
                  <span>{t('studentRegistration.dateOfBirth')} <span className={styles.required}>*</span></span>
                  <input type="date" className={styles.input} value={personal.date_of_birth} onChange={(e) => setPersonal((s) => ({ ...s, date_of_birth: e.target.value }))} required disabled={submitting} />
                </label>
                <label className={styles.label}>
                  <span>{t('studentRegistration.phone')} <span className={styles.required}>*</span></span>
                  <input type="tel" className={styles.input} value={personal.phone} onChange={(e) => setPersonal((s) => ({ ...s, phone: e.target.value }))} placeholder="968XXXXXXXX" required disabled={submitting} />
                </label>
                <label className={styles.label + ' ' + styles.spanFull}>
                  <span>{t('studentRegistration.address')} <span className={styles.required}>*</span></span>
                  <input type="text" className={styles.input} value={personal.address} onChange={(e) => setPersonal((s) => ({ ...s, address: e.target.value }))} required disabled={submitting} />
                </label>
                <label className={styles.label}>
                  {t('studentRegistration.maritalStatus')}
                  <select className={styles.input} value={personal.marital_status} onChange={(e) => setPersonal((s) => ({ ...s, marital_status: e.target.value }))} disabled={submitting}>
                    <option value="single">{t('studentRegistration.maritalSingle')}</option>
                    <option value="married">{t('studentRegistration.maritalMarried')}</option>
                  </select>
                </label>
                <label className={styles.label}>
                  {t('studentRegistration.email')}
                  <input type="email" className={styles.input} value={personal.email} onChange={(e) => setPersonal((s) => ({ ...s, email: e.target.value }))} disabled={submitting} />
                </label>
              </div>
            </Section>

            <Section step={3} title={t('studentRegistration.academic')}>
              <div className={styles.grid2}>
                <label className={styles.label}>
                  <span>{t('studentRegistration.institution')} <span className={styles.required}>*</span></span>
                  <input type="text" className={styles.input} value={academic.institution} onChange={(e) => setAcademic((s) => ({ ...s, institution: e.target.value }))} required disabled={submitting} />
                </label>
                <label className={styles.label}>
                  <span>{t('studentRegistration.studentId')} <span className={styles.required}>*</span></span>
                  <input type="text" className={styles.input} value={academic.student_id} onChange={(e) => setAcademic((s) => ({ ...s, student_id: e.target.value }))} required disabled={submitting} />
                </label>
                <label className={styles.label}>
                  {t('studentRegistration.college')}
                  <input type="text" className={styles.input} value={academic.college} onChange={(e) => setAcademic((s) => ({ ...s, college: e.target.value }))} disabled={submitting} />
                </label>
                <label className={styles.label}>
                  {t('studentRegistration.major')}
                  <input type="text" className={styles.input} value={academic.major} onChange={(e) => setAcademic((s) => ({ ...s, major: e.target.value }))} disabled={submitting} />
                </label>
                <label className={styles.label}>
                  {t('studentRegistration.program')}
                  <input type="text" className={styles.input} value={academic.program} onChange={(e) => setAcademic((s) => ({ ...s, program: e.target.value }))} disabled={submitting} />
                </label>
                <label className={styles.label}>
                  {t('studentRegistration.academicYear')}
                  <select className={styles.input} value={academic.academic_year} onChange={(e) => setAcademic((s) => ({ ...s, academic_year: e.target.value }))} disabled={submitting}>
                    <option value=""> — </option>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={String(n)}>{n}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  {t('studentRegistration.gpa')}
                  <input type="text" className={styles.input} value={academic.gpa} onChange={(e) => setAcademic((s) => ({ ...s, gpa: e.target.value }))} placeholder="3.5" disabled={submitting} />
                </label>
              </div>
            </Section>

            <Section step={4} title={t('studentRegistration.guardian')}>
              <div className={styles.grid2}>
                <label className={styles.label}>
                  <span>{t('studentRegistration.guardianName')} <span className={styles.required}>*</span></span>
                  <input type="text" className={styles.input} value={guardian.name} onChange={(e) => setGuardian((s) => ({ ...s, name: e.target.value }))} required disabled={submitting} />
                </label>
                <label className={styles.label}>
                  <span>{t('studentRegistration.guardianJob')} <span className={styles.required}>*</span></span>
                  <input type="text" className={styles.input} value={guardian.job} onChange={(e) => setGuardian((s) => ({ ...s, job: e.target.value }))} required disabled={submitting} />
                </label>
                <label className={styles.label}>
                  <span>{t('studentRegistration.monthlyIncome')} <span className={styles.required}>*</span></span>
                  <input type="number" step="0.001" min="0" className={styles.input} value={guardian.monthly_income} onChange={(e) => setGuardian((s) => ({ ...s, monthly_income: e.target.value }))} required disabled={submitting} />
                </label>
                <label className={styles.label}>
                  <span>{t('studentRegistration.familySize')} <span className={styles.required}>*</span></span>
                  <input type="number" min="1" className={styles.input} value={guardian.family_size} onChange={(e) => setGuardian((s) => ({ ...s, family_size: e.target.value }))} required disabled={submitting} />
                </label>
                <label className={styles.label}>
                  {t('studentRegistration.isFatherAlive')}
                  <select className={styles.input} value={guardian.is_father_alive} onChange={(e) => setGuardian((s) => ({ ...s, is_father_alive: e.target.value }))} disabled={submitting}>
                    <option value="1">{t('studentRegistration.yes')}</option>
                    <option value="0">{t('studentRegistration.no')}</option>
                  </select>
                </label>
                <label className={styles.label}>
                  {t('studentRegistration.isMotherAlive')}
                  <select className={styles.input} value={guardian.is_mother_alive} onChange={(e) => setGuardian((s) => ({ ...s, is_mother_alive: e.target.value }))} disabled={submitting}>
                    <option value="1">{t('studentRegistration.yes')}</option>
                    <option value="0">{t('studentRegistration.no')}</option>
                  </select>
                </label>
                <label className={styles.label + ' ' + styles.spanFull}>
                  {t('studentRegistration.parentsMaritalStatus')}
                  <select className={styles.input} value={guardian.parents_marital_status} onChange={(e) => setGuardian((s) => ({ ...s, parents_marital_status: e.target.value }))} disabled={submitting}>
                    <option value="stable">{t('studentRegistration.parentsStable')}</option>
                    <option value="separated">{t('studentRegistration.parentsSeparated')}</option>
                  </select>
                </label>
              </div>
            </Section>

            <Section step={5} title={t('studentRegistration.documents')}>
              <p className={styles.documentsHint}>{t('studentRegistration.documentsHint')}</p>
              <div className={styles.files}>
                {DOCUMENT_KEYS.map((key) => {
                  const chosen = documents[key]?.[0]
                  return (
                    <label key={key} className={chosen ? `${styles.fileZone} ${styles.fileZoneDone}` : styles.fileZone}>
                      <span className={styles.fileTitle}>
                        {chosen ? <CheckIcon /> : <UploadIcon />}
                        <span>{t(`studentRegistration.${DOCUMENT_LABEL_KEYS[key]}`)} <span className={styles.required}>*</span></span>
                      </span>
                      <input
                        type="file"
                        className={styles.fileInput}
                        accept={ACCEPT_FILE}
                        onChange={(e) => setDocuments((s) => ({ ...s, [key]: e.target.files }))}
                        disabled={submitting}
                        required
                      />
                    </label>
                  )
                })}
              </div>
            </Section>

            <div className={`${styles.formActions} ${styles.stickyActions}`}>
              <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
                {submitting ? t('studentRegistration.submitting') : t('studentRegistration.submit')}
              </Button>
              <Link to="/" className={styles.backLinkBlock}>{t('studentRegistration.backHome')}</Link>
            </div>
          </form>
        </div>
      </Container>
    </PageLayout>
  )
}

/** iOS Settings-style group: small header above, rounded cell group, optional footnote below. */
function Section({ step, title, footer, children }: { step?: number; title: string; footer?: string; children: ReactNode }) {
  return (
    <section className={styles.group}>
      <h2 className={styles.groupHead}>
        {step != null ? <span className={styles.sectionIcon} aria-hidden="true">{step}</span> : null}
        {title}
      </h2>
      <div className={styles.groupBody}>{children}</div>
      {footer ? <p className={styles.groupFoot}>{footer}</p> : null}
    </section>
  )
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  )
}
