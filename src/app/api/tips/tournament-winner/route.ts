import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireParticipant } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const auth = await requireParticipant(request)
  if (auth instanceof Response) return auth
  const { participant } = auth

  const supabase = await createClient()
  const { data } = await supabase
    .from('participants')
    .select('tournament_winner_id, tournament_winner:teams!participants_tournament_winner_id_fkey(*)')
    .eq('id', participant.id)
    .single()

  return NextResponse.json({ team: (data as any)?.tournament_winner ?? null })
}

export async function POST(request: NextRequest) {
  const auth = await requireParticipant(request)
  if (auth instanceof Response) return auth
  const { participant } = auth

  const { team_id } = await request.json()
  if (!team_id) return NextResponse.json({ error: 'team_id required' }, { status: 400 })

  const supabase = await createClient()

  // Verify team exists
  const { data: team } = await supabase.from('teams').select('id').eq('id', team_id).single()
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const { error } = await supabase
    .from('participants')
    .update({ tournament_winner_id: team_id })
    .eq('id', participant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: updatedTeam } = await supabase.from('teams').select('*').eq('id', team_id).single()
  return NextResponse.json({ team: updatedTeam })
}
