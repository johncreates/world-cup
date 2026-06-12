// WC 2026 Group Stage Fixtures
// Matches 1-72: group stage | 73-88: R32 | 89-96: R16 | 97-100: QF | 101-102: SF | 103: 3rd place | 104: Final
// All times in UTC. Actual kickoff times are approximate — update from official FIFA schedule.

export interface MatchSeed {
  match_number: number
  stage: string
  group_id: string | null
  home_team_code: string | null
  away_team_code: string | null
  home_team_placeholder: string | null
  away_team_placeholder: string | null
  kickoff_at: string // ISO UTC
  venue: string
}

// Group stage: 12 groups × 6 matches = 72 matches
// Matchday structure per group:
//   MD1: T0 vs T1, T2 vs T3
//   MD2: T0 vs T2, T1 vs T3
//   MD3: T0 vs T3, T1 vs T2

const GROUP_TEAMS: Record<string, [string, string, string, string]> = {
  A: ['MEX', 'USA', 'URU', 'PAN'],
  B: ['ARG', 'CHI', 'PER', 'AUS'],
  C: ['ENG', 'SUI', 'GRE', 'BIH'],
  D: ['NED', 'SEN', 'JPN', 'BHR'],
  E: ['FRA', 'ALG', 'SVK', 'THA'],
  F: ['ESP', 'MAR', 'CZE', 'NZL'],
  G: ['BRA', 'NGA', 'COL', 'SDN'],
  H: ['GER', 'POR', 'TUN', 'CAN'],
  I: ['ITA', 'KOR', 'ECU', 'VEN'],
  J: ['CRO', 'BEL', 'HND', 'CHN'],
  K: ['PAR', 'DEN', 'IRN', 'GTM'],
  L: ['EGY', 'SAU', 'UKR', 'CIV'],
}

// Venues by match number range (host cities: 16 venues across USA, Canada, Mexico)
const VENUES = [
  'AT&T Stadium, Dallas',
  'SoFi Stadium, Los Angeles',
  'MetLife Stadium, New York/New Jersey',
  'Hard Rock Stadium, Miami',
  'Empower Field, Denver',
  'Levi\'s Stadium, San Francisco',
  'Gillette Stadium, Boston',
  'Lumen Field, Seattle',
  'Arrowhead Stadium, Kansas City',
  'NRG Stadium, Houston',
  'Lincoln Financial Field, Philadelphia',
  'Bank of America Stadium, Charlotte',
  'Estadio Azteca, Mexico City',
  'Estadio Akron, Guadalajara',
  'BC Place, Vancouver',
  'BMO Field, Toronto',
]

function venue(n: number): string {
  return VENUES[(n - 1) % VENUES.length]
}

// Group stage schedule — group stage runs June 11–26, 2026
// 3-4 matches per day, spread across groups
// MD1: June 11-15, MD2: June 16-20, MD3: June 21-26
const GROUP_KICKOFFS: Record<string, { md1: [string, string]; md2: [string, string]; md3: [string, string] }> = {
  A: { md1: ['2026-06-11T18:00:00Z', '2026-06-11T21:00:00Z'], md2: ['2026-06-16T01:00:00Z', '2026-06-16T18:00:00Z'], md3: ['2026-06-21T01:00:00Z', '2026-06-21T01:00:00Z'] },
  B: { md1: ['2026-06-12T18:00:00Z', '2026-06-12T21:00:00Z'], md2: ['2026-06-17T01:00:00Z', '2026-06-17T18:00:00Z'], md3: ['2026-06-22T01:00:00Z', '2026-06-22T01:00:00Z'] },
  C: { md1: ['2026-06-13T18:00:00Z', '2026-06-13T21:00:00Z'], md2: ['2026-06-17T21:00:00Z', '2026-06-18T01:00:00Z'], md3: ['2026-06-22T21:00:00Z', '2026-06-22T21:00:00Z'] },
  D: { md1: ['2026-06-13T00:00:00Z', '2026-06-13T03:00:00Z'], md2: ['2026-06-18T18:00:00Z', '2026-06-18T21:00:00Z'], md3: ['2026-06-23T21:00:00Z', '2026-06-23T21:00:00Z'] },
  E: { md1: ['2026-06-14T18:00:00Z', '2026-06-14T21:00:00Z'], md2: ['2026-06-19T01:00:00Z', '2026-06-19T18:00:00Z'], md3: ['2026-06-24T01:00:00Z', '2026-06-24T01:00:00Z'] },
  F: { md1: ['2026-06-15T18:00:00Z', '2026-06-15T21:00:00Z'], md2: ['2026-06-19T21:00:00Z', '2026-06-20T01:00:00Z'], md3: ['2026-06-24T21:00:00Z', '2026-06-24T21:00:00Z'] },
  G: { md1: ['2026-06-11T00:00:00Z', '2026-06-11T03:00:00Z'], md2: ['2026-06-20T18:00:00Z', '2026-06-20T21:00:00Z'], md3: ['2026-06-25T21:00:00Z', '2026-06-25T21:00:00Z'] },
  H: { md1: ['2026-06-12T00:00:00Z', '2026-06-12T03:00:00Z'], md2: ['2026-06-16T21:00:00Z', '2026-06-16T01:00:00Z'], md3: ['2026-06-25T01:00:00Z', '2026-06-25T01:00:00Z'] },
  I: { md1: ['2026-06-14T00:00:00Z', '2026-06-14T03:00:00Z'], md2: ['2026-06-20T01:00:00Z', '2026-06-20T21:00:00Z'], md3: ['2026-06-26T01:00:00Z', '2026-06-26T01:00:00Z'] },
  J: { md1: ['2026-06-15T00:00:00Z', '2026-06-15T03:00:00Z'], md2: ['2026-06-21T18:00:00Z', '2026-06-21T21:00:00Z'], md3: ['2026-06-26T21:00:00Z', '2026-06-26T21:00:00Z'] },
  K: { md1: ['2026-06-13T18:00:00Z', '2026-06-13T21:00:00Z'], md2: ['2026-06-21T01:00:00Z', '2026-06-21T18:00:00Z'], md3: ['2026-06-25T21:00:00Z', '2026-06-25T21:00:00Z'] },
  L: { md1: ['2026-06-14T18:00:00Z', '2026-06-14T21:00:00Z'], md2: ['2026-06-22T01:00:00Z', '2026-06-22T18:00:00Z'], md3: ['2026-06-26T01:00:00Z', '2026-06-26T01:00:00Z'] },
}

function buildGroupMatches(): MatchSeed[] {
  const matches: MatchSeed[] = []
  let matchNumber = 1

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  for (const g of groups) {
    const [t0, t1, t2, t3] = GROUP_TEAMS[g]
    const ko = GROUP_KICKOFFS[g]

    // MD1
    matches.push({ match_number: matchNumber++, stage: 'group', group_id: g, home_team_code: t0, away_team_code: t1, home_team_placeholder: null, away_team_placeholder: null, kickoff_at: ko.md1[0], venue: venue(matchNumber) })
    matches.push({ match_number: matchNumber++, stage: 'group', group_id: g, home_team_code: t2, away_team_code: t3, home_team_placeholder: null, away_team_placeholder: null, kickoff_at: ko.md1[1], venue: venue(matchNumber) })
    // MD2
    matches.push({ match_number: matchNumber++, stage: 'group', group_id: g, home_team_code: t0, away_team_code: t2, home_team_placeholder: null, away_team_placeholder: null, kickoff_at: ko.md2[0], venue: venue(matchNumber) })
    matches.push({ match_number: matchNumber++, stage: 'group', group_id: g, home_team_code: t1, away_team_code: t3, home_team_placeholder: null, away_team_placeholder: null, kickoff_at: ko.md2[1], venue: venue(matchNumber) })
    // MD3 (simultaneous)
    matches.push({ match_number: matchNumber++, stage: 'group', group_id: g, home_team_code: t0, away_team_code: t3, home_team_placeholder: null, away_team_placeholder: null, kickoff_at: ko.md3[0], venue: venue(matchNumber) })
    matches.push({ match_number: matchNumber++, stage: 'group', group_id: g, home_team_code: t1, away_team_code: t2, home_team_placeholder: null, away_team_placeholder: null, kickoff_at: ko.md3[1], venue: venue(matchNumber) })
  }

  return matches
}

// Knockout structure — teams filled in after groups
// Slot notation: "1A" = winner group A, "2B" = runner-up group B, "3ABCD" = best 3rd from groups A/B/C/D
const KNOCKOUT_MATCHES: MatchSeed[] = [
  // Round of 32 — 16 matches (73-88)
  { match_number: 73, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner Group A', away_team_placeholder: 'Runner-up Group B', kickoff_at: '2026-06-29T01:00:00Z', venue: 'MetLife Stadium, New York/New Jersey' },
  { match_number: 74, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner Group C', away_team_placeholder: 'Runner-up Group D', kickoff_at: '2026-06-29T18:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { match_number: 75, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner Group E', away_team_placeholder: 'Runner-up Group F', kickoff_at: '2026-06-30T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { match_number: 76, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner Group G', away_team_placeholder: 'Runner-up Group H', kickoff_at: '2026-06-30T18:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { match_number: 77, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner Group I', away_team_placeholder: 'Runner-up Group J', kickoff_at: '2026-07-01T01:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },
  { match_number: 78, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner Group K', away_team_placeholder: 'Runner-up Group L', kickoff_at: '2026-07-01T18:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { match_number: 79, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Runner-up Group A', away_team_placeholder: 'Winner Group B', kickoff_at: '2026-07-02T01:00:00Z', venue: 'Gillette Stadium, Boston' },
  { match_number: 80, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Runner-up Group C', away_team_placeholder: 'Winner Group D', kickoff_at: '2026-07-02T18:00:00Z', venue: 'Lumen Field, Seattle' },
  { match_number: 81, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Runner-up Group E', away_team_placeholder: 'Winner Group F', kickoff_at: '2026-07-03T01:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { match_number: 82, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Runner-up Group G', away_team_placeholder: 'Winner Group H', kickoff_at: '2026-07-03T18:00:00Z', venue: 'NRG Stadium, Houston' },
  { match_number: 83, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Runner-up Group I', away_team_placeholder: 'Winner Group J', kickoff_at: '2026-07-04T01:00:00Z', venue: 'Empower Field, Denver' },
  { match_number: 84, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Runner-up Group K', away_team_placeholder: 'Winner Group L', kickoff_at: '2026-07-04T18:00:00Z', venue: 'BC Place, Vancouver' },
  { match_number: 85, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Best 3rd Place (A/B/C/D)', away_team_placeholder: 'Best 3rd Place (E/F/G/H)', kickoff_at: '2026-07-05T01:00:00Z', venue: 'BMO Field, Toronto' },
  { match_number: 86, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Best 3rd Place (I/J/K/L)', away_team_placeholder: 'Best 3rd Place (A/B/C/D)', kickoff_at: '2026-07-05T18:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { match_number: 87, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Best 3rd Place (E/F/G/H)', away_team_placeholder: 'Best 3rd Place (I/J/K/L)', kickoff_at: '2026-07-05T21:00:00Z', venue: 'Bank of America Stadium, Charlotte' },
  { match_number: 88, stage: 'r32', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Best 3rd Place', away_team_placeholder: 'Best 3rd Place', kickoff_at: '2026-07-05T23:00:00Z', venue: 'Estadio Akron, Guadalajara' },

  // Round of 16 — 8 matches (89-96)
  { match_number: 89, stage: 'r16', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M73', away_team_placeholder: 'Winner M74', kickoff_at: '2026-07-08T18:00:00Z', venue: 'MetLife Stadium, New York/New Jersey' },
  { match_number: 90, stage: 'r16', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M75', away_team_placeholder: 'Winner M76', kickoff_at: '2026-07-08T21:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { match_number: 91, stage: 'r16', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M77', away_team_placeholder: 'Winner M78', kickoff_at: '2026-07-09T18:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { match_number: 92, stage: 'r16', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M79', away_team_placeholder: 'Winner M80', kickoff_at: '2026-07-09T21:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { match_number: 93, stage: 'r16', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M81', away_team_placeholder: 'Winner M82', kickoff_at: '2026-07-10T18:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { match_number: 94, stage: 'r16', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M83', away_team_placeholder: 'Winner M84', kickoff_at: '2026-07-10T21:00:00Z', venue: 'Empower Field, Denver' },
  { match_number: 95, stage: 'r16', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M85', away_team_placeholder: 'Winner M86', kickoff_at: '2026-07-11T18:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },
  { match_number: 96, stage: 'r16', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M87', away_team_placeholder: 'Winner M88', kickoff_at: '2026-07-11T21:00:00Z', venue: 'NRG Stadium, Houston' },

  // Quarter-finals — 4 matches (97-100)
  { match_number: 97, stage: 'qf', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M89', away_team_placeholder: 'Winner M90', kickoff_at: '2026-07-14T18:00:00Z', venue: 'MetLife Stadium, New York/New Jersey' },
  { match_number: 98, stage: 'qf', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M91', away_team_placeholder: 'Winner M92', kickoff_at: '2026-07-14T21:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { match_number: 99, stage: 'qf', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M93', away_team_placeholder: 'Winner M94', kickoff_at: '2026-07-15T18:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { match_number: 100, stage: 'qf', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M95', away_team_placeholder: 'Winner M96', kickoff_at: '2026-07-15T21:00:00Z', venue: 'Hard Rock Stadium, Miami' },

  // Semi-finals — 2 matches (101-102)
  { match_number: 101, stage: 'sf', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M97', away_team_placeholder: 'Winner M98', kickoff_at: '2026-07-18T21:00:00Z', venue: 'MetLife Stadium, New York/New Jersey' },
  { match_number: 102, stage: 'sf', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M99', away_team_placeholder: 'Winner M100', kickoff_at: '2026-07-19T21:00:00Z', venue: 'AT&T Stadium, Dallas' },

  // 3rd Place — match 103
  { match_number: 103, stage: 'sf', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Loser M101', away_team_placeholder: 'Loser M102', kickoff_at: '2026-07-22T18:00:00Z', venue: 'MetLife Stadium, New York/New Jersey' },

  // Final — match 104
  { match_number: 104, stage: 'final', group_id: null, home_team_code: null, away_team_code: null, home_team_placeholder: 'Winner M101', away_team_placeholder: 'Winner M102', kickoff_at: '2026-07-26T20:00:00Z', venue: 'MetLife Stadium, New York/New Jersey' },
]

export const GROUP_MATCHES = buildGroupMatches()
export const ALL_MATCHES: MatchSeed[] = [...GROUP_MATCHES, ...KNOCKOUT_MATCHES]
