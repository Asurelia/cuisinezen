'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword, IdTokenResult } from 'firebase/auth';
import { auth, isAdmin as checkIsAdmin, isConfigValid } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isFirebaseConfigured: boolean;
  signInUser: (email: string, pass: string) => Promise<User>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isFirebaseConfigured: false,
  signInUser: async () => { throw new Error('AuthProvider not initialized'); },
  signOutUser: async () => { throw new Error('AuthProvider not initialized'); },
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

    const signInUser = async (email: string, pass: string): Promise<User> => {
      if (!isConfigValid || !auth) {
        throw new Error("Firebase n'est pas configuré.");
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const idToken = await userCredential.user.getIdToken();

      // Set the session cookie
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });
      return userCredential.user;
    };

    const signOutUser = async () => {
      if (!isConfigValid || !auth) {
        return Promise.resolve();
      }
      await signOut(auth);
       // Remove the session cookie
       await fetch('/api/auth/session', {
          method: 'DELETE',
      });
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
