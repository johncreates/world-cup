export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
export type MatchStatus = 'scheduled' | 'live' | 'finished'
export type Outcome = 'home' | 'draw' | 'away'

export interface Team {
  id: string
  code: string
  name: string
  group_id: string
  flag_emoji: string
}

export interface Match {
  id: string
  match_number: number
  stage: Stage
  group_id: string | null
  home_team_id: string | null
  away_team_id: string | null
  home_team_placeholder: string | null
  away_team_placeholder: string | null
  kickoff_at: string
  venue: string | null
  home_score: number | null
  away_score: number | null
  winner_team_id: string | null
  result_confirmed_at: string | null
  // Joined
  home_team?: Team | null
  away_team?: Team | null
  winner_team?: Team | null
}

export interface Participant {
  id: string
  nickname: string
  is_admin: boolean
  created_at: string
}

export interface InviteCode {
  id: string
  code: string
  is_multi_use: boolean
  max_uses: number | null
  use_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface Tip {
  id: string
  participant_id: string
  match_id: string
  predicted_home_score: number | null
  predicted_away_score: number | null
  predicted_winner_id: string | null
  created_at: string
  updated_at: string
  // Joined
  participant?: Participant
  match?: Match
  predicted_winner?: Team | null
}

export interface LeaderboardEntry {
  participant_id: string
  nickname: string
  total_points: number
  group_points: number
  r32_points: number
  r16_points: number
  qf_points: number
  sf_points: number
  final_points: number
  correct_tips: number
  total_tips: number
}

export interface TipWithPoints extends Tip {
  points: number
}

export interface MatchStats {
  match_id: string
  total_tips: number
  team_picks: { team_id: string; team_name: string; count: number; percentage: number }[]
  draw_picks?: number
  draw_percentage?: number
}

export interface Session {
  auth_token: string
  participant_id: string
  nickname: string
  is_admin: boolean
}
