'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { TipsterProfile } from '@/types'

interface Props {
  params: { participantId: string }
}

function TitleBadge({ title }: { title: string }) {
  const colours: Record<string, string> = {
    'The Chaos Agent': 'bg-red-900/50 text-red-300 border-red-700',
    'The Safe Bettor': 'bg-blue-900/50 text-blue-300 border-blue-700',
    'The Romantic Underdog': 'bg-pink-900/50 text-pink-300 border-pink-700',
    'The Contrarian': 'bg-purple-900/50 text-purple-300 border-purple-700',
    'The Calculated Risk-Taker': 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    'The Newcomer': 'bg-gray-800 text-gray-400 border-gray-700',
  }
  return (
    <span
      className={`inline-block border rounded-full px-3 py-1 text-sm font-medium ${colours[title] ?? colours['The Newcomer']}`}
    >
      {title}
    </span>
  )
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
        const data = await r.json()
        setProfile(data)
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 animate-pulse">Loading profile…</div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400">Profile not found</p>
          <Link href="/" className="text-yellow-400 hover:underline text-sm">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  const tippedPct =
    profile.total_matches > 0
      ? Math.round((profile.total_tips / profile.total_matches) * 100)
      : 0

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Main card */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
          {/* Header stripe */}
          <div className="bg-gradient-to-r from-yellow-600/30 to-transparent px-6 py-5 border-b border-gray-800">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-1">
              World Cup 2026 · Tipster Profile
            </p>
            <h1 className="text-2xl font-bold text-white">{profile.nickname}</h1>
            {profile.leaderboard_rank > 0 && (
              <p className="text-gray-400 text-sm mt-0.5">
                Rank #{profile.leaderboard_rank}
              </p>
            )}
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Tipster Style</p>
              <TitleBadge title={profile.title} />
            </div>

            {/* Tournament winner */}
            {profile.tournament_winner ? (
              <div className="flex items-center gap-3">
                <div className="text-4xl leading-none">{profile.tournament_winner.flag_emoji}</div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Backing</p>
                  <p className="text-white font-semibold">{profile.tournament_winner.name}</p>
                  <p className="text-xs text-gray-500">to lift the trophy</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No tournament winner pick yet</p>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-white">{profile.total_tips}</div>
                <div className="text-xs text-gray-500 mt-0.5">Tips</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-white">{profile.max_possible_points}</div>
                <div className="text-xs text-gray-500 mt-0.5">Max pts</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-white">{profile.boldness_score}%</div>
                <div className="text-xs text-gray-500 mt-0.5">Boldness</div>
              </div>
            </div>

            {tippedPct < 100 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Bracket filled</span>
                  <span>{profile.total_tips}/{profile.total_matches} matches</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full">
                  <div
                    className="h-1.5 bg-yellow-400 rounded-full transition-all"
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
            className="flex-1 py-3 bg-gray-800 text-gray-300 text-sm rounded-xl hover:bg-gray-700 transition-colors"
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
    </div>
  )
}
