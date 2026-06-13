import { NextRequest, NextResponse } from 'next/server'
import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { secret, nickname } = await request.json()

  const adminSecret = process.env.ADMIN_BOOTSTRAP_SECRET
  if (!adminSecret || secret !== adminSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  const supabase = supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: existing } = await supabase
    .from('participants')
    .select('id, nickname, auth_token')
    .eq('is_admin', true)
    .single()

  if (existing) {
    return NextResponse.json({
      message: 'Admin already exists',
      participant_id: existing.id,
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
    participant_id: participant.id,
    auth_token: participant.auth_token,
    nickname: participant.nickname,
  })
}
