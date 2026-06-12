'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

function JoinForm() {
  const { session, setSession, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [code, setCode] = useState(searchParams.get('code') || '')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && session) router.replace('/tips/group')
  }, [session, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), nickname: nickname.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }
      setSession({
        auth_token: data.auth_token,
        participant_id: data.participant_id,
        nickname: data.nickname,
        is_admin: data.is_admin,
      })
      router.push('/tips/group')
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-xl font-bold">Join WC 2026 Tipping</h1>
          <p className="text-gray-400 text-sm mt-1">Pick a nickname and start tipping</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Invite code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="wc26-xxxxxx"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Your nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. FootballFan42"
              maxLength={32}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Letters, numbers, spaces, hyphens OK</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Joining...' : 'Join the league'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><div className="text-gray-500 animate-pulse">Loading…</div></div>}>
      <JoinForm />
    </Suspense>
  )
}
