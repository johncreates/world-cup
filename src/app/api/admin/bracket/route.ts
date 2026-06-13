import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

// Assign actual teams to knockout match slots (called after group stage / each round)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = await request.json()
  const { match_id, home_team_id, away_team_id } = body

  if (!match_id || (!home_team_id && !away_team_id)) {
    return NextResponse.json({ error: 'match_id and at least one team required' }, { status: 400 })
  }

  const supabase = await createClient()

  const updates: Record<string, string> = {}
  if (home_team_id) updates.home_team_id = home_team_id
  if (away_team_id) updates.away_team_id = away_team_id

  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', match_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
