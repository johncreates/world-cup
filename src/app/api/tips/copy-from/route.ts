import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireParticipant } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const auth = await requireParticipant(request)
  if (auth instanceof Response) return auth
  const { participant } = auth

  const { source_participant_id } = await request.json()
  if (!source_participant_id) return NextResponse.json({ error: 'source_participant_id required' }, { status: 400 })
  if (source_participant_id === participant.id) return NextResponse.json({ error: 'Cannot copy from yourself' }, { status: 400 })

  const supabase = await createClient()

  // Get source participant's tips for unlocked matches only
  const { data: sourceTips } = await supabase
    .from('tips')
    .select('match_id, predicted_outcome, predicted_winner_id, match:matches(kickoff_at)')
    .eq('participant_id', source_participant_id)

  if (!sourceTips?.length) return NextResponse.json({ copied: 0 })

  const now = new Date()
  const unlocked = sourceTips.filter((t) => {
    const m = t.match as any
    return m?.kickoff_at && new Date(m.kickoff_at) > now
  })

  if (!unlocked.length) return NextResponse.json({ copied: 0, message: 'No unlocked tips to copy' })

  const upsertRows = unlocked.map((t) => ({
    participant_id: participant.id,
    match_id: t.match_id,
    predicted_outcome: t.predicted_outcome,
    predicted_winner_id: t.predicted_winner_id,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('tips')
    .upsert(upsertRows, { onConflict: 'participant_id,match_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ copied: upsertRows.length })
}
