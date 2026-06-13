import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeTipsterTitle, STAGE_POINTS, TOURNAMENT_WINNER_POINTS } from '@/lib/scoring'
import type { Tip, Match } from '@/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const { participantId } = await params
  const supabase = await createClient()

  const [{ data: participant }, { data: leaderboard }, { data: tips }, { data: matches }] = await Promise.all([
    supabase
      .from('participants')
      .select('id, nickname, tournament_winner_id, tournament_winner:teams!participants_tournament_winner_id_fkey(*)')
      .eq('id', participantId)
      .single(),
    supabase.from('leaderboard').select('*'),
    supabase.from('tips').select('*').eq('participant_id', participantId),
    supabase.from('matches').select('*'),
  ])

  if (!participant) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

  const rank = (leaderboard ?? []).findIndex((e: any) => e.participant_id === participantId) + 1
  const tournamentWinner = (participant as any).tournament_winner ?? null
  const winnerCode = tournamentWinner?.code ?? null

  const { title, boldness } = computeTipsterTitle(
    (tips ?? []) as Tip[],
    (matches ?? []) as Match[],
    winnerCode
  )

  // Max possible points if all remaining tips are correct
  const now = new Date()
  const totalTips = (tips ?? []).length
  const maxPoints = (tips ?? []).reduce((sum: number, t: any) => {
    const m = (matches ?? []).find((m: any) => m.id === t.match_id) as any
    if (!m) return sum
    return sum + STAGE_POINTS[m.stage as keyof typeof STAGE_POINTS]
  }, 0) + (tournamentWinner ? TOURNAMENT_WINNER_POINTS : 0)

  return NextResponse.json({
    participant_id: participantId,
    nickname: participant.nickname,
    title,
    tournament_winner: tournamentWinner,
    leaderboard_rank: rank,
    total_tips: totalTips,
    total_matches: (matches ?? []).length,
    max_possible_points: maxPoints,
    boldness_score: boldness,
  })
}
