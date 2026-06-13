'use client'

import type { Team } from '@/types'

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

interface Props {
  teams: Team[]
  picks: Record<string, string>
  onChange: (picks: Record<string, string>) => void
}

export default function GroupWinnerPicker({ teams, picks, onChange }: Props) {
  function handlePick(groupId: string, teamId: string) {
    onChange({ ...picks, [groupId]: teamId })
  }

  const teamsByGroup: Record<string, Team[]> = {}
  for (const t of teams) {
    if (!teamsByGroup[t.group_id]) teamsByGroup[t.group_id] = []
    teamsByGroup[t.group_id].push(t)
  }

  const filledCount = Object.keys(picks).length

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs text-ink-faint">{filledCount}/12 groups picked</p>
        {filledCount === 12 && (
          <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            All done ✓
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {GROUPS.map((gId) => {
          const groupTeams = teamsByGroup[gId] ?? []
          const selectedId = picks[gId]
          return (
            <div key={gId} className="bg-gray-800 rounded-xl p-3 space-y-2">
              <p className="text-xs text-ink-faint font-semibold uppercase tracking-widest">Group {gId}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {groupTeams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handlePick(gId, t.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                      selectedId === t.id
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-900 text-ink-muted hover:bg-gray-700 hover:text-ink'
                    }`}
                  >
                    <span className="text-base leading-none shrink-0">{t.flag_emoji}</span>
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
