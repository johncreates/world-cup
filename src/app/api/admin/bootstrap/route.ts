import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// One-time bootstrap: creates the admin account if none exists
// Call POST /api/admin/bootstrap with { secret: ADMIN_BOOTSTRAP_SECRET }
export async function POST(request: NextRequest) {
  const { secret, nickname } = await request.json()

  const adminSecret = process.env.ADMIN_BOOTSTRAP_SECRET
  if (!adminSecret || secret !== adminSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  const supabase = await createClient()

  // Check if admin already exists
  const { data: existing } = await supabase
    .from('participants')
    .select('id, nickname, auth_token')
    .eq('is_admin', true)
    .single()

  if (existing) {
    return NextResponse.json({
      message: 'Admin already exists',
      nickname: existing.nickname,
      auth_token: existing.auth_token,
    })
  }

  const adminNickname = nickname || 'admin'
  const { data: participant, error } = await supabase
    .from('participants')
    .insert({ nickname: adminNickname, is_admin: true })
    .select('id, nickname, auth_token, is_admin')
    .single()

  if (error || !participant) {
    return NextResponse.json({ error: error?.message || 'Failed to create admin' }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Admin created successfully',
    auth_token: participant.auth_token,
    nickname: participant.nickname,
    instructions: 'Store this auth_token — use it as x-participant-token for admin API calls and in the admin session.',
  })
}
