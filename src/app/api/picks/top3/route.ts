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
    .select('id, pick_1st_id, pick_2nd_id, pick_3rd_id, picks_completed')
    .eq('auth_token', token)
    .single()

  if (error || !participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teamIds = [participant.pick_1st_id, participant.pick_2nd_id, participant.pick_3rd_id].filter(Boolean)
  let teams: Record<string, unknown>[] = []
  if (teamIds.length) {
    const { data } = await supabase.from('teams').select('id, name, code, flag_emoji, group_id').in('id', teamIds)
    teams = data ?? []
  }

  const byId = Object.fromEntries(teams.map((t) => [t.id as string, t]))

  return NextResponse.json({
    pick_1st: participant.pick_1st_id ? byId[participant.pick_1st_id] ?? null : null,
    pick_2nd: participant.pick_2nd_id ? byId[participant.pick_2nd_id] ?? null : null,
    pick_3rd: participant.pick_3rd_id ? byId[participant.pick_3rd_id] ?? null : null,
    picks_completed: participant.picks_completed ?? false,
  })
}

export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { pick_1st_id, pick_2nd_id, pick_3rd_id } = body as {
    pick_1st_id: string
    pick_2nd_id: string
    pick_3rd_id: string
  }

  if (!pick_1st_id || !pick_2nd_id || !pick_3rd_id) {
    return NextResponse.json({ error: 'All three picks required' }, { status: 400 })
  }
  if (new Set([pick_1st_id, pick_2nd_id, pick_3rd_id]).size !== 3) {
    return NextResponse.json({ error: 'All three picks must be different teams' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: participant, error } = await supabase
    .from('participants')
    .select('id')
    .eq('auth_token', token)
    .single()

  if (error || !participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error: updateError } = await supabase
    .from('participants')
    .update({ pick_1st_id, pick_2nd_id, pick_3rd_id })
    .eq('id', participant.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
