'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getSession, saveSession, clearSession } from '@/lib/auth'
import type { Session } from '@/types'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  setSession: (s: Session) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  setSession: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSessionState(getSession())
    setLoading(false)
  }, [])

  function setSession(s: Session) {
    saveSession(s)
    setSessionState(s)
  }

  function logout() {
    clearSession()
    setSessionState(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
