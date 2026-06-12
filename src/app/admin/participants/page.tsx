'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { Participant } from '@/types'

export default function ParticipantsPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!session || !session.is_admin)) router.replace('/')
  }, [session, loading, router])

  useEffect(() => {
    if (!session?.is_admin) return
    fetch('/api/leaderboard', { headers: { 'x-participant-token': session.auth_token } })
      .then((r) => r.json())
      .then((data) => {
        setParticipants(data)
        setLoadingData(false)
      })
  }, [session])

  if (loading || !session?.is_admin) return null
  if (loadingData) return <div className="py-16 text-center text-gray-500 animate-pulse">Loading…</div>

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-2xl font-bold">Participants ({participants.length})</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500">
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Nickname</th>
              <th className="text-right px-4 py-3">Points</th>
              <th className="text-right px-4 py-3">Tips</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => (
              <tr key={(p as any).participant_id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-500 text-sm">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{(p as any).nickname}</td>
                <td className="px-4 py-3 text-right text-yellow-400 font-bold">{(p as any).total_points}</td>
                <td className="px-4 py-3 text-right text-gray-500 text-sm">{(p as any).total_tips}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {participants.length === 0 && (
          <p className="text-gray-500 text-center py-8">No participants yet</p>
        )}
      </div>
    </div>
  )
}
