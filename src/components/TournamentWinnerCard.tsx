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

interface ConfirmModalProps {
  team: Team
  isUpdate: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({ team, isUpdate, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">{team.flag_emoji}</div>
          <h2 className="text-lg font-semibold text-ink">
            {isUpdate ? 'Change your pick?' : 'Lock in your pick?'}
          </h2>
        </div>
        <p className="text-ink-muted text-sm text-center">
          You&apos;re backing{' '}
          <span className="text-ink font-semibold">{team.name}</span> to win the World Cup.
        </p>
        {!isUpdate && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-amber-text space-y-1">
            <p className="font-semibold">⚠️ This locks your pick.</p>
            <p>
              You won&apos;t be able to change it unless{' '}
              <span className="font-semibold">{team.name}</span> are eliminated.
            </p>
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 text-ink-muted text-sm hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-semibold hover:bg-yellow-300 transition-colors"
          >
            {isUpdate ? 'Yes, change it' : 'Lock it in'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TournamentWinnerCard({ session, onWinnerSaved }: Props) {
  const [teams, setTeams] = useState<Team[]>([])
  const [currentWinner, setCurrentWinner] = useState<Team | null>(null)
  const [eliminated, setEliminated] = useState(false)
  const [allPicks, setAllPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [pendingTeam, setPendingTeam] = useState<Team | null>(null)

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
        setEliminated(winnerRes.eliminated ?? false)
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

  function handleLockInClick() {
    const team = teams.find((t) => t.id === selectedId)
    if (!team) return
    setPendingTeam(team)
  }

  async function confirmSave() {
    if (!pendingTeam) return
    setSaving(true)
    setError('')
    setPendingTeam(null)
    try {
      const res = await fetch('/api/tips/tournament-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-participant-token': session.auth_token },
        body: JSON.stringify({ team_id: pendingTeam.id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }
      setCurrentWinner(data.team)
      setEliminated(false)
      onWinnerSaved?.(data.team)
      await fetchAggregatePicks()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 animate-pulse h-28" />
  }

  const locked = !!currentWinner && !eliminated

  return (
    <>
      <div className="bg-gray-900 border border-yellow-400/30 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">🏆 Tournament Winner Pick</h2>
            <p className="text-ink-faint text-xs mt-0.5">
              Correct = +15 pts · Locked until your team is eliminated
            </p>
          </div>
          {currentWinner && (
            <div className="text-right shrink-0">
              <div className="text-3xl leading-none">{currentWinner.flag_emoji}</div>
              <div className="text-xs text-ink-faint mt-1 max-w-[80px] text-right leading-tight">
                {currentWinner.name}
              </div>
            </div>
          )}
        </div>

        {locked ? (
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
            <span className="text-lg">🔒</span>
            <div className="flex-1 min-w-0">
              <p className="text-ink text-sm font-medium">
                {currentWinner!.flag_emoji} {currentWinner!.name}
              </p>
              <p className="text-ink-faint text-xs">
                Locked in · unlocks if they&apos;re eliminated
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {eliminated && currentWinner && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-xs">
                {currentWinner.flag_emoji} {currentWinner.name} have been eliminated — update your pick.
              </div>
            )}
            <div className="flex gap-2">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-ink text-sm focus:outline-none focus:border-yellow-400 min-w-0"
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
                className="px-3 py-2 bg-gray-800 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-700 transition-colors"
              >
                🎲
              </button>
              <button
                onClick={handleLockInClick}
                disabled={!selectedId || saving}
                className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors shrink-0"
              >
                {saving ? 'Saving…' : eliminated ? 'Update' : 'Lock In'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-xs">{error}</p>}

        {allPicks.length > 0 && (
          <div className="border-t border-dashed border-gray-700 pt-3 space-y-2">
            <p className="text-xs text-ink-faint font-medium">How others picked</p>
            {allPicks.slice(0, 6).map((pick) => (
              <div key={pick.id} className="flex items-center gap-2">
                <span className="text-sm w-5 text-center shrink-0">{pick.flag_emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs text-ink-muted mb-0.5">
                    <span className="truncate">{pick.name}</span>
                    <span className="shrink-0 ml-2">{pick.count} · {pick.percentage}%</span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full">
                    <div
                      className="h-1 bg-yellow-400 rounded-full"
                      style={{ width: `${pick.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingTeam && (
        <ConfirmModal
          team={pendingTeam}
          isUpdate={!!currentWinner}
          onConfirm={confirmSave}
          onCancel={() => setPendingTeam(null)}
        />
      )}
    </>
  )
}
