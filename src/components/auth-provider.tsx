
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, isAdmin as checkIsAdmin } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInUser: (email: string, pass: string) => Promise<any>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signInUser: async () => {},
  signOutUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAdmin(checkIsAdmin(user?.email));
      setLoading(false);

      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
      
      if (user && isAuthPage) {
        router.push('/inventory');
      }
      if (!user && !isAuthPage) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const signInUser = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signOutUser = () => {
    return signOut(auth);
  };


  const value = {
    user,
    loading,
    isAdmin,
    signInUser,
    signOutUser,
  };

  if(loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Chargement de l'application...</p>
        </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
