'use client'

import { useEffect, useState } from 'react'
import type { Match, Tip, Team, Session } from '@/types'
import { fillBracketForChampion } from '@/lib/champion-fill'

interface Props {
  session: Session
  existingTips: Record<string, Tip>
  onSaved: () => void
  onClose: () => void
}

export default function ChampionPickerModal({ session, existingTips, onSaved, onClose }: Props) {
  const [teams, setTeams] = useState<Team[]>([])
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [teamsData, matchStages] = await Promise.all([
        fetch('/api/teams').then((r) => r.json()),
        Promise.all(
          ['group', 'r32', 'r16', 'qf', 'sf', 'final'].map((s) =>
            fetch(`/api/matches?stage=${s}`).then((r) => r.json())
          )
        ),
      ])
      setTeams(teamsData ?? [])
      setAllMatches((matchStages as Match[][]).flat())
      setLoading(false)
    }
    load()
  }, [])

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const preview = selectedTeamId ? fillBracketForChampion(selectedTeamId, allMatches, existingTips) : []
  const groupCount = preview.filter((p) => allMatches.find((m) => m.id === p.match_id)?.stage === 'group').length
  const knockoutCount = preview.filter((p) => allMatches.find((m) => m.id === p.match_id)?.stage !== 'group').length

  async function handleSave() {
    if (!selectedTeamId || !preview.length) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/tips/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-participant-token': session.auth_token },
        body: JSON.stringify({ tips: preview }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Pick Your Champion</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors text-xl leading-none">✕</button>
        </div>
        <p className="text-ink-muted text-sm">
          Choose a team to win it all. We'll fill your bracket with their path and randomize the rest.
        </p>
        {loading ? (
          <div className="text-ink-faint text-sm animate-pulse py-2">Loading teams…</div>
        ) : (
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:border-yellow-400"
          >
            <option value="">— Select a team —</option>
            {[...teams].sort((a, b) => a.name.localeCompare(b.name)).map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag_emoji} {t.name} (Group {t.group_id})
              </option>
            ))}
          </select>
        )}
        {selectedTeam && preview.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-4 space-y-1.5 text-sm">
            <p className="text-xs text-ink-faint font-medium uppercase tracking-wide mb-2">What we'll fill in</p>
            <p className="text-ink">
              {selectedTeam.flag_emoji}{' '}
              <span className="font-semibold">{selectedTeam.name}</span> wins all {knockoutCount} knockout stages
            </p>
            <p className="text-ink-muted">{groupCount} group matches auto-filled</p>
            <p className="text-amber-text text-xs mt-2">You can tweak any tip afterwards</p>
          </div>
        )}
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 text-ink-muted text-sm hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedTeamId || !preview.length || saving || loading}
            className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Fill Bracket'}
          </button>
        </div>
      </div>
    </div>
  )
}
