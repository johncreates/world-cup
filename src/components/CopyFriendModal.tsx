'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@/types'

interface Participant {
  participant_id: string
  nickname: string
}

interface Props {
  session: Session
  onCopied: (count: number) => void
  onClose: () => void
}

export default function CopyFriendModal({ session, onCopied, onClose }: Props) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data: Participant[]) => {
        setParticipants((data ?? []).filter((p) => p.participant_id !== session.participant_id))
        setLoading(false)
      })
  }, [session])

  async function handleCopy() {
    if (!selectedId) return
    setCopying(true)
    setError('')
    try {
      const res = await fetch('/api/tips/copy-from', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-participant-token': session.auth_token },
        body: JSON.stringify({ source_participant_id: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to copy'); return }
      onCopied(data.copied ?? 0)
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Copy a Friend's Bracket</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors text-xl leading-none">✕</button>
        </div>
        <p className="text-ink-muted text-sm">
          Copies all their unlocked tips into your bracket. You can edit anything after.
        </p>
        {loading ? (
          <div className="text-ink-faint text-sm animate-pulse py-2">Loading…</div>
        ) : participants.length === 0 ? (
          <p className="text-ink-faint text-sm">No other participants yet.</p>
        ) : (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-ink text-sm focus:outline-none focus:border-yellow-400"
          >
            <option value="">— Select a friend —</option>
            {participants.map((p) => (
              <option key={p.participant_id} value={p.participant_id}>{p.nickname}</option>
            ))}
          </select>
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
            onClick={handleCopy}
            disabled={!selectedId || copying || loading}
            className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {copying ? 'Copying…' : 'Copy Tips'}
          </button>
        </div>
      </div>
    </div>
  )
}
