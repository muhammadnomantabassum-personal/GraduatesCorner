import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    results: data,
    query,
    limit: 20
  })
}
