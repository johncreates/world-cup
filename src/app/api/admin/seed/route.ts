import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'
import { TEAMS } from '@/lib/fixtures/teams'
import { ALL_MATCHES } from '@/lib/fixtures/matches'

// One-time seed endpoint — run after schema migration to populate teams and matches
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const supabase = await createClient()

  // Seed teams
  const { error: teamsError } = await supabase
    .from('teams')
    .upsert(TEAMS.map((t) => ({ code: t.code, name: t.name, group_id: t.group_id, flag_emoji: t.flag_emoji })), { onConflict: 'code' })

  if (teamsError) return NextResponse.json({ error: `Teams seed failed: ${teamsError.message}` }, { status: 500 })

  // Fetch teams to get IDs
  const { data: teamsData } = await supabase.from('teams').select('id, code')
  if (!teamsData) return NextResponse.json({ error: 'Could not fetch teams' }, { status: 500 })

  const teamByCode: Record<string, string> = {}
  for (const t of teamsData) teamByCode[t.code] = t.id

  // Seed matches
  const matchRows = ALL_MATCHES.map((m) => ({
    match_number: m.match_number,
    stage: m.stage,
    group_id: m.group_id,
    home_team_id: m.home_team_code ? (teamByCode[m.home_team_code] || null) : null,
    away_team_id: m.away_team_code ? (teamByCode[m.away_team_code] || null) : null,
    home_team_placeholder: m.home_team_placeholder,
    away_team_placeholder: m.away_team_placeholder,
    kickoff_at: m.kickoff_at,
    venue: m.venue,
  }))

  const { error: matchesError } = await supabase
    .from('matches')
    .upsert(matchRows, { onConflict: 'match_number' })

  if (matchesError) return NextResponse.json({ error: `Matches seed failed: ${matchesError.message}` }, { status: 500 })

  return NextResponse.json({ success: true, teams: teamsData.length, matches: matchRows.length })
}
