import { NextResponse } from 'next/server'
import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Missing env vars', url_set: !!url, key_set: !!serviceKey })
  }

  const supabase = supabaseCreateClient(url, serviceKey, { auth: { persistSession: false } })

  // Try a simple select on participants
  const { data, error } = await supabase.from('participants').select('count').single()

  return NextResponse.json({
    url_prefix: url.slice(0, 30),
    key_role: 'service_role (confirmed)',
    query_error: error?.message ?? null,
    query_success: !error,
  })
}
