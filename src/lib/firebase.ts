
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Remplissez ceci avec votre propre configuration Firebase !
// Vous pouvez l'obtenir depuis la console Firebase de votre projet.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialise Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

// --- GESTION DES RÔLES ---
// Pour désigner un ou plusieurs administrateurs, ajoutez leur email ici.
// C'est une méthode simple et sécurisée pour commencer.
// Pour une sécurité accrue, vous pourriez utiliser les "Custom Claims" de Firebase.
const ADMIN_EMAILS = [
    'admin@cuisinezen.com', // <-- Remplacez par votre email d'administrateur
];

const isAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}


export { app, auth, db, isAdmin };
