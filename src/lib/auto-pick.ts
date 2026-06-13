import type { Team } from '@/types'

const FAVOURITE_CODES = ['ARG', 'FRA', 'BRA', 'ENG', 'ESP', 'NED', 'GER', 'POR']

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function autoPickTop3(teams: Team[]): { pick_1st_id: string; pick_2nd_id: string; pick_3rd_id: string } {
  const favs = shuffle(teams.filter((t) => FAVOURITE_CODES.includes(t.code)))
  const rest = shuffle(teams.filter((t) => !FAVOURITE_CODES.includes(t.code)))
  const pool = [...favs, ...rest]
  return {
    pick_1st_id: pool[0].id,
    pick_2nd_id: pool[1].id,
    pick_3rd_id: pool[2].id,
  }
}

export function autoPickGroupWinners(teams: Team[]): Record<string, string> {
  const groups: Record<string, Team[]> = {}
  for (const t of teams) {
    if (!groups[t.group_id]) groups[t.group_id] = []
    groups[t.group_id].push(t)
  }
  const result: Record<string, string> = {}
  for (const [gId, gTeams] of Object.entries(groups)) {
    result[gId] = gTeams[Math.floor(Math.random() * gTeams.length)].id
  }
  return result
}
