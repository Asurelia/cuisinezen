import * as admin from "firebase-admin";

// Initialisation Firebase Admin (une seule fois)
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// Optimisation: réutiliser les connexions
export const getFirestore = () => db;
export const getAuth = () => auth;
export const getStorage = () => storage;

// Utilitaire pour les batch operations (optimisation coûts)
export const batchWrite = async (operations: Array<() => Promise<any>>, batchSize = 500) => {
  const batch = db.batch();
  let operationCount = 0;
  
  for (const operation of operations) {
    await operation();
    operationCount++;
    
    // Commit par batch pour éviter les limites
    if (operationCount >= batchSize) {
      await batch.commit();
      operationCount = 0;
    }
  }
  
  // Commit final si nécessaire
  if (operationCount > 0) {
    await batch.commit();
  }
};