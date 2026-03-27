import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient as createSSRServerClient } from '@supabase/ssr'
import { type NextRequest, type NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// ---------------------------------------------------------------------------
// Legacy exports (backward compatible)
// ---------------------------------------------------------------------------

/** Basic browser client for client components (no cookie management). */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** Server client using the service role key for API routes. */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  )
}

// ---------------------------------------------------------------------------
// Auth-aware exports (use @supabase/ssr)
// ---------------------------------------------------------------------------

/** Auth-aware browser client for client components. */
export function createSupabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/** Auth-aware server client for Server Components / Route Handlers. */
export async function createSupabaseServer() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll can throw when called from a Server Component (read-only
          // cookie store). The middleware will handle refreshing the session
          // in that case, so we can safely ignore the error here.
        }
      },
    },
  })
}

/**
 * Auth-aware server client that also returns the authenticated user.
 * Use this in API route handlers that require authentication.
 */
export async function getSupabaseWithUser() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const supabase = createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options)
          } catch (e) {}
        })
      },
    },
  })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

/** Auth-aware client for Next.js middleware. */
export function createSupabaseMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}
