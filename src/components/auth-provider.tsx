'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isAdmin as checkIsAdmin, isConfigValid } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isFirebaseConfigured: boolean;
  signInUser: (email: string, pass: string) => Promise<any>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isFirebaseConfigured: false,
  signInUser: async () => {},
  signOutUser: async () => {},
});

const APP_ROUTES = ['/inventory', '/menu', '/recipes', '/shopping-list', '/account'];
const AUTH_ROUTES = ['/login', '/signup'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);

    if (!isConfigValid) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => {
    const isAdmin = checkIsAdmin(user?.email);

    const signInUser = (email: string, pass: string) => {
      if (!isConfigValid || !auth) {
        return Promise.reject(new Error("Firebase n'est pas configuré."));
      }
      return signInWithEmailAndPassword(auth, email, pass);
    };

    const signOutUser = () => {
      if (!isConfigValid || !auth) {
        return Promise.resolve();
      }
      return signOut(auth);
    };

    return {
      user,
      loading,
      isAdmin,
      isFirebaseConfigured: isConfigValid,
      signInUser,
      signOutUser,
    };
  }, [user, loading]);

  useEffect(() => {
    if (!isClient || loading) return;

    const isAppRoute = APP_ROUTES.some(route => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

    if (!isConfigValid && isAppRoute) {
      router.replace('/login');
      return;
    }

    if (isConfigValid) {
      if (!user && isAppRoute) {
        router.replace('/login');
        return;
      }
      if (user && isAuthRoute) {
        router.replace('/inventory');
        return;
      }
    }
  }, [user, loading, isClient, isConfigValid, pathname, router]);


  if (loading) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <p>Chargement de l'application...</p>
        </div>
     )
  }

  // Prevent flash of content for protected routes
  const isAppRoute = APP_ROUTES.some(route => pathname.startsWith(route));
  if (!user && isAppRoute) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <p>Redirection vers la page de connexion...</p>
        </div>
     )
  }


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
