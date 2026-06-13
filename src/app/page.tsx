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
        setEntries(data ?? [])
        setLoadingData(false)
      })
  }, [])

  if (loading) return null

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center pt-4">
        <div className="text-5xl mb-3">⚽</div>
        <h1 className="text-3xl font-bold text-white">World Cup 2026</h1>
        <p className="text-gray-400 mt-1">Pick your winners. Beat your friends.</p>
      </div>

      {/* Action buttons */}
      {session ? (
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/tips/group"
            className="px-5 py-2.5 bg-yellow-400 text-black font-semibold rounded-xl text-sm hover:bg-yellow-300 transition-colors"
          >
            My Group Tips
          </Link>
          <Link
            href="/tips/knockout"
            className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-colors"
          >
            Knockout Tips
          </Link>
          <Link
            href={`/profile/${session.participant_id}`}
            className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-colors"
          >
            My Profile
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm mx-auto text-center space-y-4">
          <p className="text-gray-300 text-sm">Got an invite? Join the league and start tipping!</p>
          <Link
            href="/join"
            className="block py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors"
          >
            Join with invite code
          </Link>
        </div>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Leaderboard</h2>

        {loadingData ? (
          <div className="text-gray-500 text-center py-12 animate-pulse">Loading…</div>
        ) : entries.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No scores yet — first results coming soon!
          </p>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500">
                  <th className="text-left px-4 py-3 w-10">#</th>
                  <th className="text-left px-4 py-3">Player</th>
                  <th className="text-right px-4 py-3 w-20">Pts</th>
                  <th className="text-right px-4 py-3 w-16 hidden sm:table-cell">Tips</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => {
                  const isMe = session?.participant_id === e.participant_id
                  return (
                    <tr
                      key={e.participant_id}
                      className={`border-b border-gray-800 last:border-0 transition-colors ${
                        isMe ? 'bg-yellow-950/20' : 'hover:bg-gray-800/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {i < 3 ? medals[i] : i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/profile/${e.participant_id}`}
                          className={`font-medium hover:underline ${
                            isMe ? 'text-yellow-400' : 'text-white'
                          }`}
                        >
                          {e.nickname}
                          {isMe && (
                            <span className="ml-1.5 text-xs text-yellow-600">(you)</span>
                          )}
                        </Link>
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
      </div>
    </div>
  )
}
