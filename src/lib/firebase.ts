
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Remplissez ceci avec votre propre configuration Firebase !
// Vous pouvez l'obtenir depuis la console Firebase de votre projet.
// ▼▼▼▼▼ REMPLACEZ TOUT CE BLOC PAR VOTRE CONFIGURATION ▼▼▼▼▼
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// ▲▲▲▲▲ FIN DE LA ZONE À REMPLACER ▲▲▲▲▲

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
