import { authApi, api, getToken, setToken, clearToken, ApiError } from './apiClient'
import type { UserProfile } from '../types/api'

function extractToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const fromData = d.data && typeof d.data === 'object' && (d.data as Record<string, unknown>).token
  if (typeof fromData === 'string') return fromData
  if (typeof d.token === 'string') return d.token
  return null
}

/** { verifyId, phone } from an OTP-sending response (data.* or top level). */
function extractVerify(data: unknown, endpoint: string): { verifyId: string; phone?: string } {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const inner = (d.data && typeof d.data === 'object' ? d.data : d) as Record<string, unknown>
  const verifyId = (inner.verifyId ?? d.verifyId) as string | undefined
  if (!verifyId || typeof verifyId !== 'string') throw new Error(`Invalid ${endpoint} response: missing verifyId`)
  const phone = (inner.phone ?? d.phone) as string | undefined
  return { verifyId, phone }
}

/** Login rejected because the phone is not verified; the backend already sent an OTP. */
export class VerificationRequiredError extends Error {
  verifyId: string
  phone?: string
  constructor(verifyId: string, phone?: string) {
    super('Phone verification required')
    this.name = 'VerificationRequiredError'
    this.verifyId = verifyId
    this.phone = phone
  }
}

export const authService = {
  async login(phone: string, password: string): Promise<{ token: string }> {
    let data: unknown
    try {
      data = await authApi.post<unknown>('/auth/login', { phone, password })
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && (err.data as { requires_verification?: boolean } | null)?.requires_verification) {
        const { verifyId, phone: masked } = extractVerify(err.data, 'login')
        throw new VerificationRequiredError(verifyId, masked)
      }
      throw err
    }
    const token = extractToken(data)
    if (!token) throw new Error('Invalid login response')
    setToken(token)
    return { token }
  },

  async register(body: {
    phone: string
    password: string
    password_confirmation: string
    name: string
    email?: string
  }): Promise<{ token: string }> {
    const data = await authApi.post<unknown>('/auth/register', body)
    const token = extractToken(data)
    if (!token) throw new Error('Invalid register response')
    setToken(token)
    return { token }
  },

  /** Step 1: Register with phone → backend sends OTP, returns verifyId. No token yet. */
  async registerWithPhone(body: {
    phone: string
    password: string
    password_confirmation: string
    name: string
    email?: string
  }): Promise<{ verifyId: string; phone?: string }> {
    const data = await authApi.post<unknown>('/auth/register/phone', body)
    return extractVerify(data, 'register/phone')
  },

  /** Step 2: Submit OTP → get token and store it. */
  async verifyOtp(verifyId: string, verifyCode: string): Promise<{ token: string }> {
    const data = await authApi.post<unknown>('/auth/verify/phone/otp', { verifyId, verifyCode })
    const token = extractToken(data)
    // backend answers wrong/expired codes with 201/203 + errors; surface its message as a 4xx
    if (!token) throw new ApiError(422, data)
    setToken(token)
    return { token }
  },

  /** Resend OTP for same phone; returns new verifyId. */
  async resendOtp(phone: string): Promise<{ verifyId: string; phone?: string }> {
    const data = await authApi.post<unknown>('/auth/resend-otp', { phone })
    return extractVerify(data, 'resend-otp')
  },

  /** Forgot password step 1: backend sends a reset OTP (same response for unknown numbers). */
  async forgotPassword(phone: string): Promise<{ verifyId: string; phone?: string }> {
    const data = await authApi.post<unknown>('/auth/forgot-password', { phone })
    return extractVerify(data, 'forgot-password')
  },

  /** Forgot password step 2: OTP + new password → token and store it. */
  async resetPassword(body: {
    verifyId: string
    verifyCode: string
    password: string
    password_confirmation: string
  }): Promise<{ token: string }> {
    const data = await authApi.post<unknown>('/auth/reset-password', body)
    const token = extractToken(data)
    if (!token) throw new Error('Invalid reset-password response')
    setToken(token)
    return { token }
  },

  /** Dev only: get OTP for testing (backend may disable in production). */
  async getDevOtp(verifyId: string): Promise<string | null> {
    const data = await authApi.get<unknown>('/auth/dev/otp', { params: { verifyId } })
    const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
    const inner = (d.data && typeof d.data === 'object' ? d.data : d) as Record<string, unknown>
    const otp = (inner.otp ?? inner.dev_otp ?? inner.debug_otp ?? inner.code ?? d.otp ?? d.code) as string | number | undefined
    if (otp == null) return null
    return String(otp)
  },

  async logout(): Promise<void> {
    try {
      await authApi.post('/auth/logout', {})
    } finally {
      clearToken()
    }
  },

  async getProfile(): Promise<UserProfile> {
    const data = await api.get<unknown>('/me/edit/profile')
    if (Array.isArray(data)) return (data[0] as UserProfile) ?? {}
    const d = data as { data?: UserProfile }
    return d.data ?? (data as UserProfile)
  },

  async updateProfile(body: { name?: string; phone?: string; email?: string }): Promise<UserProfile> {
    const data = await api.patch<unknown>('/me/edit/profile', body)
    const d = data as { data?: UserProfile }
    return d.data ?? (data as UserProfile)
  },

  isAuthenticated(): boolean {
    return !!getToken()
  },
}
