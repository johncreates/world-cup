'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import MatchCard from '@/components/MatchCard'
import TournamentWinnerCard from '@/components/TournamentWinnerCard'
import CopyFriendModal from '@/components/CopyFriendModal'
import ChampionPickerModal from '@/components/ChampionPickerModal'
import type { Match, Tip } from '@/types'
import { GROUPS } from '@/lib/fixtures/teams'

export default function GroupTipsPage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  const [matches, setMatches] = useState<Match[]>([])
  const [tips, setTips] = useState<Record<string, Tip>>({})
  const [loadingData, setLoadingData] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL')
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [showChampionModal, setShowChampionModal] = useState(false)
  const [copyNotice, setCopyNotice] = useState('')

  useEffect(() => {
    if (!loading && !session) router.replace('/join')
  }, [session, loading, router])

  const loadTips = useCallback(async () => {
    if (!session) return
    const res = await fetch('/api/tips', {
      headers: { 'x-participant-token': session.auth_token },
    })
    const data = await res.json()
    const tipMap: Record<string, Tip> = {}
    for (const t of data) tipMap[t.match_id] = t
    setTips(tipMap)
  }, [session])

  useEffect(() => {
    if (!session) return
    async function load() {
      const [matchesRes] = await Promise.all([fetch('/api/matches?stage=group'), loadTips()])
      setMatches(await matchesRes.json())
      setLoadingData(false)
    }
    load()
  }, [session, loadTips])

  function handleTipSaved(tip: Tip) {
    setTips((prev) => ({ ...prev, [tip.match_id]: tip }))
  }

  async function handleCopied(count: number) {
    setShowCopyModal(false)
    setCopyNotice(count > 0 ? `✓ Copied ${count} tips!` : 'No unlocked tips to copy.')
    setTimeout(() => setCopyNotice(''), 3000)
    await loadTips()
  }

  async function handleChampionSaved() {
    setShowChampionModal(false)
    setCopyNotice('✓ Bracket filled!')
    setTimeout(() => setCopyNotice(''), 3000)
    await loadTips()
  }

  if (loading || !session) return null
  if (loadingData) {
    return <div className="py-16 text-center text-ink-faint animate-pulse">Loading matches…</div>
  }

  const filteredMatches =
    selectedGroup === 'ALL' ? matches : matches.filter((m) => m.group_id === selectedGroup)
  const tippedCount = matches.filter((m) => tips[m.id]).length

  return (
    <div className="space-y-6 pt-4">
      <TournamentWinnerCard session={session} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl font-normal text-ink">Group Stage</h1>
          <p className="text-ink-faint text-sm mt-0.5">
            {tippedCount}/{matches.length} matches tipped
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowCopyModal(true)}
            className="px-3 py-2 bg-gray-800 text-ink-muted text-sm rounded-lg hover:bg-gray-700 hover:text-ink transition-colors"
          >
            👯 Copy a friend
          </button>
          <button
            onClick={() => setShowChampionModal(true)}
            className="px-3 py-2 bg-gray-800 text-ink-muted text-sm rounded-lg hover:bg-gray-700 hover:text-ink transition-colors"
          >
            🏆 Pick my champion
          </button>
        </div>
      </div>

      {copyNotice && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-green-700 text-sm">
          {copyNotice}
        </div>
      )}

      {/* Group filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {['ALL', ...GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedGroup === g
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-800 text-ink-muted hover:text-ink hover:bg-gray-700'
            }`}
          >
            {g === 'ALL' ? 'All Groups' : `Group ${g}`}
          </button>
        ))}
      </div>

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
        <p className="text-ink-faint text-center py-8">No matches found</p>
      )}

      {showCopyModal && (
        <CopyFriendModal
          session={session}
          onCopied={handleCopied}
          onClose={() => setShowCopyModal(false)}
        />
      )}
      {showChampionModal && (
        <ChampionPickerModal
          session={session}
          existingTips={tips}
          onSaved={handleChampionSaved}
          onClose={() => setShowChampionModal(false)}
        />
      )}
    </div>
  )
}
