import type { Tip, Match, Stage, Outcome } from '@/types'

export const STAGE_POINTS: Record<Stage, number> = {
  group: 1,
  r32: 2,
  r16: 3,
  qf: 4,
  sf: 6,
  final: 8,
}

export const EXACT_SCORE_BONUS = 2

function getOutcome(homeScore: number, awayScore: number): Outcome {
  if (homeScore > awayScore) return 'home'
  if (homeScore < awayScore) return 'away'
  return 'draw'
}

export function calculateTipPoints(tip: Tip, match: Match): number {
  if (!match.result_confirmed_at) return 0
  if (match.home_score === null || match.away_score === null) return 0

  const base = STAGE_POINTS[match.stage]

  if (match.stage === 'group') {
    if (tip.predicted_home_score === null || tip.predicted_away_score === null) return 0
    const actualOutcome = getOutcome(match.home_score, match.away_score)
    const predictedOutcome = getOutcome(tip.predicted_home_score, tip.predicted_away_score)
    if (actualOutcome !== predictedOutcome) return 0
    const exact =
      tip.predicted_home_score === match.home_score &&
      tip.predicted_away_score === match.away_score
    return base + (exact ? EXACT_SCORE_BONUS : 0)
  }

  // Knockout: correct winner
  if (!match.winner_team_id || !tip.predicted_winner_id) return 0
  if (tip.predicted_winner_id !== match.winner_team_id) return 0
  const exact =
    tip.predicted_home_score !== null &&
    tip.predicted_away_score !== null &&
    tip.predicted_home_score === match.home_score &&
    tip.predicted_away_score === match.away_score
  return base + (exact ? EXACT_SCORE_BONUS : 0)
}

export function isMatchLocked(match: Match): boolean {
  return new Date() >= new Date(match.kickoff_at)
}

export function getRandomGroupTip(): { home: number; away: number } {
  const scores = [0, 0, 0, 1, 1, 2, 2, 3, 4]
  const home = scores[Math.floor(Math.random() * scores.length)]
  const away = scores[Math.floor(Math.random() * scores.length)]
  return { home, away }
}

export function getRandomKnockoutTip(teamIds: string[]): string {
  return teamIds[Math.floor(Math.random() * teamIds.length)]
}
