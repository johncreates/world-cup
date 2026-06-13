'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Top3Picker from '@/components/Top3Picker'
import GroupWinnerPicker from '@/components/GroupWinnerPicker'
import { autoPickTop3, autoPickGroupWinners } from '@/lib/auto-pick'
import type { Team } from '@/types'

type Mode = 'manual' | 'hybrid' | 'auto'

const STEPS = {
  mode: 0,
  top3: 1,
  groups: 2,
  confirm: 3,
}

export default function OnboardingPage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [alreadyDone, setAlreadyDone] = useState(false)

  const [mode, setMode] = useState<Mode | null>(null)
  const [step, setStep] = useState(STEPS.mode)

  const [pick1Id, setPick1Id] = useState('')
  const [pick2Id, setPick2Id] = useState('')
  const [pick3Id, setPick3Id] = useState('')
  const [groupPicks, setGroupPicks] = useState<Record<string, string>>({})

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !session) router.replace('/join')
  }, [session, loading, router])

  useEffect(() => {
    if (!session) return
    async function load() {
      const [teamsData, picksData] = await Promise.all([
        fetch('/api/teams').then((r) => r.json()),
        fetch('/api/picks/top3', { headers: { 'x-participant-token': session!.auth_token } }).then((r) => r.json()),
      ])
      setTeams(teamsData ?? [])
      if (picksData.picks_completed) {
        setAlreadyDone(true)
      } else if (picksData.pick_1st) {
        setPick1Id(picksData.pick_1st.id)
        setPick2Id(picksData.pick_2nd?.id ?? '')
        setPick3Id(picksData.pick_3rd?.id ?? '')
      }
      setLoadingTeams(false)
    }
    load()
  }, [session])

  function selectMode(m: Mode) {
    setMode(m)
    if (m === 'auto') {
      const top3 = autoPickTop3(teams)
      setPick1Id(top3.pick_1st_id)
      setPick2Id(top3.pick_2nd_id)
      setPick3Id(top3.pick_3rd_id)
      const gw = autoPickGroupWinners(teams)
      setGroupPicks(gw)
    }
    setStep(STEPS.top3)
  }

  function handleTop3Continue() {
    if (!pick1Id || !pick2Id || !pick3Id) return
    if (mode === 'manual') {
      setStep(STEPS.groups)
    } else {
      if (mode === 'hybrid') {
        const gw = autoPickGroupWinners(teams)
        setGroupPicks(gw)
      }
      setStep(STEPS.confirm)
    }
  }

  async function handleSave() {
    if (!session) return
    setSaving(true)
    setError('')
    try {
      const top3Res = await fetch('/api/picks/top3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-participant-token': session.auth_token },
        body: JSON.stringify({ pick_1st_id: pick1Id, pick_2nd_id: pick2Id, pick_3rd_id: pick3Id }),
      })
      if (!top3Res.ok) {
        const d = await top3Res.json()
        setError(d.error || 'Failed to save picks')
        return
      }

      const gwRes = await fetch('/api/picks/group-winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-participant-token': session.auth_token },
        body: JSON.stringify({ picks: groupPicks, complete: true }),
      })
      if (!gwRes.ok) {
        const d = await gwRes.json()
        setError(d.error || 'Failed to save group picks')
        return
      }

      router.push('/tips/group')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !session || loadingTeams) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-ink-faint animate-pulse">Loading…</div>
      </div>
    )
  }

  async function handleReset() {
    if (!session) return
    await fetch('/api/picks/reset', {
      method: 'POST',
      headers: { 'x-participant-token': session.auth_token },
    })
    setAlreadyDone(false)
    setPick1Id('')
    setPick2Id('')
    setPick3Id('')
    setGroupPicks({})
    setStep(STEPS.mode)
    setMode(null)
  }

  if (alreadyDone) {
    return (
      <div className="py-12 max-w-sm mx-auto text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h1 className="font-serif text-2xl text-ink">You're all set!</h1>
        <p className="text-ink-muted text-sm">Your picks are locked in. Good luck!</p>
        <button
          onClick={() => router.push('/tips/group')}
          className="inline-block px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-300 transition-colors"
        >
          View My Tips →
        </button>
        <div className="pt-4">
          <button
            onClick={handleReset}
            className="text-xs text-ink-faint hover:text-red-500 transition-colors"
          >
            Reset picks and start over
          </button>
        </div>
      </div>
    )
  }

  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))
  const t1 = teamById[pick1Id]
  const t2 = teamById[pick2Id]
  const t3 = teamById[pick3Id]
  const groupsPickedCount = Object.keys(groupPicks).length

  return (
    <div className="py-8 max-w-sm mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-ink-faint font-medium uppercase tracking-widest mb-1">World Cup 2026</p>
        <h1 className="font-serif text-3xl font-normal text-ink">Make Your Picks</h1>
        <p className="text-ink-muted text-sm mt-1">
          Pick your top 3 and group winners — earn points as your teams play.
        </p>
      </div>

      {/* Scoring explainer */}
      {step === STEPS.mode && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
          <h2 className="font-serif text-lg text-ink">How it works</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-dashed border-gray-700">
              <span className="text-ink-muted">Your picked team wins a match</span>
              <span className="text-amber-text font-semibold">+3 pts</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dashed border-gray-700">
              <span className="text-ink-muted">Your picked team draws</span>
              <span className="text-amber-text font-semibold">+1 pt</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dashed border-gray-700">
              <span className="text-ink-muted">Correct champion (1st place)</span>
              <span className="text-amber-text font-semibold">+100 pts</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-ink-muted">Correct runner-up (2nd place)</span>
              <span className="text-amber-text font-semibold">+25 pts</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-700 pt-4 space-y-2">
            <p className="text-xs text-ink-faint font-medium uppercase tracking-wide mb-3">How do you want to pick?</p>
            {([
              ['manual', '✏️ Pick everything myself', 'Choose top 3 + group winners by hand'],
              ['hybrid', '⚡ Pick my top 3, fill the rest', 'You choose the top 3, we randomise group winners'],
              ['auto', '🎲 Fill everything for me', 'We pick top 3 and group winners — just here for the ride'],
            ] as const).map(([m, title, desc]) => (
              <button
                key={m}
                onClick={() => selectMode(m)}
                className="w-full text-left px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors group"
              >
                <div className="text-sm font-semibold text-ink">{title}</div>
                <div className="text-xs text-ink-faint mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Top 3 */}
      {step === STEPS.top3 && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-5">
          <div>
            <h2 className="font-serif text-xl text-ink">Your Top 3</h2>
            <p className="text-ink-faint text-xs mt-0.5">Pick the teams you think will finish 1st, 2nd, and 3rd.</p>
          </div>

          <Top3Picker
            teams={teams}
            pick1Id={pick1Id}
            pick2Id={pick2Id}
            pick3Id={pick3Id}
            onChange={({ pick1Id: p1, pick2Id: p2, pick3Id: p3 }) => {
              setPick1Id(p1)
              setPick2Id(p2)
              setPick3Id(p3)
            }}
          />

          <button
            onClick={() => {
              const top3 = autoPickTop3(teams)
              setPick1Id(top3.pick_1st_id)
              setPick2Id(top3.pick_2nd_id)
              setPick3Id(top3.pick_3rd_id)
            }}
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            🎲 Randomise for me
          </button>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setStep(STEPS.mode)}
              className="px-4 py-2.5 rounded-xl bg-gray-800 text-ink-muted text-sm hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleTop3Continue}
              disabled={!pick1Id || !pick2Id || !pick3Id}
              className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {mode === 'manual' ? 'Next: Group Winners →' : 'Review picks →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Group winners (manual only) */}
      {step === STEPS.groups && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-5">
          <div>
            <h2 className="font-serif text-xl text-ink">Group Winners</h2>
            <p className="text-ink-faint text-xs mt-0.5">
              Who wins each group? Points awarded if you're right at the end of the group stage.
            </p>
          </div>

          <GroupWinnerPicker teams={teams} picks={groupPicks} onChange={setGroupPicks} />

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setStep(STEPS.top3)}
              className="px-4 py-2.5 rounded-xl bg-gray-800 text-ink-muted text-sm hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(STEPS.confirm)}
              disabled={groupsPickedCount < 12}
              className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              Review picks →
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Confirm */}
      {step === STEPS.confirm && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-xl text-ink">Confirm Your Picks</h2>

            {/* Top 3 summary */}
            <div className="space-y-2">
              <p className="text-xs text-ink-faint uppercase tracking-wide font-medium">Top 3</p>
              {([
                ['🥇', t1, '+100 if correct'],
                ['🥈', t2, '+25 if correct'],
                ['🥉', t3, 'bonus pts'],
              ] as const).map(([emoji, team, hint], i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span>{emoji}</span>
                    {team ? (
                      <>
                        <span className="text-lg leading-none">{team.flag_emoji}</span>
                        <span className="text-sm text-ink font-medium">{team.name}</span>
                      </>
                    ) : (
                      <span className="text-sm text-ink-faint">Not picked</span>
                    )}
                  </div>
                  <span className="text-xs text-ink-faint">{hint}</span>
                </div>
              ))}
            </div>

            {/* Group winners summary */}
            {groupsPickedCount > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-ink-faint uppercase tracking-wide font-medium">
                  Group Winners ({groupsPickedCount}/12)
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {['A','B','C','D','E','F','G','H','I','J','K','L'].map((gId) => {
                    const team = teamById[groupPicks[gId]]
                    return (
                      <div key={gId} className="bg-gray-800 rounded-lg px-2 py-1.5 text-xs">
                        <span className="text-ink-faint">G{gId} </span>
                        {team ? (
                          <span className="text-ink">{team.flag_emoji} {team.code}</span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {error && <p className="text-red-600 text-xs">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep(mode === 'manual' ? STEPS.groups : STEPS.top3)}
                className="px-4 py-2.5 rounded-xl bg-gray-800 text-ink-muted text-sm hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !pick1Id || !pick2Id || !pick3Id}
                className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : "Lock in my picks →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
