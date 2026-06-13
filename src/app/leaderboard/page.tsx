'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : [])
        setLoadingData(false)
      })
  }, [session])

  if (loading || !session) return null
  if (loadingData) {
    return <div className="py-16 text-center text-ink-faint animate-pulse">Loading leaderboard…</div>
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-6 pt-4">
      <h1 className="font-serif text-3xl font-normal text-ink">Leaderboard</h1>

      {entries.length === 0 ? (
        <p className="text-ink-faint text-center py-12">
          No scores yet — tip some matches to get on the board!
        </p>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-gray-700">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dashed border-gray-700 text-xs text-ink-faint bg-gray-900">
                <th className="text-left px-4 py-3 w-10 font-normal">#</th>
                <th className="text-left px-4 py-3 font-normal">Player</th>
                <th className="text-right px-4 py-3 w-16 font-normal">Pts</th>
                <th className="text-right px-4 py-3 w-14 hidden sm:table-cell font-normal">Tips</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const isMe = e.participant_id === session.participant_id
                return (
                  <tr
                    key={e.participant_id}
                    className={`border-b border-dashed border-gray-700 last:border-0 transition-colors ${
                      isMe ? 'bg-yellow-950/20' : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                  >
                    <td className="px-4 py-3 text-ink-faint text-sm">
                      {i < 3 ? medals[i] : i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/profile/${e.participant_id}`}
                        className={`font-medium hover:underline ${isMe ? 'text-amber-text' : 'text-ink'}`}
                      >
                        {e.nickname}
                        {isMe && <span className="ml-1.5 text-xs text-ink-faint">(you)</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-text tabular-nums">
                      {e.total_points}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-faint text-sm tabular-nums hidden sm:table-cell">
                      {e.total_tips}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-ink-faint text-center">
        Scoring: Group 1pt · R32 2pt · R16 3pt · QF 4pt · SF 6pt · Final 8pt · Winner 15pt
      </p>
    </div>
  )
}
