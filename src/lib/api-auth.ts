import { createClient } from '@/lib/supabase/server'
import type { Participant } from '@/types'

export async function resolveParticipant(request: Request): Promise<Participant | null> {
  const token = request.headers.get('x-participant-token')
  if (!token) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('participants')
    .select('id, nickname, is_admin, created_at')
    .eq('auth_token', token)
    .single()
  if (!data) return null
  // Update last_seen_at in background (fire and forget)
  supabase.from('participants').update({ last_seen_at: new Date().toISOString() }).eq('auth_token', token)
  return data as Participant
}

export async function requireParticipant(request: Request): Promise<{ participant: Participant } | Response> {
  const participant = await resolveParticipant(request)
  if (!participant) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  return { participant }
}

export async function requireAdmin(request: Request): Promise<{ participant: Participant } | Response> {
  const result = await requireParticipant(request)
  if (result instanceof Response) return result
  if (!result.participant.is_admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }
  return result
}
