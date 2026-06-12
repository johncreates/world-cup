'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { LeaderboardEntry } from '@/types'

export default function LeaderboardPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !session) router.replace('/join')
  }, [session, loading, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/leaderboard', { headers: { 'x-participant-token': session.auth_token } })
      .then((r) => r.json())
      .then((data) => {
        setEntries(data)
        setLoadingData(false)
      })
  }, [session])

  if (loading || !session) return null
  if (loadingData) {
    return <div className="py-16 text-center text-gray-500 animate-pulse">Loading leaderboard…</div>
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leaderboard</h1>

      {entries.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          No scores yet — tip some matches to get on the board!
        </p>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="text-left px-4 py-3 w-10">#</th>
                <th className="text-left px-4 py-3">Player</th>
                <th className="text-right px-4 py-3 w-20">Pts</th>
                <th className="text-right px-4 py-3 w-20 hidden sm:table-cell">Tips</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const isMe = e.participant_id === session.participant_id
                return (
                  <tr
                    key={e.participant_id}
                    className={`border-b border-gray-800 last:border-0 ${
                      isMe ? 'bg-yellow-950/20' : 'hover:bg-gray-800/30'
                    } transition-colors`}
                  >
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {i < 3 ? medals[i] : `${i + 1}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                        {e.nickname}
                        {isMe && <span className="ml-1.5 text-xs text-yellow-600">(you)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-yellow-400 tabular-nums">
                      {e.total_points}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-sm tabular-nums hidden sm:table-cell">
                      {e.total_tips}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-gray-600 text-center">
        Scoring: Group 1pt (+2 exact) · R32 2pt · R16 3pt · QF 4pt · SF 6pt · Final 8pt
      </div>
    </div>
  )
}
