import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const isAdminSession = request.cookies.get('gc_admin_session')?.value === 'true'

  // If unauthenticated and on a protected route, redirect to home
  if (
    !user &&
    !isAdminSession &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Admin route protection
  if (
    !isAdminSession &&
    request.nextUrl.pathname.startsWith('/n_admin/dashboard')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/n_admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
