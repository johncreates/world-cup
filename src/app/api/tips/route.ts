import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireParticipant } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const auth = await requireParticipant(request)
  if (auth instanceof Response) return auth
  const { participant } = auth

  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('matchId')

  const supabase = await createClient()

  let query = supabase
    .from('tips')
    .select(`*, match:matches(*), predicted_winner:teams(*)`)
    .eq('participant_id', participant.id)

  if (matchId) query = query.eq('match_id', matchId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireParticipant(request)
  if (auth instanceof Response) return auth
  const { participant } = auth

  const body = await request.json()
  const { match_id, predicted_outcome, predicted_winner_id } = body

  if (!match_id) return NextResponse.json({ error: 'match_id required' }, { status: 400 })

  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches')
    .select('id, kickoff_at, stage')
    .eq('id', match_id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  if (new Date() >= new Date(match.kickoff_at)) {
    return NextResponse.json({ error: 'Tips are locked — this match has already kicked off' }, { status: 409 })
  }

  if (match.stage === 'group') {
    if (!predicted_outcome || !['home', 'draw', 'away'].includes(predicted_outcome)) {
      return NextResponse.json({ error: 'predicted_outcome (home/draw/away) required for group stage' }, { status: 400 })
    }
  } else {
    if (!predicted_winner_id) {
      return NextResponse.json({ error: 'predicted_winner_id required for knockout matches' }, { status: 400 })
    }
  }

  const tipData = {
    participant_id: participant.id,
    match_id,
    predicted_outcome: match.stage === 'group' ? predicted_outcome : null,
    predicted_winner_id: match.stage !== 'group' ? predicted_winner_id : null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('tips')
    .upsert(tipData, { onConflict: 'participant_id,match_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
