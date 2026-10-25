import { api } from './apiClient'
import { CLIENT_SOURCE } from './apiClient'
import type { RecentDonation } from '../types/api'

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const d = data as { data?: T[] }
  return d.data ?? []
}

export interface DonationWithPaymentBody {
  program_id?: number
  campaign_id?: number
  amount: number
  is_anonymous: boolean
  donor_name?: string
  donor_email?: string
  donor_phone?: string
  note?: string
  message?: string
  return_origin?: string
}

export interface DonationWithPaymentResponse {
  payment_url?: string
  session_id?: string
  donation_id?: number
  payment_error?: string
}

function extractPaymentUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const session = d.data && typeof d.data === 'object' ? (d.data as Record<string, unknown>).payment_session : null
  if (session && typeof session === 'object') {
    const url = (session as Record<string, unknown>).payment_url ?? (session as Record<string, unknown>).checkout_url ?? (session as Record<string, unknown>).redirect_url
    if (typeof url === 'string') return url
  }
  const url = d.payment_url ?? d.checkout_url ?? d.redirect_url
  if (typeof url === 'string') return url
  return null
}

function extractSessionId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const session = d.data && typeof d.data === 'object' ? (d.data as Record<string, unknown>).payment_session : null
  if (session && typeof session === 'object') {
    const id = (session as Record<string, unknown>).session_id
    if (typeof id === 'string') return id
  }
  const id = d.session_id
  if (typeof id === 'string') return id
  return null
}

export const donationService = {
  async createWithPayment(body: DonationWithPaymentBody): Promise<DonationWithPaymentResponse> {
    const data = await api.post<unknown>('/donations/with-payment', { ...body, source: CLIENT_SOURCE })
    const payment_url = extractPaymentUrl(data)
    const session_id = extractSessionId(data) ?? undefined
    const donation = (data as Record<string, unknown>).data && typeof (data as Record<string, unknown>).data === 'object'
      ? ((data as Record<string, unknown>).data as Record<string, unknown>).donation
      : null
    const donation_id = (donation && typeof donation === 'object' && (donation as Record<string, unknown>).donation_id) ?? (donation && typeof donation === 'object' && (donation as Record<string, unknown>).id) ?? (data as Record<string, unknown>).donation_id ?? (data as Record<string, unknown>).id
    const payment_error = (data as Record<string, unknown>).payment_error as string | undefined
    return {
      payment_url: payment_url ?? undefined,
      session_id,
      donation_id: typeof donation_id === 'number' ? donation_id : undefined,
      payment_error,
    }
  },

  /** Public endpoint (no auth). Sends request without Bearer so backend treats as guest (API_DOCUMENTATION.md §5). */
  async createAnonymousWithPayment(body: DonationWithPaymentBody): Promise<DonationWithPaymentResponse> {
    const data = await api.post<unknown>('/donations/anonymous-with-payment', { ...body, source: CLIENT_SOURCE }, { noAuth: true })
    const payment_url = extractPaymentUrl(data)
    const session_id = extractSessionId(data) ?? undefined
    return {
      payment_url: payment_url ?? undefined,
      session_id,
    }
  },

  async getRecent(limit = 5): Promise<RecentDonation[]> {
    try {
      const data = await api.get<unknown>('/donations/recent', { limit })
      return unwrapList<RecentDonation>(data)
    } catch {
      return []
    }
  },

  /** Throws when both endpoints fail, so the page can show an error instead of "no donations yet". */
  async getMyDonations(params?: { page?: number; limit?: number }): Promise<RecentDonation[]> {
    try {
      const data = await api.get<unknown>('/me/donations', params as Record<string, number>)
      return unwrapList<RecentDonation>(data)
    } catch (firstErr) {
      try {
        const data = await api.get<unknown>('/donations', params as Record<string, number>)
        return unwrapList<RecentDonation>(data)
      } catch {
        throw firstErr
      }
    }
  },
}
