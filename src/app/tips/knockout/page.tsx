'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import KnockoutMatchCard from '@/components/KnockoutMatchCard'
import type { Match, Tip, Team } from '@/types'

const KNOCKOUT_STAGES = [
  { key: 'r32', label: 'Round of 32' },
  { key: 'r16', label: 'Round of 16' },
  { key: 'qf', label: 'Quarter-Finals' },
  { key: 'sf', label: 'Semi-Finals' },
  { key: 'final', label: 'Final' },
]

export default function KnockoutTipsPage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [tips, setTips] = useState<Record<string, Tip>>({})
  const [loadingData, setLoadingData] = useState(true)
  const [selectedStage, setSelectedStage] = useState('r32')

  useEffect(() => {
    if (!loading && !session) router.replace('/join')
  }, [session, loading, router])

  useEffect(() => {
    if (!session) return
    async function load() {
      const stagePromises = KNOCKOUT_STAGES.map((s) =>
        fetch(`/api/matches?stage=${s.key}`).then((r) => r.json())
      )
      const [tipsRes, ...allStages] = await Promise.all([
        fetch('/api/tips', { headers: { 'x-participant-token': session!.auth_token } }).then((r) => r.json()),
        ...stagePromises,
      ])

      const allMatches: Match[] = (allStages as Match[][]).flat()
      setMatches(allMatches)

      const teamMap: Record<string, Team> = {}
      for (const m of allMatches) {
        if (m.home_team) teamMap[m.home_team.id] = m.home_team
        if (m.away_team) teamMap[m.away_team.id] = m.away_team
      }
      setTeams(Object.values(teamMap))

      const tipMap: Record<string, Tip> = {}
      for (const t of tipsRes) tipMap[t.match_id] = t
      setTips(tipMap)
      setLoadingData(false)
    }
    load()
  }, [session])

  // Augment team list with group stage teams
  useEffect(() => {
    if (!session) return
    fetch('/api/matches?stage=group')
      .then((r) => r.json())
      .then((groupMatches: Match[]) => {
        const tm: Record<string, Team> = {}
        for (const m of groupMatches) {
          if (m.home_team) tm[m.home_team.id] = m.home_team
          if (m.away_team) tm[m.away_team.id] = m.away_team
        }
        setTeams((prev) => {
          const merged = { ...tm }
          for (const t of prev) merged[t.id] = t
          return Object.values(merged)
        })
      })
  }, [session])

  function handleTipSaved(tip: Tip) {
    setTips((prev) => ({ ...prev, [tip.match_id]: tip }))
  }

  function getEligibleTeams(match: Match): Team[] {
    if (match.home_team && match.away_team) return [match.home_team, match.away_team]
    return teams
  }

  if (loading || !session) return null
  if (loadingData) {
    return <div className="py-16 text-center text-ink-faint animate-pulse">Loading bracket…</div>
  }

  const stageMatches = matches.filter((m) => m.stage === selectedStage)
  const tippedCount = matches.filter((m) => tips[m.id]).length

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="font-serif text-3xl font-normal text-ink">Knockout Bracket</h1>
        <p className="text-ink-faint text-sm mt-0.5">{tippedCount}/{matches.length} knockout matches tipped</p>
        <p className="text-ink-faint text-xs mt-1">
          Tip any team — even before they're confirmed. Points awarded when results are in.
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {KNOCKOUT_STAGES.map((s) => {
          const stageMs = matches.filter((m) => m.stage === s.key)
          const tipped = stageMs.filter((m) => tips[m.id]).length
          return (
            <button
              key={s.key}
              onClick={() => setSelectedStage(s.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedStage === s.key
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-ink-muted hover:text-ink hover:bg-gray-700'
              }`}
            >
              {s.label}
              {stageMs.length > 0 && (
                <span className="ml-1.5 text-xs opacity-70">{tipped}/{stageMs.length}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {stageMatches.map((match) => (
          <KnockoutMatchCard
            key={match.id}
            match={match}
            myTip={tips[match.id] ?? null}
            eligibleTeams={getEligibleTeams(match)}
            session={session}
            onTipSaved={handleTipSaved}
          />
        ))}
      </div>

      {stageMatches.length === 0 && (
        <p className="text-ink-faint text-center py-8">No matches in this stage yet</p>
      )}
    </div>
  )
}
