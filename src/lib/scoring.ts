import type { Tip, Match, Stage, Outcome } from '@/types'

export const STAGE_POINTS: Record<Stage, number> = {
  group: 1,
  r32: 2,
  r16: 3,
  qf: 4,
  sf: 6,
  final: 8,
}

export const TOURNAMENT_WINNER_POINTS = 15

export function getActualOutcome(match: Match): Outcome | null {
  if (match.home_score === null || match.away_score === null) return null
  if (match.home_score > match.away_score) return 'home'
  if (match.home_score < match.away_score) return 'away'
  return 'draw'
}

export function calculateTipPoints(tip: Tip, match: Match): number {
  if (!match.result_confirmed_at) return 0

  const base = STAGE_POINTS[match.stage]

  if (match.stage === 'group') {
    if (!tip.predicted_outcome) return 0
    const actual = getActualOutcome(match)
    return tip.predicted_outcome === actual ? base : 0
  }

  // Knockout: correct winner
  if (!match.winner_team_id || !tip.predicted_winner_id) return 0
  return tip.predicted_winner_id === match.winner_team_id ? base : 0
}

export function isMatchLocked(match: Match): boolean {
  return new Date() >= new Date(match.kickoff_at)
}

export function getRandomOutcome(): Outcome {
  const r = Math.random()
  if (r < 0.40) return 'home'
  if (r < 0.65) return 'away'
  return 'draw'
}

export function getRandomKnockoutTip(teamIds: string[]): string {
  return teamIds[Math.floor(Math.random() * teamIds.length)]
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  home: 'Home Win',
  draw: 'Draw',
  away: 'Away Win',
}

export function outcomeLabel(outcome: Outcome): string {
  return OUTCOME_LABEL[outcome]
}

// Tipster profile title algorithm
const TOP_FAVOURITES = ['ARG', 'FRA', 'BRA', 'ENG', 'ESP']

export function computeTipsterTitle(
  tips: Tip[],
  matches: Match[],
  tournamentWinnerCode: string | null
): { title: string; boldness: number } {
  const groupTips = tips.filter((t) => {
    const m = matches.find((m) => m.id === t.match_id)
    return m?.stage === 'group' && t.predicted_outcome
  })

  if (groupTips.length === 0) return { title: 'The Newcomer', boldness: 0 }

  const awayCounts = groupTips.filter((t) => t.predicted_outcome === 'away').length
  const upsetPct = awayCounts / groupTips.length
  const safeChampion = tournamentWinnerCode ? TOP_FAVOURITES.includes(tournamentWinnerCode) : false
  const boldness = Math.round(upsetPct * 100)

  let title: string
  if (upsetPct > 0.4 && !safeChampion) title = 'The Chaos Agent'
  else if (upsetPct < 0.2 && safeChampion) title = 'The Safe Bettor'
  else if (upsetPct < 0.2 && !safeChampion) title = 'The Romantic Underdog'
  else if (upsetPct > 0.4 && safeChampion) title = 'The Contrarian'
  else title = 'The Calculated Risk-Taker'

  return { title, boldness }
}
