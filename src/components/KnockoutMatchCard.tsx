'use client'

import { useState } from 'react'
import type { Match, Tip, Team, Session } from '@/types'
import { isMatchLocked, STAGE_POINTS } from '@/lib/scoring'

interface Props {
  match: Match
  myTip?: Tip | null
  eligibleTeams: Team[]
  session: Session
  onTipSaved: (tip: Tip) => void
}

export default function KnockoutMatchCard({ match, myTip, eligibleTeams, session, onTipSaved }: Props) {
  const locked = isMatchLocked(match)
  const finished = !!match.result_confirmed_at

  const [winnerId, setWinnerId] = useState<string>(myTip?.predicted_winner_id ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const homeName = match.home_team?.name ?? match.home_team_placeholder ?? '?'
  const awayName = match.away_team?.name ?? match.away_team_placeholder ?? '?'
  const homeFlag = match.home_team?.flag_emoji ?? ''
  const awayFlag = match.away_team?.flag_emoji ?? ''
  const points = STAGE_POINTS[match.stage]

  function pickRandom() {
    if (!eligibleTeams.length) return
    const t = eligibleTeams[Math.floor(Math.random() * eligibleTeams.length)]
    setWinnerId(t.id)
  }

  async function handleSave() {
    if (locked || !winnerId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-participant-token': session.auth_token },
        body: JSON.stringify({ match_id: match.id, predicted_winner_id: winnerId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }
      onTipSaved(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const hasTip = !!myTip?.predicted_winner_id
  const myTeam = eligibleTeams.find((t) => t.id === myTip?.predicted_winner_id)
  const pointsEarned = finished && hasTip
    ? (myTip!.predicted_winner_id === match.winner_team_id ? points : 0)
    : null

  const kickoff = new Date(match.kickoff_at)
  const kickoffStr = kickoff.toLocaleDateString('en-AU', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const stageLabel: Record<string, string> = {
    r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-Final', sf: 'Semi-Final', final: 'Final',
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-ink-faint">
        <span>{stageLabel[match.stage] || match.stage} · M{match.match_number}</span>
        <span className="truncate text-right ml-2">{kickoffStr}</span>
      </div>

      {/* Teams */}
      <div className="text-sm text-ink-muted space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <span className="text-ink">{homeFlag} {homeName}</span>
          {match.home_team_id && (
            <span className="text-xs text-green-700 ml-auto font-medium">Confirmed</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
          <span className="text-ink">{awayFlag} {awayName}</span>
          {match.away_team_id && (
            <span className="text-xs text-green-700 ml-auto font-medium">Confirmed</span>
          )}
        </div>
      </div>

      {/* Finished result */}
      {finished && match.home_score !== null && (
        <div className="text-center">
          <span className="text-2xl font-bold text-amber-text tabular-nums">
            {match.home_score} – {match.away_score}
          </span>
          {match.winner_team && (
            <div className="text-sm text-ink-muted mt-0.5">
              Winner: {match.winner_team.flag_emoji} {match.winner_team.name}
            </div>
          )}
        </div>
      )}

      {/* Tip entry */}
      {!locked && (
        <div className="space-y-2 pt-1">
          <label className="text-xs text-ink-faint font-medium">Pick the winner:</label>
          <select
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-ink text-sm focus:outline-none focus:border-yellow-400"
          >
            <option value="">— choose a team —</option>
            {eligibleTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag_emoji} {t.name}
              </option>
            ))}
          </select>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={pickRandom}
              className="flex-1 py-1.5 rounded-lg bg-gray-800 text-ink-muted text-sm hover:bg-gray-700 hover:text-ink transition-colors"
            >
              🎲 Pick for me
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !winnerId}
              className={`flex-1 py-1.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                saved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-400 text-black hover:bg-yellow-300'
              }`}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : hasTip ? 'Update' : `Save (+${points}pts)`}
            </button>
          </div>
        </div>
      )}

      {/* Locked / result row */}
      {(locked || finished) && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-700 text-sm">
          {hasTip ? (
            <span className="text-ink-muted">
              Your pick:{' '}
              <span className="text-ink font-medium">
                {myTeam ? `${myTeam.flag_emoji} ${myTeam.name}` : 'Unknown'}
              </span>
              {finished && myTip?.predicted_winner_id === match.winner_team_id && (
                <span className="ml-1.5 text-green-700">✓</span>
              )}
              {finished && match.result_confirmed_at && myTip?.predicted_winner_id !== match.winner_team_id && (
                <span className="ml-1.5 text-red-600">✗</span>
              )}
            </span>
          ) : (
            <span className="text-ink-faint">No tip</span>
          )}
          {pointsEarned !== null && (
            <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
              pointsEarned > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-800 text-ink-faint'
            }`}>
              {pointsEarned > 0 ? `+${pointsEarned} pts` : '0 pts'}
            </span>
          )}
          {!finished && locked && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              Live
            </span>
          )}
        </div>
      )}
    </div>
  )
}
