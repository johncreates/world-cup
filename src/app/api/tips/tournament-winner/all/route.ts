import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireParticipant } from '@/lib/api-auth'

// Returns all participants' tournament winner picks — only after requester has submitted their own
export async function GET(request: NextRequest) {
  const auth = await requireParticipant(request)
  if (auth instanceof Response) return auth
  const { participant } = auth

  const supabase = await createClient()

  // Check if the requester has made their own pick first
  const { data: self } = await supabase
    .from('participants')
    .select('tournament_winner_id')
    .eq('id', participant.id)
    .single()

  if (!self?.tournament_winner_id) {
    return NextResponse.json({ locked: true, message: 'Pick your tournament winner first to see others', picks: [] })
  }

  const { data } = await supabase
    .from('participants')
    .select('nickname, tournament_winner:teams!participants_tournament_winner_id_fkey(id, name, flag_emoji, code)')
    .not('tournament_winner_id', 'is', null)
    .eq('is_admin', false)
    .order('nickname')

  const counts: Record<string, { team: any; count: number }> = {}
  for (const p of (data ?? [])) {
    const t = (p as any).tournament_winner
    if (!t) continue
    if (!counts[t.id]) counts[t.id] = { team: t, count: 0 }
    counts[t.id].count++
  }

  const total = Object.values(counts).reduce((s, c) => s + c.count, 0)
  const picks = Object.values(counts)
    .map((c) => ({ ...c.team, count: c.count, percentage: total ? Math.round((c.count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ locked: false, picks, total })
}
