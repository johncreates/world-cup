'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import MatchCard from '@/components/MatchCard'
import type { Match, Tip } from '@/types'
import { GROUPS } from '@/lib/fixtures/teams'

export default function GroupTipsPage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  const [matches, setMatches] = useState<Match[]>([])
  const [tips, setTips] = useState<Record<string, Tip>>({})
  const [loadingData, setLoadingData] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL')

  useEffect(() => {
    if (!loading && !session) router.replace('/join')
  }, [session, loading, router])

  useEffect(() => {
    if (!session) return
    async function load() {
      const [matchesRes, tipsRes] = await Promise.all([
        fetch('/api/matches?stage=group'),
        fetch('/api/tips', { headers: { 'x-participant-token': session!.auth_token } }),
      ])
      const matchesData = await matchesRes.json()
      const tipsData = await tipsRes.json()
      setMatches(matchesData)
      const tipMap: Record<string, Tip> = {}
      for (const t of tipsData) tipMap[t.match_id] = t
      setTips(tipMap)
      setLoadingData(false)
    }
    load()
  }, [session])

  function handleTipSaved(tip: Tip) {
    setTips((prev) => ({ ...prev, [tip.match_id]: tip }))
  }

  if (loading || !session) return null
  if (loadingData) {
    return (
      <div className="py-16 text-center text-gray-500 animate-pulse">Loading matches…</div>
    )
  }

  const filteredMatches =
    selectedGroup === 'ALL' ? matches : matches.filter((m) => m.group_id === selectedGroup)

  const tippedCount = matches.filter((m) => tips[m.id]).length
  const totalCount = matches.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Group Stage</h1>
          <p className="text-gray-400 text-sm mt-0.5">{tippedCount}/{totalCount} matches tipped</p>
        </div>
      </div>

      {/* Group filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {['ALL', ...GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedGroup === g
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {g === 'ALL' ? 'All Groups' : `Group ${g}`}
          </button>
        ))}
      </div>

      {/* Match cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            myTip={tips[match.id] ?? null}
            session={session}
            onTipSaved={handleTipSaved}
          />
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <p className="text-gray-500 text-center py-8">No matches found</p>
      )}
    </div>
  )
}
