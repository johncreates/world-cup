// FIFA World Cup 2026 — all 48 qualified teams
// Groups A–L, 4 teams each
// Host nations: USA (Group A), Canada (Group H), Mexico (Group A)
// NOTE: Verify against official FIFA draw results and update if needed.

export interface TeamSeed {
  code: string
  name: string
  group_id: string
  flag_emoji: string
}

export const TEAMS: TeamSeed[] = [
  // Group A — USA and Mexico as co-hosts
  { code: 'MEX', name: 'Mexico', group_id: 'A', flag_emoji: '🇲🇽' },
  { code: 'USA', name: 'United States', group_id: 'A', flag_emoji: '🇺🇸' },
  { code: 'URU', name: 'Uruguay', group_id: 'A', flag_emoji: '🇺🇾' },
  { code: 'PAN', name: 'Panama', group_id: 'A', flag_emoji: '🇵🇦' },

  // Group B
  { code: 'ARG', name: 'Argentina', group_id: 'B', flag_emoji: '🇦🇷' },
  { code: 'CHI', name: 'Chile', group_id: 'B', flag_emoji: '🇨🇱' },
  { code: 'PER', name: 'Peru', group_id: 'B', flag_emoji: '🇵🇪' },
  { code: 'AUS', name: 'Australia', group_id: 'B', flag_emoji: '🇦🇺' },

  // Group C
  { code: 'ENG', name: 'England', group_id: 'C', flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'SUI', name: 'Switzerland', group_id: 'C', flag_emoji: '🇨🇭' },
  { code: 'GRE', name: 'Greece', group_id: 'C', flag_emoji: '🇬🇷' },
  { code: 'BIH', name: 'Bosnia and Herzegovina', group_id: 'C', flag_emoji: '🇧🇦' },

  // Group D
  { code: 'NED', name: 'Netherlands', group_id: 'D', flag_emoji: '🇳🇱' },
  { code: 'SEN', name: 'Senegal', group_id: 'D', flag_emoji: '🇸🇳' },
  { code: 'JPN', name: 'Japan', group_id: 'D', flag_emoji: '🇯🇵' },
  { code: 'BHR', name: 'Bahrain', group_id: 'D', flag_emoji: '🇧🇭' },

  // Group E
  { code: 'FRA', name: 'France', group_id: 'E', flag_emoji: '🇫🇷' },
  { code: 'ALG', name: 'Algeria', group_id: 'E', flag_emoji: '🇩🇿' },
  { code: 'SVK', name: 'Slovakia', group_id: 'E', flag_emoji: '🇸🇰' },
  { code: 'THA', name: 'Thailand', group_id: 'E', flag_emoji: '🇹🇭' },

  // Group F
  { code: 'ESP', name: 'Spain', group_id: 'F', flag_emoji: '🇪🇸' },
  { code: 'MAR', name: 'Morocco', group_id: 'F', flag_emoji: '🇲🇦' },
  { code: 'CZE', name: 'Czech Republic', group_id: 'F', flag_emoji: '🇨🇿' },
  { code: 'NZL', name: 'New Zealand', group_id: 'F', flag_emoji: '🇳🇿' },

  // Group G
  { code: 'BRA', name: 'Brazil', group_id: 'G', flag_emoji: '🇧🇷' },
  { code: 'NGA', name: 'Nigeria', group_id: 'G', flag_emoji: '🇳🇬' },
  { code: 'COL', name: 'Colombia', group_id: 'G', flag_emoji: '🇨🇴' },
  { code: 'SDN', name: 'Sudan', group_id: 'G', flag_emoji: '🇸🇩' },

  // Group H — Canada as co-host
  { code: 'GER', name: 'Germany', group_id: 'H', flag_emoji: '🇩🇪' },
  { code: 'POR', name: 'Portugal', group_id: 'H', flag_emoji: '🇵🇹' },
  { code: 'TUN', name: 'Tunisia', group_id: 'H', flag_emoji: '🇹🇳' },
  { code: 'CAN', name: 'Canada', group_id: 'H', flag_emoji: '🇨🇦' },

  // Group I
  { code: 'ITA', name: 'Italy', group_id: 'I', flag_emoji: '🇮🇹' },
  { code: 'KOR', name: 'South Korea', group_id: 'I', flag_emoji: '🇰🇷' },
  { code: 'ECU', name: 'Ecuador', group_id: 'I', flag_emoji: '🇪🇨' },
  { code: 'VEN', name: 'Venezuela', group_id: 'I', flag_emoji: '🇻🇪' },

  // Group J
  { code: 'CRO', name: 'Croatia', group_id: 'J', flag_emoji: '🇭🇷' },
  { code: 'BEL', name: 'Belgium', group_id: 'J', flag_emoji: '🇧🇪' },
  { code: 'HND', name: 'Honduras', group_id: 'J', flag_emoji: '🇭🇳' },
  { code: 'CHN', name: 'China PR', group_id: 'J', flag_emoji: '🇨🇳' },

  // Group K
  { code: 'PAR', name: 'Paraguay', group_id: 'K', flag_emoji: '🇵🇾' },
  { code: 'DEN', name: 'Denmark', group_id: 'K', flag_emoji: '🇩🇰' },
  { code: 'IRN', name: 'Iran', group_id: 'K', flag_emoji: '🇮🇷' },
  { code: 'GTM', name: 'Guatemala', group_id: 'K', flag_emoji: '🇬🇹' },

  // Group L
  { code: 'EGY', name: 'Egypt', group_id: 'L', flag_emoji: '🇪🇬' },
  { code: 'SAU', name: 'Saudi Arabia', group_id: 'L', flag_emoji: '🇸🇦' },
  { code: 'UKR', name: 'Ukraine', group_id: 'L', flag_emoji: '🇺🇦' },
  { code: 'CIV', name: "Côte d'Ivoire", group_id: 'L', flag_emoji: '🇨🇮' },
]

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export function getTeamsByGroup(groupId: string): TeamSeed[] {
  return TEAMS.filter((t) => t.group_id === groupId)
}
