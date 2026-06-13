'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { Match, Team } from '@/types'

export default function AdminBracketPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [selections, setSelections] = useState<Record<string, { home: string; away: string }>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!loading && (!session || !session.is_admin)) router.replace('/')
  }, [session, loading, router])

  useEffect(() => {
    if (!session?.is_admin) return
    Promise.all([
      fetch('/api/matches').then((r) => r.json()),
    ]).then(([allMatches]: [Match[]]) => {
      const knockout = allMatches.filter((m: Match) => m.stage !== 'group')
      setKnockoutMatches(knockout)
      const tm: Record<string, Team> = {}
      for (const m of allMatches) {
        if (m.home_team) tm[m.home_team.id] = m.home_team
        if (m.away_team) tm[m.away_team.id] = m.away_team
      }
      setTeams(Object.values(tm))
      setLoadingData(false)
    })
  }, [session])

  async function save(matchId: string) {
    if (!session) return
    const s = selections[matchId]
    if (!s || (!s.home && !s.away)) return
    setSaving(matchId)
    const res = await fetch('/api/admin/bracket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-participant-token': session.auth_token },
      body: JSON.stringify({
        match_id: matchId,
        home_team_id: s.home || null,
        away_team_id: s.away || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessages((p) => ({ ...p, [matchId]: data.error }))
    } else {
      setKnockoutMatches((prev) => prev.map((m) => (m.id === matchId ? data : m)))
      setMessages((p) => ({ ...p, [matchId]: '✓ Updated' }))
      setTimeout(() => setMessages((p) => { const n = { ...p }; delete n[matchId]; return n }), 2000)
    }
    setSaving(null)
  }

  if (loading || !session?.is_admin) return null
  if (loadingData) return <div className="py-16 text-center text-gray-500 animate-pulse">Loading…</div>

  const stages = ['r32', 'r16', 'qf', 'sf', 'final']
  const stageLabel: Record<string, string> = { r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-Finals', sf: 'Semi-Finals', final: 'Final' }

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-bold">Bracket Slot Assignment</h1>
        <p className="text-gray-400 text-sm mt-1">
          After the group stage, assign the actual qualified teams to knockout match slots.
        </p>
      </div>

      {stages.map((stage) => {
        const stageMs = knockoutMatches.filter((m) => m.stage === stage)
        if (stageMs.length === 0) return null
        return (
          <section key={stage} className="space-y-3">
            <h2 className="text-lg font-semibold">{stageLabel[stage]}</h2>
            <div className="space-y-2">
              {stageMs.map((match) => {
                const s = selections[match.id] || { home: match.home_team_id ?? '', away: match.away_team_id ?? '' }
                return (
                  <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="text-xs text-gray-500">Match {match.match_number}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">{match.home_team_placeholder || 'Home team'}</label>
                        {match.home_team ? (
                          <p className="text-sm font-medium text-green-400">
                            ✓ {match.home_team.flag_emoji} {match.home_team.name}
                          </p>
                        ) : (
                          <select
                            value={s.home}
                            onChange={(e) => setSelections((p) => ({ ...p, [match.id]: { ...s, home: e.target.value } }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                          >
                            <option value="">— select team —</option>
                            {teams.map((t) => <option key={t.id} value={t.id}>{t.flag_emoji} {t.name}</option>)}
                          </select>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">{match.away_team_placeholder || 'Away team'}</label>
                        {match.away_team ? (
                          <p className="text-sm font-medium text-green-400">
                            ✓ {match.away_team.flag_emoji} {match.away_team.name}
                          </p>
                        ) : (
                          <select
                            value={s.away}
                            onChange={(e) => setSelections((p) => ({ ...p, [match.id]: { ...s, away: e.target.value } }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                          >
                            <option value="">— select team —</option>
                            {teams.map((t) => <option key={t.id} value={t.id}>{t.flag_emoji} {t.name}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                    {(!match.home_team || !match.away_team) && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => save(match.id)}
                          disabled={saving === match.id}
                          className="px-3 py-1.5 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-300 transition-colors disabled:opacity-50"
                        >
                          {saving === match.id ? 'Saving…' : 'Assign teams'}
                        </button>
                        {messages[match.id] && (
                          <span className={`text-xs ${messages[match.id].startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                            {messages[match.id]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
