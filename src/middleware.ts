import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddleware } from '@/lib/supabase'

// Routes that do not require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  const supabase = createSupabaseMiddleware(request, response)

  // Refresh the session so cookies stay valid
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`))
  )

  // Unauthenticated users trying to access protected routes -> /login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated users visiting /login or /signup -> /dashboard (but allow / for landing)
  if (user && isPublicRoute && pathname !== '/') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico   (favicon)
     * - public assets (svg, png, jpg, etc.)
     * - /api routes   (API endpoints handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
