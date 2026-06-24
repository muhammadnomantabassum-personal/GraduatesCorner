import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT remove this getUser() call.
  // It ensures the session is refreshed if expired and cookies are updated.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userType: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single()

    userType = profile?.type ?? null
  }

  // If unauthenticated and on a protected route, redirect to home
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Admin route protection
  if (
    (!user || userType !== 'admin') &&
    request.nextUrl.pathname.startsWith('/n_admin/dashboard')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/n_admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
