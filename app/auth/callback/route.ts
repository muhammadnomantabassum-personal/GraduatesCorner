import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
  }

  // ── Read role info from cookies (set BEFORE Google redirect) ──────────────
  // Google strips custom query params from redirectTo, so we persist them in
  // short-lived cookies (10 min) that survive the round-trip.
  const cookieStore = await cookies()
  const roleParam = cookieStore.get('gc_pending_role')?.value || null
  const isReg = cookieStore.get('gc_pending_reg')?.value === 'true'
  const displayName = cookieStore.get('gc_pending_name')?.value
    ? decodeURIComponent(cookieStore.get('gc_pending_name')!.value)
    : null

  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session?.user) {
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
  }

  const userId = session.user.id
  const meta = session.user.user_metadata ?? {}

  // Resolve the display name from cookies → Google metadata → email prefix
  const resolvedName =
    displayName ||
    meta.full_name ||
    meta.name ||
    session.user.email?.split('@')[0] ||
    'User'

  // ── Check existing profile ─────────────────────────────────────────────────
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('type, created_at')
    .eq('id', userId)
    .single()

  // Helper: clear pending cookies and redirect
  const redirectWithCookiesCleared = (destination: string) => {
    const response = NextResponse.redirect(destination)
    response.cookies.set('gc_pending_role', '', { path: '/', maxAge: 0 })
    response.cookies.set('gc_pending_reg', '', { path: '/', maxAge: 0 })
    response.cookies.set('gc_pending_name', '', { path: '/', maxAge: 0 })
    return response
  }

  // ── Determine if this is a brand-new Google user ───────────────────────────
  // A returning user will have meta.type set (we always call updateUser after
  // creating their profile). A brand-new user has no meta.type yet.
  const isNewUser = !meta.type

  // ── NEW USER (first time with Google) ─────────────────────────────────────
  // Works for both /register and /login — whenever it's a first-time Google auth.
  if (isNewUser || isReg) {
    const resolvedRole = roleParam || 'student'

    // The DB trigger already created a profile with type='student'.
    // Upsert overwrites it with the role the user actually selected.
    await supabase.from('profiles').upsert({
      id: userId,
      name: resolvedName,
      email: session.user.email,
      type: resolvedRole,
      organization: resolvedRole !== 'student' ? resolvedName : null,
    }, { onConflict: 'id' })

    // Write role into auth user_metadata so buildFallbackUser reads it correctly.
    // This is what distinguishes a "registered" user from a "new" user on next login.
    await supabase.auth.updateUser({ data: { type: resolvedRole } })

    // Show signup success banner only on the register flow
    const suffix = isReg ? '?signup=success' : ''
    return redirectWithCookiesCleared(`${origin}/dashboard/${resolvedRole}${suffix}`)
  }

  // ── RETURNING USER (meta.type is set from a previous login) ───────────────
  // Trust the DB profile as the source of truth — never overwrite with the
  // cookie role, since the cookie may be stale or from a different tab.
  const profileType = existingProfile?.type || meta.type

  // Sync auth metadata if it somehow drifted from the DB profile
  if (meta.type !== profileType) {
    await supabase.auth.updateUser({ data: { type: profileType } })
  }

  return redirectWithCookiesCleared(`${origin}/dashboard/${profileType}`)
}
