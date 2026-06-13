import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return NextResponse.json({
    url_set: !!url,
    url_prefix: url?.slice(0, 30) ?? 'MISSING',
    service_key_set: !!serviceKey,
    service_key_prefix: serviceKey?.slice(0, 20) ?? 'MISSING',
    anon_key_set: !!anonKey,
  })
}
