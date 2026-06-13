import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getToken(req: NextRequest): string | null {
  return req.headers.get('x-participant-token')
}

export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data: participant, error } = await supabase
    .from('participants')
    .select('id')
    .eq('auth_token', token)
    .single()

  if (error || !participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('group_winner_picks').delete().eq('participant_id', participant.id)

  await supabase
    .from('participants')
    .update({ pick_1st_id: null, pick_2nd_id: null, pick_3rd_id: null, picks_completed: false })
    .eq('id', participant.id)

  return NextResponse.json({ ok: true })
}
