
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const AUTH_COOKIE_NAME = 'firebase-auth-token';

  // Routes protégées qui nécessitent une authentification
  const protectedRoutes = ['/inventory', '/menu', '/recipes', '/shopping-list', '/account'];
  // Routes d'authentification
  const authRoutes = ['/login'];

  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  if (!authToken && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/inventory', request.url));
  }
  
  return NextResponse.next();
}

// Spécifie les routes sur lesquelles ce middleware doit s'exécuter.
export const config = {
  matcher: ['/inventory/:path*', '/menu/:path*', '/recipes/:path*', '/shopping-list/:path*', '/account/:path*', '/login'],
}
