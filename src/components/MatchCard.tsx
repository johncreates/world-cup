'use client'

import { useState } from 'react'
import type { Match, Tip, Session, Outcome } from '@/types'
import { isMatchLocked, STAGE_POINTS, getRandomOutcome, outcomeLabel, getActualOutcome } from '@/lib/scoring'

interface Props {
  match: Match
  myTip?: Tip | null
  session: Session
  onTipSaved: (tip: Tip) => void
  highlighted?: boolean
}

const OUTCOMES: Outcome[] = ['home', 'draw', 'away']

export default function MatchCard({ match, myTip, session, onTipSaved, highlighted }: Props) {
  const locked = isMatchLocked(match)
  const finished = !!match.result_confirmed_at
  const actualOutcome = finished ? getActualOutcome(match) : null

  const [selected, setSelected] = useState<Outcome | null>(myTip?.predicted_outcome ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const homeName = match.home_team?.name ?? match.home_team_placeholder ?? '?'
  const awayName = match.away_team?.name ?? match.away_team_placeholder ?? '?'
  const homeFlag = match.home_team?.flag_emoji ?? ''
  const awayFlag = match.away_team?.flag_emoji ?? ''

  const labels: Record<Outcome, string> = {
    home: homeName,
    draw: 'Draw',
    away: awayName,
  }

  function pickRandom() {
    setSelected(getRandomOutcome())
  }

  async function handleSave(outcome: Outcome) {
    if (locked) return
    setSelected(outcome)
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-participant-token': session.auth_token },
        body: JSON.stringify({ match_id: match.id, predicted_outcome: outcome }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }
      onTipSaved(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally {
      setSaving(false)
    }
  }

  const correct = finished && myTip?.predicted_outcome === actualOutcome
  const pointsEarned = finished && myTip?.predicted_outcome
    ? (myTip.predicted_outcome === actualOutcome ? STAGE_POINTS.group : 0)
    : null

  const kickoff = new Date(match.kickoff_at)
  const kickoffStr = kickoff.toLocaleDateString('en-AU', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 space-y-3 transition-colors ${
      highlighted ? 'border-yellow-500' : finished ? 'border-gray-700' : locked ? 'border-gray-800' : 'border-gray-700'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Group {match.group_id} · M{match.match_number}</span>
        <span className="truncate text-right ml-2">{kickoffStr}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold flex-1 text-right">{homeFlag} {homeName}</span>
        {finished ? (
          <span className="text-xl font-bold text-yellow-400 tabular-nums shrink-0">
            {match.home_score}–{match.away_score}
          </span>
        ) : locked ? (
          <span className="text-xs text-orange-400 font-medium shrink-0">LIVE</span>
        ) : (
          <span className="text-gray-600 text-xs shrink-0">vs</span>
        )}
        <span className="text-sm font-semibold flex-1">{awayFlag} {awayName}</span>
      </div>

      {/* Outcome buttons */}
      {!locked && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            {OUTCOMES.map((outcome) => (
              <button
                key={outcome}
                onClick={() => handleSave(outcome)}
                disabled={saving}
                className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors truncate ${
                  selected === outcome
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                } disabled:opacity-50`}
                title={labels[outcome]}
              >
                {outcome === 'draw' ? 'Draw' : (
                  <span>{outcome === 'home' ? homeFlag : awayFlag} {labels[outcome]}</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={pickRandom}
            className="w-full py-1.5 rounded-lg bg-gray-800 text-gray-400 text-xs hover:bg-gray-700 transition-colors"
          >
            🎲 Pick for me
          </button>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          {saved && <p className="text-green-400 text-xs text-center">✓ Saved</p>}
        </div>
      )}

      {/* Result row */}
      {(locked || finished) && (
        <div className="flex items-center justify-between text-sm border-t border-gray-800 pt-2">
          {myTip?.predicted_outcome ? (
            <span className="text-gray-400">
              You picked: <span className={`font-medium ${correct ? 'text-green-400' : finished ? 'text-red-400' : 'text-white'}`}>
                {labels[myTip.predicted_outcome]}
                {finished && (correct ? ' ✓' : ' ✗')}
              </span>
            </span>
          ) : (
            <span className="text-gray-600 text-xs">No tip</span>
          )}
          {pointsEarned !== null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              pointsEarned > 0 ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'
            }`}>
              {pointsEarned > 0 ? `+${pointsEarned} pt` : '0 pt'}
            </span>
          )}
          {!finished && locked && (
            <span className="text-xs bg-orange-900 text-orange-300 px-2 py-0.5 rounded-full">In progress</span>
          )}
        </div>
      )}
    </div>
  )
}
