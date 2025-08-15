
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase de l'application
const firebaseConfig = {
  apiKey: "AIzaSyBJxzRAwN_Y2YHCYzkkzrARGZUVGtJT8Zs",
  authDomain: "cuisinezen.firebaseapp.com",
  projectId: "cuisinezen",
  storageBucket: "cuisinezen.appspot.com",
  messagingSenderId: "696328893008",
  appId: "1:696328893008:web:d1635f46b7095ba07d5755"
};

// Vérifie si la configuration est valide avant d'initialiser
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

// Initialise Firebase uniquement si la configuration est valide
const app = isConfigValid && !getApps().length ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);

const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// --- GESTION DES RÔLES ---
// Pour désigner un ou plusieurs administrateurs, ajoutez leur email ici.
// ▼▼▼▼▼ REMPLACEZ AVEC VOTRE EMAIL D'ADMINISTRATEUR ▼▼▼▼▼
const ADMIN_EMAILS = [
    'votre-email-admin@exemple.com',
];
// ▲▲▲▲▲ FIN DE LA ZONE À REMPLACER ▲▲▲▲▲

const isAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}


export { app, auth, db, isAdmin, isConfigValid };
