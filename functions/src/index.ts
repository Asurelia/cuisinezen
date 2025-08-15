/**
 * Point d'entrée principal des Cloud Functions
 * CuisineZen - Optimisé pour minimiser les coûts
 */

// Notifications
export { 
  dailyExpiryNotifications,
  testExpiryNotifications
} from "./notifications/expiry-notifications";

// Shopping Lists
export { 
  generateShoppingList,
  weeklyShoppingListGeneration
} from "./shopping/auto-shopping-list";

// Backup & Restore
export { 
  dailyDataBackup,
  manualBackup,
  restoreFromBackup,
  listBackups
} from "./backup/data-backup";

// Reports & PDF
export { 
  monthlyInventoryPDF,
  generateCustomInventoryPDF
} from "./reports/inventory-pdf";

// Cost Analysis
export { 
  dailyCostCalculation,
  calculateSingleRecipeCost,
  updateProductCosts,
  profitabilityReport
} from "./analytics/cost-analysis";

// POS Integration
export { 
  posWebhook,
  configurePosWebhook,
  syncWithPos,
  getSalesStatistics
} from "./integrations/pos-webhook";

// Utilitaires (pour monitoring et maintenance)
import * as functions from "firebase-functions";
import { cache } from "./utils/cache";
import { rateLimiters } from "./utils/rate-limiter";

/**
 * Fonction de monitoring et maintenance
 */
export const maintenance = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
  })
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentification requise"
      );
    }

    const { action } = data;

    try {
      switch (action) {
        case "cache-stats":
          return {
            success: true,
            cache: cache.getStats(),
            rateLimiters: {
              api: rateLimiters.api.getStats(),
              backup: rateLimiters.backup.getStats(),
              pdf: rateLimiters.pdf.getStats(),
              webhook: rateLimiters.webhook.getStats(),
            },
          };

        case "clear-cache":
          cache.clear();
          return {
            success: true,
            message: "Cache vidé avec succès",
          };

        case "health-check":
          return {
            success: true,
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            region: "europe-west1",
            message: "Toutes les fonctions sont opérationnelles",
          };

        default:
          throw new functions.https.HttpsError(
            "invalid-argument",
            "Action de maintenance non reconnue"
          );
      }
    } catch (error) {
      console.error("Erreur maintenance:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de l'opération de maintenance"
      );
    }
  });

/**
 * Fonction de test pour vérifier les déploiements
 */
export const healthCheck = functions
  .region("europe-west1")
  .https.onRequest((req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      functions: [
        "dailyExpiryNotifications",
        "generateShoppingList", 
        "dailyDataBackup",
        "monthlyInventoryPDF",
        "dailyCostCalculation",
        "posWebhook",
      ],
      region: "europe-west1",
      memory: "optimized",
    });
  });