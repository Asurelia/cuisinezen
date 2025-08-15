
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isAdmin as checkIsAdmin, isConfigValid } from '@/lib/firebase';
import { usePathname } from 'next/navigation';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
