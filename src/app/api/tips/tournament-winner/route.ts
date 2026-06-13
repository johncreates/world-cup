import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireParticipant } from '@/lib/api-auth'

async function checkEliminated(supabase: Awaited<ReturnType<typeof createClient>>, teamId: string): Promise<boolean> {
  const { data } = await supabase
    .from('matches')
    .select('id')
    .neq('stage', 'group')
    .not('result_confirmed_at', 'is', null)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .neq('winner_team_id', teamId)
    .limit(1)
  return (data?.length ?? 0) > 0
}

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

  const team = (data as any)?.tournament_winner ?? null
  const eliminated = team ? await checkEliminated(supabase, team.id) : false

  return NextResponse.json({ team, eliminated })
}

export async function POST(request: NextRequest) {
  const auth = await requireParticipant(request)
  if (auth instanceof Response) return auth
  const { participant } = auth

  const { team_id } = await request.json()
  if (!team_id) return NextResponse.json({ error: 'team_id required' }, { status: 400 })

  const supabase = await createClient()

  // Check if participant already has a pick
  const { data: current } = await supabase
    .from('participants')
    .select('tournament_winner_id')
    .eq('id', participant.id)
    .single()

  const currentWinnerId = (current as any)?.tournament_winner_id

  // If they have an existing pick, only allow change if that team is eliminated
  if (currentWinnerId && currentWinnerId !== team_id) {
    const eliminated = await checkEliminated(supabase, currentWinnerId)
    if (!eliminated) {
      return NextResponse.json(
        { error: 'You can only change your tournament winner pick once your team is eliminated.' },
        { status: 403 }
      )
    }
  }

  // Verify team exists
  const { data: team } = await supabase.from('teams').select('*').eq('id', team_id).single()
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const { error } = await supabase
    .from('participants')
    .update({ tournament_winner_id: team_id })
    .eq('id', participant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ team })
}
