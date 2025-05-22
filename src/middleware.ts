import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Define your JWT secret or use environment variable
const secret = process.env.NEXTAUTH_SECRET

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Fetch the token/session (null if not logged in)
  const token = await getToken({ req, secret })

  // If user is NOT logged in
  if (!token) {
    // Block /dashboard and /admin routes if not logged in
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/admin')
    ) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    // Allow access to login, verify, public routes
    return NextResponse.next()
  }

  // User IS logged in

  // Block /login and /verify if already logged in
  if (pathname === '/login' || pathname === '/verify') {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Restrict /admin routes only for usertype ADMIN
  if (pathname.startsWith('/admin')) {
    if (token.usertype !== 'ADMIN') {
      // Redirect non-admin users trying to access admin pages
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard' // or some unauthorized page
      return NextResponse.redirect(url)
    }
  }

  // Allow everything else
  return NextResponse.next()
}

// Specify paths where this middleware applies
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/verify'],
}
