import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')
  const group = searchParams.get('group')

  const supabase = await createClient()

  let query = supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      winner_team:teams!matches_winner_team_id_fkey(*)
    `)
    .order('match_number', { ascending: true })

  if (stage) query = query.eq('stage', stage)
  if (group) query = query.eq('group_id', group)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
