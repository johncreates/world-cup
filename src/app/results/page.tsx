'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { Match } from '@/types'
import { GROUPS } from '@/lib/fixtures/teams'

type Filter = 'upcoming' | 'live' | 'finished' | string

export default function ResultsPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [filter, setFilter] = useState<Filter>('upcoming')

  useEffect(() => {
    if (!loading && !session) router.replace('/join')
  }, [session, loading, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/matches')
      .then((r) => r.json())
      .then((data) => {
        setMatches(data)
        setLoadingData(false)
      })
  }, [session])

  if (loading || !session) return null
  if (loadingData) {
    return <div className="py-16 text-center text-ink-faint animate-pulse">Loading…</div>
  }

  const now = new Date()

  function filterMatches(): Match[] {
    if (filter === 'upcoming') return matches.filter((m) => !m.result_confirmed_at && new Date(m.kickoff_at) > now)
    if (filter === 'live') return matches.filter((m) => !m.result_confirmed_at && new Date(m.kickoff_at) <= now)
    if (filter === 'finished') return matches.filter((m) => !!m.result_confirmed_at)
    return matches.filter((m) => m.group_id === filter)
  }

  const filtered = filterMatches()

  const filters = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'live', label: 'Live/Locked' },
    { key: 'finished', label: 'Finished' },
    ...GROUPS.map((g) => ({ key: g, label: `Group ${g}` })),
  ]

  const stageLabel: Record<string, string> = {
    group: 'Group', r32: 'R32', r16: 'R16', qf: 'QF', sf: 'SF', final: 'Final',
  }

  return (
    <div className="space-y-6 pt-4">
      <h1 className="font-serif text-3xl font-normal text-ink">Schedule & Results</h1>

      <div className="flex gap-1.5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-800 text-ink-muted hover:text-ink hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {filtered.map((match) => {
          const kickoff = new Date(match.kickoff_at)
          const isFinished = !!match.result_confirmed_at
          const isLive = !isFinished && kickoff <= now

          const homeName = match.home_team?.name ?? match.home_team_placeholder ?? '?'
          const awayName = match.away_team?.name ?? match.away_team_placeholder ?? '?'
          const homeFlag = match.home_team?.flag_emoji ?? ''
          const awayFlag = match.away_team?.flag_emoji ?? ''

          return (
            <div
              key={match.id}
              className={`bg-gray-900 border rounded-xl px-4 py-3 flex items-center gap-3 ${
                isFinished ? 'border-gray-700' : isLive ? 'border-orange-300' : 'border-gray-700'
              }`}
            >
              <div className="text-xs text-ink-faint w-8 shrink-0 font-mono">M{match.match_number}</div>
              <div className="text-xs text-ink-faint w-8 shrink-0">
                {match.group_id ? `G${match.group_id}` : stageLabel[match.stage]}
              </div>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate text-right flex-1 text-ink">
                  {homeFlag} {homeName}
                </span>
                <span className={`text-sm font-bold tabular-nums shrink-0 ${
                  isFinished ? 'text-amber-text' : isLive ? 'text-orange-600' : 'text-ink-faint'
                }`}>
                  {isFinished ? `${match.home_score} – ${match.away_score}` : isLive ? 'LIVE' : '–'}
                </span>
                <span className="text-sm font-medium truncate flex-1 text-ink">
                  {awayFlag} {awayName}
                </span>
              </div>
              <div className="text-xs text-ink-faint shrink-0 hidden sm:block">
                {kickoff.toLocaleDateString('en-AU', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-ink-faint text-center py-8">No matches in this filter</p>
        )}
      </div>
    </div>
  )
}
