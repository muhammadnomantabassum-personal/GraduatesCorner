import { createBrowserClient } from '@supabase/ssr'

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
      signInWithPassword: empty,
      signOut: empty,
      exchangeCodeForSession: empty,
      updateUser: empty,
      onAuthStateChange: () => ({ data: null, unsubscribe: () => {} }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
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

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // During builds or preview environments without Supabase secrets,
    // return a safe stub client so prerendering does not fail.
    console.warn('[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY; using stub client.')
    return createStubClient() as any
  }

  return createBrowserClient(url, key)
}
