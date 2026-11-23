import { api } from './apiClient'
import type { CampaignOrProgram } from '../types/api'

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const d = data as { data?: T[] }
  return d.data ?? []
}

export interface StudentRegistrationResponse {
  id?: number
  status?: string
  program_id?: number
  personal?: Record<string, unknown>
  academic?: Record<string, unknown>
  guardian?: Record<string, unknown>
  documents?: Record<string, string> | null
  program?: {
    id?: number
    title_ar?: string
    title_en?: string
    title?: string
  } | null
  [key: string]: unknown
}

export const studentRegistrationService = {
  /** Support programs for registration (GET /programs/support or fallback /programs) */
  async getSupportPrograms(): Promise<CampaignOrProgram[]> {
    try {
      const data = await api.get<unknown>('/programs/support')
      return unwrapList<CampaignOrProgram>(data)
    } catch {
      const data = await api.get<unknown>('/programs')
      return unwrapList<CampaignOrProgram>(data)
    }
  },

  /** Create new registration (multipart/form-data). */
  async createRegistration(formData: FormData): Promise<StudentRegistrationResponse> {
    const data = await api.postForm<unknown>('/students/registration', formData)
    const raw = data as { data?: StudentRegistrationResponse }
    return (raw.data ?? data) as StudentRegistrationResponse
  },

  /** Current user's registration (404 if none). */
  async getMyRegistration(): Promise<StudentRegistrationResponse | null> {
    try {
      const data = await api.get<unknown>('/students/registration/my-registration')
      const raw = data as { data?: StudentRegistrationResponse | null }
      const summary = raw.data ?? (data as StudentRegistrationResponse)
      if (!summary || typeof summary !== 'object') return null
      const needsFullRecord = summary.guardian == null || summary.documents == null || summary.program == null
      if (needsFullRecord && summary.id != null) {
        const full = await this.getRegistration(summary.id)
        if (full) return { ...summary, ...full }
      }
      return summary
    } catch {
      return null
    }
  },

  /** Get registration by ID. */
  async getRegistration(id: number): Promise<StudentRegistrationResponse | null> {
    try {
      const data = await api.get<unknown>(`/students/registration/${id}`)
      const raw = data as { data?: StudentRegistrationResponse }
      return (raw.data ?? data) as StudentRegistrationResponse
    } catch {
      return null
    }
  },

  /** Update registration (multipart/form-data). */
  async updateRegistration(id: number, formData: FormData): Promise<StudentRegistrationResponse> {
    return api.putForm<StudentRegistrationResponse>(`/students/registration/${id}`, formData)
  },

  /** Upload documents for a registration. */
  async uploadDocuments(id: number, formData: FormData): Promise<unknown> {
    return api.postForm(`/students/registration/${id}/documents`, formData)
  },
}
