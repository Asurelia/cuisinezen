import * as functions from "firebase-functions";
import { db } from "../utils/firebase-admin";
import { COLLECTIONS, NOTIFICATION_SETTINGS, COST_OPTIMIZATION } from "../utils/constants";
import { Product, NotificationSettings } from "../types";
import { addDays, isAfter, isBefore, format } from "date-fns";

/**
 * Fonction de notification quotidienne des produits à péremption
 * Exécutée chaque jour à 8h du matin (timezone Europe/Paris)
 * Optimisée pour minimiser les coûts avec cache et batch processing
 */
export const dailyExpiryNotifications = functions
  .runWith({
    timeoutSeconds: COST_OPTIMIZATION.FUNCTION_TIMEOUT,
    memory: COST_OPTIMIZATION.MEMORY_SIZE,
    maxInstances: COST_OPTIMIZATION.MAX_INSTANCES,
  })
  .region("europe-west1") // Région proche pour réduire latence
  .pubsub.schedule("0 8 * * *") // Chaque jour à 8h
  .timeZone(NOTIFICATION_SETTINGS.TIMEZONE)
  .onRun(async (context) => {
    try {
      console.log("Début de la vérification des produits à péremption");
      
      // Récupérer les paramètres de notification (avec cache)
      const settingsDoc = await db.collection(COLLECTIONS.SETTINGS)
        .doc("notifications")
        .get();
      
      const settings: NotificationSettings = settingsDoc.exists 
        ? settingsDoc.data() as NotificationSettings
        : {
            enabled: true,
            daysBeforeExpiry: NOTIFICATION_SETTINGS.DEFAULT_EXPIRY_DAYS,
          };

      if (!settings.enabled) {
        console.log("Notifications désactivées");
        return;
      }

      // Date limite pour les alertes
      const alertDate = addDays(new Date(), settings.daysBeforeExpiry);
      
      // Récupérer tous les produits (optimisé avec pagination si nécessaire)
      const productsSnapshot = await db.collection(COLLECTIONS.PRODUCTS)
        .limit(1000) // Limiter pour éviter timeouts
        .get();

      const expiringProducts: Array<{
        product: Product;
        expiringBatches: Array<{
          batchId: string;
          quantity: number;
          expiryDate: Date;
          daysUntilExpiry: number;
        }>;
      }> = [];

      // Analyser chaque produit
      productsSnapshot.docs.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() } as Product;
        const expiringBatches: any[] = [];

        product.batches?.forEach((batch) => {
          if (batch.expiryDate) {
            const expiryDate = batch.expiryDate instanceof Date 
              ? batch.expiryDate 
              : new Date(batch.expiryDate);
            
            // Vérifier si le produit expire dans les jours configurés
            if (isBefore(expiryDate, alertDate) && isAfter(expiryDate, new Date())) {
              const daysUntilExpiry = Math.ceil(
                (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              
              expiringBatches.push({
                batchId: batch.id,
                quantity: batch.quantity,
                expiryDate,
                daysUntilExpiry,
              });
            }
          }
        });

        if (expiringBatches.length > 0) {
          expiringProducts.push({ product, expiringBatches });
        }
      });

      if (expiringProducts.length === 0) {
        console.log("Aucun produit proche de la péremption");
        return;
      }

      // Créer le message de notification
      const notificationMessage = createNotificationMessage(expiringProducts);
      
      // Sauvegarder la notification dans Firestore
      await db.collection(COLLECTIONS.NOTIFICATIONS).add({
        type: "expiry_alert",
        message: notificationMessage,
        products: expiringProducts.map(ep => ({
          id: ep.product.id,
          name: ep.product.name,
          expiringBatches: ep.expiringBatches,
        })),
        createdAt: new Date(),
        read: false,
      });

      console.log(`Notification créée pour ${expiringProducts.length} produits`);
      
      // Optionnel: Envoyer email ou notification push
      // await sendEmailNotification(settings.email, notificationMessage);
      
      return { 
        success: true, 
        expiringProductsCount: expiringProducts.length,
        message: "Notifications envoyées avec succès" 
      };
      
    } catch (error) {
      console.error("Erreur lors de la vérification des péremptions:", error);
      throw error;
    }
  });

/**
 * Créer le message de notification formaté
 */
function createNotificationMessage(expiringProducts: any[]): string {
  const today = format(new Date(), "dd/MM/yyyy");
  let message = `🚨 Alerte Péremption - ${today}\n\n`;
  
  message += `${expiringProducts.length} produit(s) nécessitent votre attention :\n\n`;
  
  expiringProducts.forEach(({ product, expiringBatches }) => {
    message += `📦 ${product.name}\n`;
    
    expiringBatches.forEach((batch: any) => {
      const expiryDateStr = format(batch.expiryDate, "dd/MM/yyyy");
      const urgency = batch.daysUntilExpiry <= 1 ? "🔴 URGENT" : 
                     batch.daysUntilExpiry <= 2 ? "🟡 BIENTÔT" : "🟢 À SURVEILLER";
      
      message += `  - ${batch.quantity} unités - Expire le ${expiryDateStr} (${batch.daysUntilExpiry} jour(s)) ${urgency}\n`;
    });
    
    message += "\n";
  });
  
  message += "💡 Actions recommandées :\n";
  message += "• Utiliser en priorité dans les recettes\n";
  message += "• Proposer en promotion\n";
  message += "• Déplacer vers zone de déstockage\n";
  
  return message;
}

/**
 * Fonction manuelle pour tester les notifications
 * Utile pour le développement et les tests
 */
export const testExpiryNotifications = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
  })
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "L'utilisateur doit être authentifié"
      );
    }

    try {
      // Réutiliser la logique de la fonction schedulée
      const result = await dailyExpiryNotifications.run(context as any);
      return result;
    } catch (error) {
      console.error("Erreur lors du test:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors du test des notifications"
      );
    }
  });