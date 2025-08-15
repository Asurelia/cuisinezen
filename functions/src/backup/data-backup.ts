import * as functions from "firebase-functions";
import { db, storage } from "../utils/firebase-admin";
import { COLLECTIONS, BACKUP_SETTINGS, COST_OPTIMIZATION } from "../utils/constants";
import { BackupData } from "../types";
import { format } from "date-fns";

/**
 * Backup automatique quotidien des données
 * Optimisé pour minimiser les coûts avec compression et rétention
 */
export const dailyDataBackup = functions
  .runWith({
    timeoutSeconds: COST_OPTIMIZATION.FUNCTION_TIMEOUT,
    memory: "512MB", // Plus de mémoire pour le backup
    maxInstances: 1, // Une seule instance pour éviter conflicts
  })
  .region("europe-west1")
  .pubsub.schedule("0 2 * * *") // Chaque jour à 2h du matin
  .timeZone("Europe/Paris")
  .onRun(async (context) => {
    try {
      console.log("Début du backup automatique des données");
      
      const backupData = await collectAllData();
      const backupId = await saveBackup(backupData);
      
      // Nettoyer les anciens backups
      await cleanOldBackups();
      
      console.log(`Backup complété avec succès: ${backupId}`);
      
      return { 
        success: true, 
        backupId,
        dataSize: JSON.stringify(backupData).length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error("Erreur lors du backup:", error);
      throw error;
    }
  });

/**
 * Backup manuel déclenché par l'utilisateur
 */
export const manualBackup = functions
  .runWith({
    timeoutSeconds: 300,
    memory: "512MB",
  })
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "L'utilisateur doit être authentifié"
      );
    }

    try {
      console.log("Backup manuel déclenché");
      
      const backupData = await collectAllData();
      const backupId = await saveBackup(backupData, { 
        manual: true, 
        userId: context.auth.uid 
      });
      
      return {
        success: true,
        backupId,
        message: "Backup créé avec succès",
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error("Erreur backup manuel:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la création du backup"
      );
    }
  });

/**
 * Restauration des données depuis un backup
 */
export const restoreFromBackup = functions
  .runWith({
    timeoutSeconds: 600, // Plus de temps pour la restauration
    memory: "1GB",
  })
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "L'utilisateur doit être authentifié"
      );
    }

    const { backupId, confirm } = data;
    
    if (!backupId || !confirm) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "backupId et confirmation requis"
      );
    }

    try {
      console.log(`Restauration depuis backup: ${backupId}`);
      
      // Récupérer le backup
      const backupDoc = await db.collection(COLLECTIONS.BACKUPS).doc(backupId).get();
      
      if (!backupDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Backup non trouvé"
        );
      }

      const backupData = backupDoc.data() as BackupData;
      
      // Créer un backup de l'état actuel avant restauration
      const currentData = await collectAllData();
      await saveBackup(currentData, { 
        preRestore: true, 
        originalBackupId: backupId 
      });
      
      // Restaurer les données
      await restoreData(backupData);
      
      console.log("Restauration complétée avec succès");
      
      return {
        success: true,
        restoredFrom: backupId,
        restoredAt: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la restauration"
      );
    }
  });

/**
 * Lister les backups disponibles
 */
export const listBackups = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
  })
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "L'utilisateur doit être authentifié"
      );
    }

    try {
      const backupsSnapshot = await db.collection(COLLECTIONS.BACKUPS)
        .orderBy("timestamp", "desc")
        .limit(50) // Limiter pour éviter timeouts
        .get();

      const backups = backupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ne pas inclure les données complètes dans la liste
        products: undefined,
        recipes: undefined,
      }));

      return {
        success: true,
        backups,
        total: backups.length,
      };
      
    } catch (error) {
      console.error("Erreur listage backups:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors du listage des backups"
      );
    }
  });

/**
 * Collecter toutes les données pour le backup
 */
async function collectAllData(): Promise<BackupData> {
  console.log("Collecte des données...");
  
  const [productsSnapshot, recipesSnapshot, settingsSnapshot] = await Promise.all([
    db.collection(COLLECTIONS.PRODUCTS).get(),
    db.collection(COLLECTIONS.RECIPES).get(),
    db.collection(COLLECTIONS.SETTINGS).get(),
  ]);

  const products = productsSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }));
  
  const recipes = recipesSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }));
  
  const settings: Record<string, any> = {};
  settingsSnapshot.docs.forEach(doc => {
    settings[doc.id] = doc.data();
  });

  return {
    timestamp: new Date(),
    products,
    recipes,
    settings,
    version: "1.0.0",
  };
}

/**
 * Sauvegarder les données
 */
async function saveBackup(backupData: BackupData, metadata: any = {}): Promise<string> {
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  const backupId = `backup_${timestamp}`;
  
  // Sauvegarder dans Firestore
  await db.collection(COLLECTIONS.BACKUPS).doc(backupId).set({
    ...backupData,
    metadata: {
      ...metadata,
      createdAt: new Date(),
      size: JSON.stringify(backupData).length,
    },
  });

  // Optionnel: Sauvegarder aussi dans Cloud Storage pour les gros volumes
  if (BACKUP_SETTINGS.COMPRESSION) {
    await saveToCloudStorage(backupId, backupData);
  }

  return backupId;
}

/**
 * Sauvegarder dans Cloud Storage (optionnel)
 */
async function saveToCloudStorage(backupId: string, data: BackupData): Promise<void> {
  try {
    const bucket = storage.bucket();
    const fileName = `backups/${backupId}.json`;
    const file = bucket.file(fileName);
    
    await file.save(JSON.stringify(data, null, 2), {
      metadata: {
        contentType: "application/json",
        metadata: {
          backupId,
          timestamp: data.timestamp.toISOString(),
        },
      },
    });
    
    console.log(`Backup sauvegardé dans Cloud Storage: ${fileName}`);
  } catch (error) {
    console.error("Erreur sauvegarde Cloud Storage:", error);
    // Ne pas faire échouer le backup si Cloud Storage échoue
  }
}

/**
 * Restaurer les données
 */
async function restoreData(backupData: BackupData): Promise<void> {
  console.log("Début de la restauration...");
  
  const batch = db.batch();
  
  // Supprimer les données existantes (optionnel, selon la stratégie)
  // Pour l'instant, on écrase simplement
  
  // Restaurer les produits
  backupData.products.forEach((product: any) => {
    const ref = db.collection(COLLECTIONS.PRODUCTS).doc(product.id);
    batch.set(ref, product);
  });
  
  // Restaurer les recettes
  backupData.recipes.forEach((recipe: any) => {
    const ref = db.collection(COLLECTIONS.RECIPES).doc(recipe.id);
    batch.set(ref, recipe);
  });
  
  // Restaurer les paramètres
  Object.entries(backupData.settings).forEach(([key, value]) => {
    const ref = db.collection(COLLECTIONS.SETTINGS).doc(key);
    batch.set(ref, value);
  });
  
  await batch.commit();
  console.log("Restauration terminée");
}

/**
 * Nettoyer les anciens backups
 */
async function cleanOldBackups(): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_SETTINGS.RETENTION_DAYS);
    
    const oldBackupsSnapshot = await db.collection(COLLECTIONS.BACKUPS)
      .where("timestamp", "<", cutoffDate)
      .get();
    
    if (oldBackupsSnapshot.empty) {
      console.log("Aucun ancien backup à nettoyer");
      return;
    }
    
    const batch = db.batch();
    let deleteCount = 0;
    
    oldBackupsSnapshot.docs.forEach(doc => {
      if (deleteCount < BACKUP_SETTINGS.MAX_BACKUPS) {
        batch.delete(doc.ref);
        deleteCount++;
      }
    });
    
    await batch.commit();
    console.log(`${deleteCount} anciens backups supprimés`);
    
    // Nettoyer aussi Cloud Storage si utilisé
    await cleanCloudStorageBackups(cutoffDate);
    
  } catch (error) {
    console.error("Erreur nettoyage anciens backups:", error);
    // Ne pas faire échouer le backup principal
  }
}

/**
 * Nettoyer les backups dans Cloud Storage
 */
async function cleanCloudStorageBackups(cutoffDate: Date): Promise<void> {
  try {
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: "backups/" });
    
    for (const file of files) {
      const metadata = await file.getMetadata();
      const creationTime = new Date(metadata[0].timeCreated);
      
      if (creationTime < cutoffDate) {
        await file.delete();
        console.log(`Backup Cloud Storage supprimé: ${file.name}`);
      }
    }
  } catch (error) {
    console.error("Erreur nettoyage Cloud Storage:", error);
  }
}