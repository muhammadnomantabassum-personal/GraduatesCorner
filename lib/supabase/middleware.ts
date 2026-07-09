import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
}

async function verifySignedAdminToken(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return false

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signature),
    new TextEncoder().encode(encodedPayload)
  )

  if (!isValid) return false

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload)))
    return payload.role === 'admin' && payload.sub === 'legacy-admin' && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

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

  const isSignedAdminSession = await verifySignedAdminToken(
    request.cookies.get('gc_admin_token')?.value,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

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
    !isSignedAdminSession &&
    (!user || userType !== 'admin') &&
    request.nextUrl.pathname.startsWith('/n_admin/dashboard')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/n_admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
