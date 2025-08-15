'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isAdmin as checkIsAdmin, isConfigValid } from '@/lib/firebase';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFirebaseConfigured, setFirebaseConfigured] = useState(false);

  useEffect(() => {
    if (isConfigValid) {
        setFirebaseConfigured(true);
        const unsubscribe = onAuthStateChanged(auth!, (user) => {
            setUser(user);
            setIsAdmin(checkIsAdmin(user?.email));
            setLoading(false);
        });
        return () => unsubscribe();
    } else {
        setFirebaseConfigured(false);
        setLoading(false);
    }
  }, []);


  const signInUser = (email: string, pass: string) => {
    if (!auth) return Promise.reject(new Error("Firebase not configured."));
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signOutUser = () => {
    if (!isConfigValid || !auth) {
        return Promise.resolve();
    }
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    isAdmin,
    isFirebaseConfigured,
    signInUser,
    signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
