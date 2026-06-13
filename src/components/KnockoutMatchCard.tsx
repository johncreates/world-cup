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

  // Underdog: team with fewest tips (we don't have stats here, just a label for unconfirmed teams)
  function getUnderdogTeam(): Team | null {
    // Simple heuristic: if one slot is a "small" confederation team, highlight it
    return null
  }

  async function handleSave() {
    if (locked || !winnerId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-participant-token': session.auth_token,
        },
        body: JSON.stringify({
          match_id: match.id,
          predicted_winner_id: winnerId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save')
        return
      }
      onTipSaved(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const hasTip = !!myTip?.predicted_winner_id
  const myTeam = eligibleTeams.find((t) => t.id === myTip?.predicted_winner_id)
  const actualWinnerTeam = match.winner_team

  let pointsEarned: number | null = null
  if (finished && hasTip) {
    pointsEarned = myTip!.predicted_winner_id === match.winner_team_id ? points : 0
  }

  const kickoff = new Date(match.kickoff_at)
  const kickoffStr = kickoff.toLocaleDateString('en-AU', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const stageLabel: Record<string, string> = {
    r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-Final',
    sf: 'Semi-Final', final: 'Final',
  }

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 space-y-3 ${
      finished ? 'border-gray-700' : locked ? 'border-gray-800' : 'border-gray-700'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{stageLabel[match.stage] || match.stage} · Match {match.match_number}</span>
        <span className="truncate text-right">{kickoffStr}</span>
      </div>

      {/* Teams */}
      <div className="text-sm text-gray-400 space-y-1">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block shrink-0" />
          <span>{homeFlag} {homeName}</span>
          {match.home_team_id && <span className="text-xs text-green-500 ml-auto">Confirmed</span>}
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-600 inline-block shrink-0" />
          <span>{awayFlag} {awayName}</span>
          {match.away_team_id && <span className="text-xs text-green-500 ml-auto">Confirmed</span>}
        </div>
      </div>

      {/* Result */}
      {finished && match.home_score !== null && (
        <div className="text-center text-2xl font-bold text-yellow-400">
          {match.home_score} – {match.away_score}
          {match.winner_team && (
            <div className="text-sm font-normal text-gray-400 mt-0.5">
              Winner: {match.winner_team.flag_emoji} {match.winner_team.name}
            </div>
          )}
        </div>
      )}

      {/* Tip entry */}
      {!locked && (
        <div className="space-y-2 pt-1">
          <label className="text-xs text-gray-500 font-medium">Pick the winner:</label>
          <select
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400"
          >
            <option value="">— choose a team —</option>
            {eligibleTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag_emoji} {t.name}
              </option>
            ))}
          </select>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={pickRandom}
              className="flex-1 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
            >
              🎲 Pick for me
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !winnerId}
              className={`flex-1 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                saved ? 'bg-green-600 text-white' : 'bg-yellow-400 text-black hover:bg-yellow-300'
              } disabled:opacity-50`}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : hasTip ? 'Update' : `Save (+${points}pts)`}
            </button>
          </div>
        </div>
      )}

      {/* Locked / result row */}
      {(locked || finished) && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-800 text-sm">
          {hasTip ? (
            <span className="text-gray-400">
              Your pick: <span className="text-white font-medium">
                {myTeam ? `${myTeam.flag_emoji} ${myTeam.name}` : 'Unknown team'}
              </span>
              {finished && actualWinnerTeam && myTip?.predicted_winner_id === match.winner_team_id && (
                <span className="ml-2 text-green-400">✓</span>
              )}
              {finished && actualWinnerTeam && myTip?.predicted_winner_id !== match.winner_team_id && (
                <span className="ml-2 text-red-400">✗</span>
              )}
            </span>
          ) : (
            <span className="text-gray-600">No tip</span>
          )}
          {pointsEarned !== null && (
            <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
              pointsEarned > 0 ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'
            }`}>
              {pointsEarned > 0 ? `+${pointsEarned} pts` : '0 pts'}
            </span>
          )}
          {!finished && locked && (
            <span className="text-xs bg-orange-900 text-orange-300 px-2 py-0.5 rounded-full">Live</span>
          )}
        </div>
      )}
    </div>
  )
}
