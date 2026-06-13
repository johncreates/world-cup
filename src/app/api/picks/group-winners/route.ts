import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getToken(req: NextRequest): string | null {
  return req.headers.get('x-participant-token')
}

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data: participant, error } = await supabase
    .from('participants')
    .select('id')
    .eq('auth_token', token)
    .single()

  if (error || !participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('group_winner_picks')
    .select('group_id, team_id')
    .eq('participant_id', participant.id)

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { picks, complete } = body as { picks: Record<string, string>; complete?: boolean }

  const supabase = await createClient()
  const { data: participant, error } = await supabase
    .from('participants')
    .select('id')
    .eq('auth_token', token)
    .single()

  if (error || !participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = Object.entries(picks).map(([group_id, team_id]) => ({
    participant_id: participant.id,
    group_id,
    team_id,
    updated_at: new Date().toISOString(),
  }))

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from('group_winner_picks')
      .upsert(rows, { onConflict: 'participant_id,group_id' })
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  if (complete) {
    await supabase.from('participants').update({ picks_completed: true }).eq('id', participant.id)
  }

  return NextResponse.json({ ok: true })
}
