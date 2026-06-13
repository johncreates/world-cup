'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import type { LeaderboardEntry } from '@/types'

export default function HomePage() {
  const { session, loading } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : [])
        setLoadingData(false)
      })
  }, [])

  if (loading) return null

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-10 pt-4">
      {/* Hero */}
      <div className="text-center">
        <div className="text-5xl mb-4">⚽</div>
        <h1 className="font-serif text-4xl font-normal text-ink tracking-tight">
          World Cup 2026
        </h1>
        <p className="text-ink-muted mt-2">Pick your winners. Beat your friends.</p>
      </div>

      {/* Action buttons */}
      {session ? (
        <div className="flex gap-2 justify-center flex-wrap">
          <Link
            href="/tips/group"
            className="px-5 py-2.5 bg-yellow-400 text-black font-bold rounded-xl text-sm hover:bg-yellow-300 transition-colors"
          >
            Group Stage Tips
          </Link>
          <Link
            href="/tips/knockout"
            className="px-5 py-2.5 bg-gray-800 text-ink-muted rounded-xl text-sm hover:bg-gray-700 hover:text-ink transition-colors"
          >
            Knockout Tips
          </Link>
          <Link
            href={`/profile/${session.participant_id}`}
            className="px-5 py-2.5 bg-gray-800 text-ink-muted rounded-xl text-sm hover:bg-gray-700 hover:text-ink transition-colors"
          >
            My Profile
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-xs mx-auto text-center space-y-4">
          <p className="text-ink-muted text-sm">Got an invite? Join the league and start tipping!</p>
          <Link
            href="/join"
            className="block py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors"
          >
            Join with invite code
          </Link>
        </div>
      )}

      {/* Leaderboard */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-normal text-ink">Leaderboard</h2>

        {loadingData ? (
          <div className="text-ink-faint text-center py-12 animate-pulse">Loading…</div>
        ) : entries.length === 0 ? (
          <p className="text-ink-faint text-center py-12">
            No scores yet — first results coming soon!
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
                  const isMe = session?.participant_id === e.participant_id
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
                          className={`font-medium hover:underline ${
                            isMe ? 'text-amber-text' : 'text-ink'
                          }`}
                        >
                          {e.nickname}
                          {isMe && (
                            <span className="ml-1.5 text-xs text-ink-faint">(you)</span>
                          )}
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
      </div>
    </div>
  )
}
