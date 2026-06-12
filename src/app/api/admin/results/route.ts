import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = await request.json()
  const { match_id, home_score, away_score, winner_team_id } = body

  if (!match_id || home_score === undefined || away_score === undefined) {
    return NextResponse.json({ error: 'match_id, home_score and away_score required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Determine winner if not provided (for knockout draw cases admin provides winner explicitly)
  let resolvedWinner = winner_team_id || null
  if (!resolvedWinner) {
    const { data: match } = await supabase
      .from('matches')
      .select('stage, home_team_id, away_team_id')
      .eq('id', match_id)
      .single()

    if (match && match.stage === 'group') {
      // No winner for group stage draws
      if (home_score > away_score) resolvedWinner = match.home_team_id
      else if (away_score > home_score) resolvedWinner = match.away_team_id
    }
    // For knockout, admin must supply winner_team_id explicitly (handles AET/penalties)
  }

  const { data, error } = await supabase
    .from('matches')
    .update({
      home_score,
      away_score,
      winner_team_id: resolvedWinner,
      result_confirmed_at: new Date().toISOString(),
    })
    .eq('id', match_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
