import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

function randomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = 'wc26-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const body = await request.json().catch(() => ({}))
  const { is_multi_use = true, max_uses = null, expires_in_days = null } = body

  const supabase = await createClient()

  const code = randomCode()
  const expires_at = expires_in_days
    ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabase
    .from('invite_codes')
    .insert({ code, is_multi_use, max_uses, expires_at })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  return NextResponse.json({ ...data, invite_url: `${baseUrl}/join?code=${data.code}` })
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  return NextResponse.json(
    data?.map((c) => ({ ...c, invite_url: `${baseUrl}/join?code=${c.code}` }))
  )
}
