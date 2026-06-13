'use client'

import { useEffect, useState } from 'react'
import type { Team, Session } from '@/types'

interface Pick {
  id: string
  name: string
  flag_emoji: string
  count: number
  percentage: number
}

interface Props {
  session: Session
  onWinnerSaved?: (team: Team | null) => void
}

export default function TournamentWinnerCard({ session, onWinnerSaved }: Props) {
  const [teams, setTeams] = useState<Team[]>([])
  const [currentWinner, setCurrentWinner] = useState<Team | null>(null)
  const [allPicks, setAllPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState('')

  async function fetchAggregatePicks() {
    const res = await fetch('/api/tips/tournament-winner/all', {
      headers: { 'x-participant-token': session.auth_token },
    })
    const data = await res.json()
    if (!data.locked && data.picks) setAllPicks(data.picks)
  }

  useEffect(() => {
    async function load() {
      const [teamsRes, winnerRes] = await Promise.all([
        fetch('/api/teams').then((r) => r.json()),
        fetch('/api/tips/tournament-winner', {
          headers: { 'x-participant-token': session.auth_token },
        }).then((r) => r.json()),
      ])
      setTeams(teamsRes ?? [])
      if (winnerRes.team) {
        setCurrentWinner(winnerRes.team)
        setSelectedId(winnerRes.team.id)
        await fetchAggregatePicks()
      }
      setLoading(false)
    }
    load()
  }, [session])

  function pickRandom() {
    if (!teams.length) return
    const team = teams[Math.floor(Math.random() * teams.length)]
    setSelectedId(team.id)
  }

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/tips/tournament-winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-participant-token': session.auth_token,
        },
        body: JSON.stringify({ team_id: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save')
        return
      }
      setCurrentWinner(data.team)
      onWinnerSaved?.(data.team)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      await fetchAggregatePicks()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 animate-pulse h-28" />
    )
  }

  return (
    <div className="bg-gradient-to-br from-yellow-900/20 to-gray-900 border border-yellow-700/40 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-yellow-400 flex items-center gap-1.5">
            🏆 Tournament Winner Pick
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
            Correct = +15 pts · Locked at tournament start
          </p>
        </div>
        {currentWinner && (
          <div className="text-right shrink-0">
            <div className="text-3xl leading-none">{currentWinner.flag_emoji}</div>
            <div className="text-xs text-gray-400 mt-1 max-w-[80px] text-right">{currentWinner.name}</div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 min-w-0"
        >
          <option value="">— Pick a team —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.flag_emoji} {t.name} (Group {t.group_id})
            </option>
          ))}
        </select>
        <button
          onClick={pickRandom}
          title="Pick for me"
          className="px-3 py-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        >
          🎲
        </button>
        <button
          onClick={handleSave}
          disabled={!selectedId || saving}
          className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors shrink-0"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : currentWinner ? 'Update' : 'Lock In'}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {allPicks.length > 0 && (
        <div className="border-t border-gray-800 pt-3 space-y-2">
          <p className="text-xs text-gray-500 font-medium">How others picked</p>
          {allPicks.slice(0, 6).map((pick) => (
            <div key={pick.id} className="flex items-center gap-2">
              <span className="text-sm w-5 text-center shrink-0">{pick.flag_emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                  <span className="truncate">{pick.name}</span>
                  <span className="shrink-0 ml-2">
                    {pick.count} · {pick.percentage}%
                  </span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full">
                  <div
                    className="h-1 bg-yellow-500 rounded-full"
                    style={{ width: `${pick.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
