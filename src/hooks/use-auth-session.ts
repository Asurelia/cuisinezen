
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { usePathname, useRouter } from 'next/navigation';

const APP_ROUTES = ['/inventory', '/menu', '/recipes', '/shopping-list', '/account'];
const AUTH_ROUTES = ['/login', '/signup'];

/**
 * This hook manages session state and handles redirection based on
 * authentication status. It's designed to be used in layouts to protect
 * routes.
 */
export const useAuthSession = () => {
  const { user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until loading is false and firebase config is checked
    if (loading) return;

    const isAppRoute = APP_ROUTES.some(route => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

    // If Firebase is not configured, redirect all app routes to login
    if (!isFirebaseConfigured && isAppRoute) {
        router.replace('/login');
        return;
    }

    if (isFirebaseConfigured) {
        // If user is not logged in and tries to access a protected app route
        if (!user && isAppRoute) {
            router.replace('/login');
            return;
        }
    
        // If user is logged in and tries to access an auth route (like /login)
        if (user && isAuthRoute) {
            router.replace('/inventory');
            return;
        }
    }

  }, [user, loading, isFirebaseConfigured, pathname, router]);

  // Return any session-related state if needed by components
  return { user, loading, isFirebaseConfigured };
};
