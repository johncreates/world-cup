'use client'

import type { Team } from '@/types'

interface Props {
  teams: Team[]
  pick1Id: string
  pick2Id: string
  pick3Id: string
  onChange: (picks: { pick1Id: string; pick2Id: string; pick3Id: string }) => void
}

const LABELS = [
  { key: 'pick1Id' as const, emoji: '🥇', label: 'Champion' },
  { key: 'pick2Id' as const, emoji: '🥈', label: 'Runner-up' },
  { key: 'pick3Id' as const, emoji: '🥉', label: 'Third Place' },
]

export default function Top3Picker({ teams, pick1Id, pick2Id, pick3Id, onChange }: Props) {
  const picks = { pick1Id, pick2Id, pick3Id }

  function handleChange(field: 'pick1Id' | 'pick2Id' | 'pick3Id', value: string) {
    onChange({ ...picks, [field]: value })
  }

  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-3">
      {LABELS.map(({ key, emoji, label }) => {
        const others = Object.entries(picks)
          .filter(([k]) => k !== key)
          .map(([, v]) => v)
          .filter(Boolean)

        const available = sorted.filter((t) => !others.includes(t.id) || t.id === picks[key])

        return (
          <div key={key}>
            <label className="text-xs text-ink-faint uppercase tracking-wide font-medium block mb-1.5">
              {emoji} {label}
            </label>
            <select
              value={picks[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-ink text-sm focus:outline-none focus:border-yellow-400 appearance-none"
            >
              <option value="">— Choose a team —</option>
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.flag_emoji} {t.name} (Group {t.group_id})
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}
