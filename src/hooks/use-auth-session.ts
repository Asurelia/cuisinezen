
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
    // Wait until loading is false to make decisions
    if (loading) return;

    const isAppRoute = APP_ROUTES.some(route => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

    // If Firebase isn't set up, anyone on an app route gets sent to login.
    if (!isFirebaseConfigured && isAppRoute) {
        router.replace('/login');
        return;
    }

    // This block only runs if Firebase is configured.
    if (isFirebaseConfigured) {
        // If there's no user and they're on a protected route, redirect to login.
        if (!user && isAppRoute) {
            router.replace('/login');
            return;
        }
    
        // If there is a user and they're on an auth route (like /login), send them to the app.
        if (user && isAuthRoute) {
            router.replace('/inventory');
            return;
        }
    }

  }, [user, loading, isFirebaseConfigured, pathname, router]);
};
