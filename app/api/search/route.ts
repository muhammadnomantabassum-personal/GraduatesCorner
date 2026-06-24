import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const rateLimitWindowMs = 60_000
const maxRequestsPerWindow = 30
const requestLog = new Map<string, { count: number; resetAt: number }>()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const clientId = forwardedFor || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()

  if (requestLog.size > 1000) {
    for (const [key, value] of requestLog.entries()) {
      if (value.resetAt <= now) requestLog.delete(key)
    }
  }

  const current = requestLog.get(clientId)

  if (!current || current.resetAt <= now) {
    requestLog.set(clientId, { count: 1, resetAt: now + rateLimitWindowMs })
  } else {
    current.count += 1
    if (current.count > maxRequestsPerWindow) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()

  // Call the global_search RPC we created in SQL
  const { data, error } = await supabase.rpc('global_search', {
    search_term: query
  })

  if (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }

  return NextResponse.json({
    results: data,
    query,
    limit: 20
  })
}
