import type { Match, Team, Tip, Outcome } from '@/types'
import { getRandomOutcome } from '@/lib/scoring'

interface TipDraft {
  match_id: string
  predicted_outcome?: Outcome
  predicted_winner_id?: string
}

export function fillBracketForChampion(
  teamId: string,
  matches: Match[],
  existingTips: Record<string, Tip>
): TipDraft[] {
  const now = new Date()
  const drafts: TipDraft[] = []

  for (const match of matches) {
    // Skip locked matches
    if (new Date(match.kickoff_at) <= now) continue

    if (match.stage === 'group') {
      const isHome = match.home_team_id === teamId
      const isAway = match.away_team_id === teamId

      if (isHome) {
        drafts.push({ match_id: match.id, predicted_outcome: 'home' })
      } else if (isAway) {
        drafts.push({ match_id: match.id, predicted_outcome: 'away' })
      } else {
        // Random for other group matches
        drafts.push({ match_id: match.id, predicted_outcome: getRandomOutcome() })
      }
    } else {
      // Knockout: pick chosen team everywhere (only relevant match will score)
      drafts.push({ match_id: match.id, predicted_winner_id: teamId })
    }
  }

  return drafts
}
