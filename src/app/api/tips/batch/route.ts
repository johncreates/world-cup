import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireParticipant } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const auth = await requireParticipant(request)
  if (auth instanceof Response) return auth
  const { participant } = auth

  const { tips } = await request.json()
  if (!Array.isArray(tips) || tips.length === 0) {
    return NextResponse.json({ error: 'tips array required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch match kickoff times to validate locks
  const matchIds = [...new Set(tips.map((t: any) => t.match_id))]
  const { data: matches } = await supabase
    .from('matches')
    .select('id, kickoff_at, stage')
    .in('id', matchIds)

  if (!matches) return NextResponse.json({ error: 'Could not fetch matches' }, { status: 500 })

  const matchMap = Object.fromEntries(matches.map((m) => [m.id, m]))
  const now = new Date()

  const validRows = tips
    .filter((t: any) => {
      const m = matchMap[t.match_id]
      return m && new Date(m.kickoff_at) > now
    })
    .map((t: any) => {
      const m = matchMap[t.match_id]
      return {
        participant_id: participant.id,
        match_id: t.match_id,
        predicted_outcome: m.stage === 'group' ? (t.predicted_outcome ?? null) : null,
        predicted_winner_id: m.stage !== 'group' ? (t.predicted_winner_id ?? null) : null,
        updated_at: new Date().toISOString(),
      }
    })
    .filter((t) => t.predicted_outcome || t.predicted_winner_id)

  if (!validRows.length) return NextResponse.json({ saved: 0 })

  const { error } = await supabase
    .from('tips')
    .upsert(validRows, { onConflict: 'participant_id,match_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: validRows.length })
}
