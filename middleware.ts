import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const ALLOWED_ROLES = ['student', 'mentor', 'admin']

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const path = request.nextUrl.pathname
  const isAuthRoute    = path.startsWith('/login') || path.startsWith('/pending') || path.startsWith('/programs')
  const isAdminRoute   = path.startsWith('/admin')
  const isApiWebhook   = path.startsWith('/api/webhooks')
  const isSignout      = path.startsWith('/auth/signout')
  const isCallback     = path.startsWith('/auth/callback')

  // Skip auth for webhooks, callback, and signout
  if (isApiWebhook || isCallback || isSignout) return response

  // Redirect unauthenticated users to login
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login (but not from /pending)
  if (user && path === '/login') {
    return NextResponse.redirect(new URL('/today', request.url))
  }

  // For authenticated users accessing app routes, check role
  if (user && !isAuthRoute) {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'student'

    // No access role — send to store page
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/programs', request.url))
    }

    // Guard admin routes
    if (isAdminRoute) {
      if (!['mentor', 'admin'].includes(role)) {
        return NextResponse.redirect(new URL('/today', request.url))
      }
      // Mentors can only access /admin/students
      if (role === 'mentor' && !path.startsWith('/admin/students') && path !== '/admin') {
        return NextResponse.redirect(new URL('/admin/students', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
}
