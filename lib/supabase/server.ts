import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Return a minimal stub Supabase client used during static builds
function createStubClient() {
  const empty = async () => ({ data: null, error: null })
  return {
    from: () => ({
      select: async () => ({ data: [], error: null }),
      insert: empty,
      update: empty,
      delete: empty,
    }),
    rpc: async () => ({ data: [], error: null }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: null, unsubscribe: () => {} }),
      signInWithPassword: empty,
      signOut: empty,
      exchangeCodeForSession: empty,
      updateUser: empty,
    },
    storage: {
      from: () => ({
        download: async () => ({ data: null, error: null }),
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  }
}

export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    // During static builds in environments without secrets (like forks or preview builds),
    // return a safe stub client so prerender can continue without failing the build.
    // Log a clear warning to help debugging in build logs.
    console.warn('[supabase] Missing SUPABASE URL or KEY; using stub client for build.')
    return createStubClient() as any
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
