'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function HomePage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && session) {
      router.replace('/tips/group')
    }
  }, [session, loading, router])

  if (loading) return null

  if (session) return null

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-8">
      <div className="text-6xl">⚽</div>
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">World Cup 2026 Tipping</h1>
        <p className="text-gray-400 text-lg">Pick your winners. Beat your friends.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full text-left space-y-4">
        <h2 className="text-lg font-semibold text-white">Got an invite?</h2>
        <p className="text-gray-400 text-sm">
          Enter your invite code to join the tipping league and start predicting match results.
        </p>
        <Link
          href="/join"
          className="block w-full text-center py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors"
        >
          Join with invite code
        </Link>
      </div>

      <div className="text-gray-600 text-sm max-w-md">
        <p className="font-medium text-gray-500 mb-2">How it works</p>
        <ul className="space-y-1 text-left">
          <li>🎟️ Get an invite link from your host</li>
          <li>📝 Pick your match winners before kickoff</li>
          <li>🏆 Earn points for correct predictions</li>
          <li>📊 Climb the leaderboard as the tournament progresses</li>
        </ul>
      </div>
    </div>
  )
}
