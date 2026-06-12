'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { Match } from '@/types'

export default function AdminResultsPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [editing, setEditing] = useState<Record<string, { home: string; away: string; winner: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  useEffect(() => {
    if (!loading && (!session || !session.is_admin)) router.replace('/')
  }, [session, loading, router])

  useEffect(() => {
    if (!session?.is_admin) return
    fetch('/api/matches')
      .then((r) => r.json())
      .then((data) => {
        // Sort: unfinished locked matches first (need results ASAP), then by match number
        const sorted = [...data].sort((a: Match, b: Match) => {
          const aLocked = new Date(a.kickoff_at) <= new Date()
          const bLocked = new Date(b.kickoff_at) <= new Date()
          const aFinished = !!a.result_confirmed_at
          const bFinished = !!b.result_confirmed_at
          if (aLocked && !aFinished && !(bLocked && !bFinished)) return -1
          if (bLocked && !bFinished && !(aLocked && !aFinished)) return 1
          return a.match_number - b.match_number
        })
        setMatches(sorted)
        setLoadingData(false)
      })
  }, [session])

  function startEdit(match: Match) {
    setEditing((prev) => ({
      ...prev,
      [match.id]: {
        home: match.home_score?.toString() ?? '',
        away: match.away_score?.toString() ?? '',
        winner: match.winner_team_id ?? '',
      },
    }))
  }

  async function saveResult(match: Match) {
    if (!session) return
    const e = editing[match.id]
    if (!e) return
    const homeScore = parseInt(e.home)
    const awayScore = parseInt(e.away)
    if (isNaN(homeScore) || isNaN(awayScore)) {
      setMessage((prev) => ({ ...prev, [match.id]: 'Enter valid scores' }))
      return
    }
    // For knockout, if draw, require winner_team_id
    if (match.stage !== 'group' && homeScore === awayScore && !e.winner) {
      setMessage((prev) => ({ ...prev, [match.id]: 'Knockout draw: select winner (AET/penalties)' }))
      return
    }
    setSaving(match.id)
    try {
      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-participant-token': session.auth_token },
        body: JSON.stringify({
          match_id: match.id,
          home_score: homeScore,
          away_score: awayScore,
          winner_team_id: e.winner || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage((prev) => ({ ...prev, [match.id]: data.error }))
        return
      }
      setMatches((prev) => prev.map((m) => (m.id === match.id ? data : m)))
      setEditing((prev) => { const n = { ...prev }; delete n[match.id]; return n })
      setMessage((prev) => ({ ...prev, [match.id]: '✓ Saved' }))
      setTimeout(() => setMessage((prev) => { const n = { ...prev }; delete n[match.id]; return n }), 2000)
    } finally {
      setSaving(null)
    }
  }

  if (loading || !session?.is_admin) return null
  if (loadingData) return <div className="py-16 text-center text-gray-500 animate-pulse">Loading…</div>

  const now = new Date()
  const filtered = filter === 'pending'
    ? matches.filter((m) => !m.result_confirmed_at && new Date(m.kickoff_at) <= now)
    : matches

  const pendingCount = matches.filter((m) => !m.result_confirmed_at && new Date(m.kickoff_at) <= now).length

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Enter Results</h1>
        {pendingCount > 0 && (
          <span className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded-full font-medium">
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {(['pending', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {f === 'pending' ? `Needs result (${pendingCount})` : 'All matches'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((match) => {
          const isEditing = !!editing[match.id]
          const e = editing[match.id]
          const homeName = match.home_team?.name ?? match.home_team_placeholder ?? '?'
          const awayName = match.away_team?.name ?? match.away_team_placeholder ?? '?'
          const homeFlag = match.home_team?.flag_emoji ?? ''
          const awayFlag = match.away_team?.flag_emoji ?? ''
          const isKnockout = match.stage !== 'group'

          return (
            <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    M{match.match_number} · {match.stage === 'group' ? `Group ${match.group_id}` : match.stage.toUpperCase()} · {match.venue}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{homeFlag} {homeName}</span>
                    <span className="text-gray-500 text-sm">vs</span>
                    <span className="font-medium">{awayFlag} {awayName}</span>
                    {match.result_confirmed_at && (
                      <span className="ml-2 text-yellow-400 font-bold tabular-nums">
                        {match.home_score} – {match.away_score}
                      </span>
                    )}
                  </div>
                </div>
                {!isEditing && !match.result_confirmed_at && new Date(match.kickoff_at) <= now && (
                  <button
                    onClick={() => startEdit(match)}
                    className="shrink-0 px-3 py-1.5 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-300 transition-colors"
                  >
                    Enter result
                  </button>
                )}
                {!isEditing && match.result_confirmed_at && (
                  <button
                    onClick={() => startEdit(match)}
                    className="shrink-0 px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditing && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={0} max={20} value={e.home}
                      onChange={(ev) => setEditing((p) => ({ ...p, [match.id]: { ...p[match.id], home: ev.target.value } }))}
                      className="w-16 text-center bg-gray-800 border border-gray-600 rounded-lg py-1.5 text-white text-lg font-bold focus:outline-none focus:border-yellow-400"
                      placeholder="0"
                    />
                    <span className="text-gray-500">–</span>
                    <input
                      type="number" min={0} max={20} value={e.away}
                      onChange={(ev) => setEditing((p) => ({ ...p, [match.id]: { ...p[match.id], away: ev.target.value } }))}
                      className="w-16 text-center bg-gray-800 border border-gray-600 rounded-lg py-1.5 text-white text-lg font-bold focus:outline-none focus:border-yellow-400"
                      placeholder="0"
                    />
                    {isKnockout && (
                      <select
                        value={e.winner}
                        onChange={(ev) => setEditing((p) => ({ ...p, [match.id]: { ...p[match.id], winner: ev.target.value } }))}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-400"
                      >
                        <option value="">Winner (AET/pen if needed)</option>
                        {match.home_team && <option value={match.home_team_id!}>{homeFlag} {homeName}</option>}
                        {match.away_team && <option value={match.away_team_id!}>{awayFlag} {awayName}</option>}
                      </select>
                    )}
                  </div>
                  {message[match.id] && (
                    <p className={`text-xs ${message[match.id].startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                      {message[match.id]}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing((p) => { const n = { ...p }; delete n[match.id]; return n })}
                      className="flex-1 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveResult(match)}
                      disabled={saving === match.id}
                      className="flex-1 py-1.5 rounded-lg bg-yellow-400 text-black font-medium text-sm hover:bg-yellow-300 transition-colors disabled:opacity-50"
                    >
                      {saving === match.id ? 'Saving…' : 'Save result'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            {filter === 'pending' ? 'No pending results — you\'re up to date!' : 'No matches found'}
          </p>
        )}
      </div>
    </div>
  )
}
