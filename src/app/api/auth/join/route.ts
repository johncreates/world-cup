import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { code, nickname } = await request.json()

  if (!code || !nickname?.trim()) {
    return NextResponse.json({ error: 'Code and nickname are required' }, { status: 400 })
  }

  const cleanNickname = nickname.trim().slice(0, 32)
  if (!/^[a-zA-Z0-9_\- ]+$/.test(cleanNickname)) {
    return NextResponse.json({ error: 'Nickname can only contain letters, numbers, spaces, hyphens and underscores' }, { status: 400 })
  }

  const supabase = await createClient()

  // Validate invite code
  const { data: inviteCode } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (!inviteCode) {
    return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 400 })
  }
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 })
  }
  if (!inviteCode.is_multi_use && inviteCode.use_count > 0) {
    return NextResponse.json({ error: 'This invite link has already been used' }, { status: 400 })
  }
  if (inviteCode.max_uses && inviteCode.use_count >= inviteCode.max_uses) {
    return NextResponse.json({ error: 'This invite link has reached its limit' }, { status: 400 })
  }

  // Check nickname uniqueness
  const { data: existing } = await supabase
    .from('participants')
    .select('id')
    .ilike('nickname', cleanNickname)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'That nickname is already taken, pick another' }, { status: 400 })
  }

  // Create participant
  const { data: participant, error } = await supabase
    .from('participants')
    .insert({ nickname: cleanNickname, invite_code_id: inviteCode.id })
    .select('id, nickname, auth_token, is_admin')
    .single()

  if (error || !participant) {
    console.error('Create participant error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }

  // Increment use count
  await supabase
    .from('invite_codes')
    .update({ use_count: inviteCode.use_count + 1 })
    .eq('id', inviteCode.id)

  return NextResponse.json({
    auth_token: participant.auth_token,
    participant_id: participant.id,
    nickname: participant.nickname,
    is_admin: participant.is_admin,
  })
}
