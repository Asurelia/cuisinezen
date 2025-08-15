
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pour le moment, ce middleware est une coquille vide.
// Nous y ajouterons la logique pour vérifier si un utilisateur est connecté.
// Si l'utilisateur n'est pas connecté et essaie d'accéder aux pages de l'application,
// il sera redirigé vers /login.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Liste des routes de l'application (protégées)
  const appRoutes = ['/inventory', '/menu', '/recipes', '/shopping-list'];

  // Nom du cookie qui contiendra le token d'authentification (à définir)
  const authCookie = request.cookies.get('firebase-auth-token'); 

  const isAppRoute = appRoutes.some(route => pathname.startsWith(route));
  
  // Si l'utilisateur essaie d'accéder à une page de l'application sans être connecté,
  // on le redirige vers la page de connexion.
  if (isAppRoute && !authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si l'utilisateur est connecté et essaie d'aller sur /login ou /signup,
  // on le redirige vers sa page principale (inventaire).
  if (authCookie && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
      return NextResponse.redirect(new URL('/inventory', request.url));
  }
  
  return NextResponse.next();
}

// Spécifie les routes sur lesquelles ce middleware doit s'exécuter.
export const config = {
  matcher: ['/inventory/:path*', '/menu/:path*', '/recipes/:path*', '/shopping-list/:path*', '/login', '/signup'],
}
