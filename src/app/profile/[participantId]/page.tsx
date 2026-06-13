'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { TipsterProfile } from '@/types'

interface Props {
  params: { participantId: string }
}

const TITLE_STYLES: Record<string, string> = {
  'The Chaos Agent': 'text-red-700 bg-red-50 border-red-200',
  'The Safe Bettor': 'text-blue-700 bg-blue-50 border-blue-200',
  'The Romantic Underdog': 'text-pink-700 bg-pink-50 border-pink-200',
  'The Contrarian': 'text-purple-700 bg-purple-50 border-purple-200',
  'The Calculated Risk-Taker': 'text-amber-text bg-yellow-50 border-yellow-200',
  'The Newcomer': 'text-ink-muted bg-gray-800 border-gray-700',
}

export default function ProfilePage({ params }: Props) {
  const [profile, setProfile] = useState<TipsterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/profile/${params.participantId}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return }
        setProfile(await r.json())
        setLoading(false)
      })
      .catch(() => { setLoading(false); setNotFound(true) })
  }, [params.participantId])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-ink-faint animate-pulse">Loading profile…</div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-ink-muted">Profile not found</p>
          <Link href="/" className="text-amber-text hover:underline text-sm">Back to home</Link>
        </div>
      </div>
    )
  }

  const tippedPct = profile.total_matches > 0
    ? Math.round((profile.total_tips / profile.total_matches) * 100)
    : 0

  const titleStyle = TITLE_STYLES[profile.title] ?? TITLE_STYLES['The Newcomer']

  return (
    <div className="py-8 space-y-4 max-w-sm mx-auto">
      {/* Main card */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-dashed border-gray-700">
          <p className="text-xs text-ink-faint font-medium uppercase tracking-widest mb-1">
            World Cup 2026 · Tipster
          </p>
          <h1 className="font-serif text-3xl font-normal text-ink">{profile.nickname}</h1>
          {profile.leaderboard_rank > 0 && (
            <p className="text-ink-muted text-sm mt-0.5">Rank #{profile.leaderboard_rank}</p>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Title badge */}
          <div className="space-y-1.5">
            <p className="text-xs text-ink-faint uppercase tracking-wide">Tipster Style</p>
            <span className={`inline-block border rounded-full px-3 py-1 text-sm font-medium ${titleStyle}`}>
              {profile.title}
            </span>
          </div>

          {/* Tournament winner */}
          {profile.tournament_winner ? (
            <div className="flex items-center gap-3">
              <div className="text-4xl leading-none">{profile.tournament_winner.flag_emoji}</div>
              <div>
                <p className="text-xs text-ink-faint uppercase tracking-wide">Backing</p>
                <p className="text-ink font-semibold">{profile.tournament_winner.name}</p>
                <p className="text-xs text-ink-faint">to lift the trophy</p>
              </div>
            </div>
          ) : (
            <p className="text-ink-faint text-sm">No tournament winner pick yet</p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-ink">{profile.total_tips}</div>
              <div className="text-xs text-ink-faint mt-0.5">Tips</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-ink">{profile.max_possible_points}</div>
              <div className="text-xs text-ink-faint mt-0.5">Max pts</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-ink">{profile.boldness_score}%</div>
              <div className="text-xs text-ink-faint mt-0.5">Boldness</div>
            </div>
          </div>

          {/* Bracket fill progress */}
          {tippedPct < 100 && (
            <div>
              <div className="flex justify-between text-xs text-ink-faint mb-1">
                <span>Bracket filled</span>
                <span>{profile.total_tips}/{profile.total_matches} matches</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full">
                <div
                  className="h-1.5 bg-yellow-400 rounded-full"
                  style={{ width: `${tippedPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={copyLink}
          className="flex-1 py-3 bg-gray-900 border border-gray-700 text-ink-muted text-sm rounded-xl hover:bg-gray-800 transition-colors"
        >
          {copied ? '✓ Copied!' : '🔗 Copy link'}
        </button>
        <Link
          href="/tips/group"
          className="flex-1 py-3 bg-yellow-400 text-black text-sm font-semibold rounded-xl hover:bg-yellow-300 transition-colors text-center"
        >
          My Tips
        </Link>
      </div>
    </div>
  )
}
