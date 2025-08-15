
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getPerformance, type FirebasePerformance } from "firebase/performance";

// Configuration Firebase de l'application
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

// Vérifie si la configuration est valide (contient une clé API non vide)
const isConfigValid = !!firebaseConfig.apiKey;

// Initialise Firebase uniquement si la configuration est valide
const app = isConfigValid && !getApps().length ? initializeApp(firebaseConfig) : (isConfigValid && getApps().length ? getApp() : null);

const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const storage = app ? getStorage(app) : null;

// Initialisation Analytics et Performance Monitoring
let analytics: Analytics | null = null;
let performance: FirebasePerformance | null = null;

// Initialisation côté client uniquement
if (typeof window !== 'undefined' && app) {
  // Analytics
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
  
  // Performance Monitoring
  try {
    performance = getPerformance(app);
  } catch (error) {
    console.warn('Performance monitoring not available:', error);
  }
}

// --- GESTION DES RÔLES ---
// Les emails administrateurs devraient être stockés dans les variables d'environnement
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];

const isAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

export { app, auth, db, storage, analytics, performance, isAdmin, isConfigValid };
