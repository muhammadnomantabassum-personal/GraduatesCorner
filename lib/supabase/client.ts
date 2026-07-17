import { createBrowserClient } from '@supabase/ssr'

let cachedClient: any = null

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
      onAuthStateChange: (callback: (event: string, session: null) => void) => {
        queueMicrotask(() => callback('INITIAL_SESSION', null))
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
          error: null,
        }
      },
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
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // During builds or preview environments without Supabase secrets,
    // return a safe stub client so prerendering does not fail.
    if (typeof window === 'undefined') {
      console.warn('[supabase] Missing public configuration; using the build stub.')
    }
    cachedClient = createStubClient()
    return cachedClient
  }

  cachedClient = createBrowserClient(url, key)
  return cachedClient
}
