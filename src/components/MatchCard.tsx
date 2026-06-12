'use client'

import { useState, useEffect } from 'react'
import type { Match, Tip, Session } from '@/types'
import { isMatchLocked, getRandomGroupTip, STAGE_POINTS, EXACT_SCORE_BONUS } from '@/lib/scoring'

interface Props {
  match: Match
  myTip?: Tip | null
  session: Session
  onTipSaved: (tip: Tip) => void
}

export default function MatchCard({ match, myTip, session, onTipSaved }: Props) {
  const locked = isMatchLocked(match)
  const finished = !!match.result_confirmed_at

  const [homeScore, setHomeScore] = useState<string>(
    myTip?.predicted_home_score?.toString() ?? ''
  )
  const [awayScore, setAwayScore] = useState<string>(
    myTip?.predicted_away_score?.toString() ?? ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const homeName = match.home_team?.name ?? match.home_team_placeholder ?? '?'
  const awayName = match.away_team?.name ?? match.away_team_placeholder ?? '?'
  const homeFlag = match.home_team?.flag_emoji ?? ''
  const awayFlag = match.away_team?.flag_emoji ?? ''

  function randomize() {
    const r = getRandomGroupTip()
    setHomeScore(r.home.toString())
    setAwayScore(r.away.toString())
  }

  function getUnderdogLabel(): string {
    // Basic: if home is a host or well-known team, away might be underdog
    // This is a UI hint only — not meaningful without real odds data
    return ''
  }

  async function handleSave() {
    if (locked) return
    const h = parseInt(homeScore)
    const a = parseInt(awayScore)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError('Enter valid scores (0 or more)')
      return
    }
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
          predicted_home_score: h,
          predicted_away_score: a,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save tip')
        return
      }
      onTipSaved(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const hasTip = myTip && myTip.predicted_home_score !== null

  // Calculate points earned
  let pointsEarned: number | null = null
  if (finished && hasTip && match.home_score !== null && match.away_score !== null) {
    const actualH = match.home_score
    const actualA = match.away_score
    const predH = myTip.predicted_home_score!
    const predA = myTip.predicted_away_score!
    const actualOut = actualH > actualA ? 'h' : actualH < actualA ? 'a' : 'd'
    const predOut = predH > predA ? 'h' : predH < predA ? 'a' : 'd'
    if (actualOut === predOut) {
      pointsEarned = STAGE_POINTS.group
      if (predH === actualH && predA === actualA) pointsEarned += EXACT_SCORE_BONUS
    } else {
      pointsEarned = 0
    }
  }

  const kickoff = new Date(match.kickoff_at)
  const kickoffStr = kickoff.toLocaleDateString('en-AU', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 space-y-3 ${finished ? 'border-gray-700' : locked ? 'border-gray-800' : 'border-gray-700'}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Group {match.group_id} · Match {match.match_number}</span>
        <span className="truncate text-right">{kickoffStr}</span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-2">
        <div className="flex-1 text-right">
          <span className="text-base font-semibold">{homeFlag} {homeName}</span>
        </div>

        {finished ? (
          <div className="text-2xl font-bold tabular-nums text-yellow-400 min-w-[4rem] text-center">
            {match.home_score} – {match.away_score}
          </div>
        ) : locked ? (
          <div className="text-sm text-orange-400 font-medium min-w-[4rem] text-center">LIVE</div>
        ) : (
          <div className="text-gray-500 text-sm font-medium min-w-[3rem] text-center">vs</div>
        )}

        <div className="flex-1">
          <span className="text-base font-semibold">{awayFlag} {awayName}</span>
        </div>
      </div>

      {/* Tip entry or result */}
      {!locked && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1 justify-end">
              <input
                type="number"
                min={0}
                max={20}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-12 text-center bg-gray-800 border border-gray-600 rounded-lg py-1.5 text-white text-lg font-bold focus:outline-none focus:border-yellow-400"
                placeholder="0"
              />
            </div>
            <span className="text-gray-600 font-bold">–</span>
            <div className="flex items-center gap-1 flex-1">
              <input
                type="number"
                min={0}
                max={20}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-12 text-center bg-gray-800 border border-gray-600 rounded-lg py-1.5 text-white text-lg font-bold focus:outline-none focus:border-yellow-400"
                placeholder="0"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={randomize}
              title="Pick for me"
              className="flex-1 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
            >
              🎲 Pick for me
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-yellow-400 text-black hover:bg-yellow-300'
              } disabled:opacity-50`}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : hasTip ? 'Update tip' : 'Save tip'}
            </button>
          </div>
        </div>
      )}

      {/* Locked but no result yet */}
      {locked && !finished && (
        <div className="flex items-center justify-between pt-1">
          {hasTip ? (
            <p className="text-sm text-gray-400">
              Your tip: <span className="text-white font-medium">{myTip.predicted_home_score} – {myTip.predicted_away_score}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-600">No tip submitted</p>
          )}
          <span className="text-xs bg-orange-900 text-orange-300 px-2 py-0.5 rounded-full">
            In progress
          </span>
        </div>
      )}

      {/* Finished */}
      {finished && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-800">
          {hasTip ? (
            <p className="text-sm text-gray-400">
              Your tip: <span className="text-white font-medium">{myTip.predicted_home_score} – {myTip.predicted_away_score}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-600">No tip submitted</p>
          )}
          {pointsEarned !== null && (
            <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
              pointsEarned > 0 ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'
            }`}>
              {pointsEarned > 0 ? `+${pointsEarned} pts` : '0 pts'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
