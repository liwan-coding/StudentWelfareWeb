import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { setOnUnauthorized } from '../services/apiClient'
import { authService } from '../services/authService'
import type { UserProfile } from '../types/api'

interface AuthState {
  user: UserProfile | null
  loading: boolean
  checked: boolean
}

type RegisterBody = {
  phone: string
  password: string
  password_confirmation: string
  name: string
  email?: string
}

type ResetPasswordBody = {
  verifyId: string
  verifyCode: string
  password: string
  password_confirmation: string
}

interface AuthContextValue extends AuthState {
  login: (phone: string, password: string) => Promise<void>
  register: (body: RegisterBody) => Promise<void>
  registerWithPhone: (body: RegisterBody) => Promise<{ verifyId: string; phone?: string }>
  verifyOtp: (verifyId: string, verifyCode: string) => Promise<void>
  resendOtp: (phone: string) => Promise<{ verifyId: string; phone?: string }>
  forgotPassword: (phone: string) => Promise<{ verifyId: string; phone?: string }>
  resetPassword: (body: ResetPasswordBody) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    checked: false,
  })

  const refreshProfile = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setState((s) => ({ ...s, user: null, checked: true }))
      return
    }
    try {
      const user = await authService.getProfile()
      setState((s) => ({ ...s, user, checked: true }))
    } catch {
      setState((s) => ({ ...s, user: null, checked: true }))
    }
  }, [])

  useEffect(() => {
    setOnUnauthorized(() => {
      setState((s) => ({ ...s, user: null }))
    })
    refreshProfile()
  }, [refreshProfile])

  const login = useCallback(async (phone: string, password: string) => {
    setState((s) => ({ ...s, loading: true }))
    try {
      await authService.login(phone, password)
      await refreshProfile()
    } finally {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [refreshProfile])

  const register = useCallback(
    async (body: RegisterBody) => {
      setState((s) => ({ ...s, loading: true }))
      try {
        await authService.register(body)
        await refreshProfile()
      } finally {
        setState((s) => ({ ...s, loading: false }))
      }
    },
    [refreshProfile]
  )

  const registerWithPhone = useCallback(async (body: RegisterBody) => {
    setState((s) => ({ ...s, loading: true }))
    try {
      return await authService.registerWithPhone(body)
    } finally {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [])

  const verifyOtp = useCallback(
    async (verifyId: string, verifyCode: string) => {
      setState((s) => ({ ...s, loading: true }))
      try {
        await authService.verifyOtp(verifyId, verifyCode)
        await refreshProfile()
      } finally {
        setState((s) => ({ ...s, loading: false }))
      }
    },
    [refreshProfile]
  )

  const resendOtp = useCallback(async (phone: string) => {
    setState((s) => ({ ...s, loading: true }))
    try {
      return await authService.resendOtp(phone)
    } finally {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [])

  const forgotPassword = useCallback(async (phone: string) => {
    setState((s) => ({ ...s, loading: true }))
    try {
      return await authService.forgotPassword(phone)
    } finally {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [])

  const resetPassword = useCallback(
    async (body: ResetPasswordBody) => {
      setState((s) => ({ ...s, loading: true }))
      try {
        await authService.resetPassword(body)
        await refreshProfile()
      } finally {
        setState((s) => ({ ...s, loading: false }))
      }
    },
    [refreshProfile]
  )

  const logout = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try {
      await authService.logout()
      setState((s) => ({ ...s, user: null }))
    } finally {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    registerWithPhone,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    logout,
    refreshProfile,
    isAuthenticated: !!state.user || authService.isAuthenticated(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
