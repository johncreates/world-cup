-- World Cup 2026 Tipping Bracket Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  group_id    CHAR(1) NOT NULL,
  flag_emoji  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_number            INT NOT NULL UNIQUE,
  stage                   TEXT NOT NULL CHECK (stage IN ('group','r32','r16','qf','sf','final')),
  group_id                CHAR(1),
  home_team_id            UUID REFERENCES teams(id),
  away_team_id            UUID REFERENCES teams(id),
  home_team_placeholder   TEXT,
  away_team_placeholder   TEXT,
  kickoff_at              TIMESTAMPTZ NOT NULL,
  venue                   TEXT,
  home_score              INT,
  away_score              INT,
  winner_team_id          UUID REFERENCES teams(id),
  result_confirmed_at     TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS matches_stage_idx ON matches(stage);
CREATE INDEX IF NOT EXISTS matches_kickoff_idx ON matches(kickoff_at);
CREATE INDEX IF NOT EXISTS matches_group_idx ON matches(group_id);

CREATE TABLE IF NOT EXISTS invite_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  is_multi_use  BOOLEAN NOT NULL DEFAULT TRUE,
  max_uses      INT,
  use_count     INT NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname    TEXT NOT NULL UNIQUE,
  auth_token  UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invite_code_id UUID REFERENCES invite_codes(id),
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS participants_token_idx ON participants(auth_token);

CREATE TABLE IF NOT EXISTS tips (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id        UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  match_id              UUID NOT NULL REFERENCES matches(id),
  predicted_home_score  INT,
  predicted_away_score  INT,
  predicted_winner_id   UUID REFERENCES teams(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_id, match_id)
);

CREATE INDEX IF NOT EXISTS tips_participant_idx ON tips(participant_id);
CREATE INDEX IF NOT EXISTS tips_match_idx ON tips(match_id);

-- ─────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────

ALTER TABLE teams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips         ENABLE ROW LEVEL SECURITY;

-- Teams: public read
CREATE POLICY "teams_read_public" ON teams FOR SELECT USING (true);

-- Matches: public read
CREATE POLICY "matches_read_public" ON matches FOR SELECT USING (true);

-- Participants: public read (nicknames visible on leaderboard)
CREATE POLICY "participants_read_public" ON participants FOR SELECT USING (true);

-- Invite codes: no public read (only via service role in API routes)
-- (no SELECT policy = no access via anon key)

-- Tips: no anon access (all reads/writes go through API routes with service role)
-- (no SELECT/INSERT/UPDATE policy = no access via anon key)

-- ─────────────────────────────────────────
-- Leaderboard view
-- ─────────────────────────────────────────

CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id   AS participant_id,
  p.nickname,
  COALESCE(SUM(
    CASE
      WHEN m.result_confirmed_at IS NULL THEN 0
      WHEN m.stage = 'group' THEN
        CASE
          WHEN t.predicted_home_score IS NULL OR t.predicted_away_score IS NULL THEN 0
          WHEN
            SIGN(m.home_score - m.away_score) = SIGN(t.predicted_home_score - t.predicted_away_score)
          THEN
            1 + CASE WHEN t.predicted_home_score = m.home_score AND t.predicted_away_score = m.away_score THEN 2 ELSE 0 END
          ELSE 0
        END
      ELSE -- knockout
        CASE
          WHEN t.predicted_winner_id IS NOT NULL AND t.predicted_winner_id = m.winner_team_id THEN
            CASE m.stage
              WHEN 'r32'   THEN 2
              WHEN 'r16'   THEN 3
              WHEN 'qf'    THEN 4
              WHEN 'sf'    THEN 6
              WHEN 'final' THEN 8
              ELSE 0
            END
          ELSE 0
        END
    END
  ), 0) AS total_points,
  COUNT(DISTINCT CASE WHEN t.id IS NOT NULL THEN t.match_id END)::int AS total_tips
FROM participants p
LEFT JOIN tips t ON t.participant_id = p.id
LEFT JOIN matches m ON m.id = t.match_id
WHERE p.is_admin = FALSE
GROUP BY p.id, p.nickname
ORDER BY total_points DESC, p.nickname ASC;
