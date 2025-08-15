
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, isAdmin as checkIsAdmin, isConfigValid } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';

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

const FirebaseWarning = () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-lg">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Configuration Firebase manquante !</AlertTitle>
            <AlertDescription>
                <p>L'application n'a pas pu se connecter à Firebase. Veuillez remplir les informations de votre projet dans le fichier :</p>
                <code className="my-2 block rounded-md bg-muted p-2 text-sm font-mono">src/lib/firebase.ts</code>
                <p>Vous pouvez obtenir ces informations depuis les paramètres de votre projet dans la console Firebase.</p>
            </AlertDescription>
        </Alert>
    </div>
)


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isConfigValid) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, (user) => {
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
    if (!auth) return Promise.reject(new Error("Firebase not configured."));
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signOutUser = () => {
    if (!isConfigValid) {
        router.push('/login');
        return Promise.resolve();
    }
    if (!auth) return Promise.reject(new Error("Firebase not configured."));
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    isAdmin,
    signInUser,
    signOutUser,
  };

  if (!isConfigValid) {
    return <FirebaseWarning />;
  }

  if (loading) {
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
