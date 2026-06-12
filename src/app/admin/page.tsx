'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function AdminPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [invites, setInvites] = useState<{ code: string; invite_url: string; use_count: number; is_active: boolean }[]>([])
  const [generating, setGenerating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!loading && (!session || !session.is_admin)) router.replace('/')
  }, [session, loading, router])

  useEffect(() => {
    if (!session?.is_admin) return
    fetch('/api/admin/invite', { headers: { 'x-participant-token': session.auth_token } })
      .then((r) => r.json())
      .then(setInvites)
  }, [session])

  async function generateInvite() {
    if (!session) return
    setGenerating(true)
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-participant-token': session.auth_token },
      body: JSON.stringify({ is_multi_use: true }),
    })
    const data = await res.json()
    setInvites((prev) => [data, ...prev])
    setGenerating(false)
  }

  async function runSeed() {
    if (!session) return
    setSeeding(true)
    setSeedResult('')
    const res = await fetch('/api/admin/seed', {
      method: 'POST',
      headers: { 'x-participant-token': session.auth_token },
    })
    const data = await res.json()
    setSeedResult(data.error ? `Error: ${data.error}` : `Seeded ${data.teams} teams + ${data.matches} matches`)
    setSeeding(false)
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(''), 2000)
  }

  if (loading || !session?.is_admin) return null

  return (
    <div className="space-y-8 py-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <nav className="flex gap-3 flex-wrap">
        <Link href="/admin/results" className="px-4 py-2 bg-yellow-400 text-black rounded-xl font-medium text-sm hover:bg-yellow-300 transition-colors">
          Enter Results
        </Link>
        <Link href="/admin/bracket" className="px-4 py-2 bg-gray-800 text-white rounded-xl font-medium text-sm hover:bg-gray-700 transition-colors">
          Bracket Slots
        </Link>
        <Link href="/admin/participants" className="px-4 py-2 bg-gray-800 text-white rounded-xl font-medium text-sm hover:bg-gray-700 transition-colors">
          Participants
        </Link>
      </nav>

      {/* Seed data */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold">Database Seed</h2>
        <p className="text-gray-400 text-sm">
          Run once after deploying to populate teams and all 104 match fixtures.
        </p>
        <button
          onClick={runSeed}
          disabled={seeding}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {seeding ? 'Seeding…' : 'Seed Database'}
        </button>
        {seedResult && (
          <p className={`text-sm ${seedResult.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {seedResult}
          </p>
        )}
      </section>

      {/* Invite codes */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Invite Links</h2>
          <button
            onClick={generateInvite}
            disabled={generating}
            className="px-3 py-1.5 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-300 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating…' : '+ New invite'}
          </button>
        </div>

        {invites.length === 0 ? (
          <p className="text-gray-500 text-sm">No invite codes yet — generate one above.</p>
        ) : (
          <div className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.code} className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2">
                <code className="text-yellow-400 text-sm font-mono flex-1 truncate">{inv.invite_url}</code>
                <span className="text-gray-500 text-xs shrink-0">{inv.use_count} joined</span>
                <button
                  onClick={() => copyUrl(inv.invite_url)}
                  className="text-xs text-gray-400 hover:text-white shrink-0 transition-colors"
                >
                  {copied === inv.invite_url ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
