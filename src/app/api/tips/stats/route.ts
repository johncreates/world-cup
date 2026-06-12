import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Returns aggregate pick stats for a match (no individual attribution)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('matchId')

  if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })

  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches')
    .select('id, kickoff_at, stage, home_team_id, away_team_id')
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  // Only return stats after kickoff (stats visible to all after kickoff)
  const isLocked = new Date() >= new Date(match.kickoff_at)

  if (!isLocked) {
    // Return nothing before kickoff — stats only visible after you tip (handled client-side)
    return NextResponse.json({ locked: false, stats: null })
  }

  const { data: tips } = await supabase
    .from('tips')
    .select('predicted_home_score, predicted_away_score, predicted_winner_id')
    .eq('match_id', matchId)

  if (!tips) return NextResponse.json({ locked: true, stats: null })

  const total = tips.length
  if (total === 0) return NextResponse.json({ locked: true, stats: { total: 0 } })

  if (match.stage === 'group') {
    const outcomes = { home: 0, draw: 0, away: 0 }
    for (const t of tips) {
      if (t.predicted_home_score == null || t.predicted_away_score == null) continue
      if (t.predicted_home_score > t.predicted_away_score) outcomes.home++
      else if (t.predicted_home_score < t.predicted_away_score) outcomes.away++
      else outcomes.draw++
    }
    return NextResponse.json({
      locked: true,
      stats: {
        total,
        home_pct: Math.round((outcomes.home / total) * 100),
        draw_pct: Math.round((outcomes.draw / total) * 100),
        away_pct: Math.round((outcomes.away / total) * 100),
      },
    })
  }

  // Knockout — winner picks
  const winnerCounts: Record<string, number> = {}
  for (const t of tips) {
    if (!t.predicted_winner_id) continue
    winnerCounts[t.predicted_winner_id] = (winnerCounts[t.predicted_winner_id] || 0) + 1
  }

  const picks = Object.entries(winnerCounts).map(([team_id, count]) => ({
    team_id,
    count,
    percentage: Math.round((count / total) * 100),
  }))

  return NextResponse.json({ locked: true, stats: { total, picks } })
}
