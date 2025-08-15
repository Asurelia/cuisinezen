import * as functions from "firebase-functions";
import { db } from "../utils/firebase-admin";
import { COLLECTIONS, COST_OPTIMIZATION } from "../utils/constants";
import { PosTransaction, Product } from "../types";
import { z } from "zod";

// Schéma de validation pour les données POS
const PosWebhookSchema = z.object({
  transaction_id: z.string(),
  timestamp: z.string().datetime(),
  items: z.array(z.object({
    product_id: z.string(),
    product_name: z.string().optional(),
    quantity: z.number().positive(),
    unit_price: z.number().min(0),
    total_price: z.number().min(0),
  })),
  total_amount: z.number().min(0),
  payment_method: z.enum(["cash", "card", "digital"]),
  customer_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Webhook pour intégration avec système de caisse
 * Reçoit les ventes et met à jour automatiquement l'inventaire
 */
export const posWebhook = functions
  .runWith({
    timeoutSeconds: COST_OPTIMIZATION.FUNCTION_TIMEOUT,
    memory: COST_OPTIMIZATION.MEMORY_SIZE,
    maxInstances: COST_OPTIMIZATION.MAX_INSTANCES,
  })
  .region("europe-west1")
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Méthode non autorisée" });
      return;
    }

    try {
      // Vérification de l'authentification
      const authHeader = req.headers.authorization;
      if (!authHeader || !await verifyWebhookAuth(authHeader)) {
        res.status(401).json({ error: "Non autorisé" });
        return;
      }

      // Validation des données
      const validationResult = PosWebhookSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Données webhook invalides:", validationResult.error);
        res.status(400).json({ 
          error: "Données invalides", 
          details: validationResult.error.errors 
        });
        return;
      }

      const transactionData = validationResult.data;
      console.log(`Traitement transaction POS: ${transactionData.transaction_id}`);

      // Traiter la transaction
      const result = await processTransaction(transactionData);

      res.status(200).json({
        success: true,
        transaction_id: transactionData.transaction_id,
        processed_items: result.processedItems,
        inventory_updated: result.inventoryUpdated,
        message: "Transaction traitée avec succès",
      });

    } catch (error) {
      console.error("Erreur webhook POS:", error);
      res.status(500).json({
        error: "Erreur serveur",
        message: "Erreur lors du traitement de la transaction",
      });
    }
  });

/**
 * Configuration du webhook POS
 */
export const configurePosWebhook = functions
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

    const { webhookUrl, apiKey, enabled = true } = data;

    try {
      await db.collection(COLLECTIONS.SETTINGS).doc("pos-integration").set({
        webhookUrl,
        apiKey,
        enabled,
        configuredAt: new Date(),
        configuredBy: context.auth.uid,
      });

      return {
        success: true,
        message: "Configuration POS mise à jour",
      };

    } catch (error) {
      console.error("Erreur configuration POS:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la configuration"
      );
    }
  });

/**
 * Synchronisation manuelle avec le système POS
 */
export const syncWithPos = functions
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
      const { startDate, endDate } = data;
      
      // Récupérer la configuration POS
      const configDoc = await db.collection(COLLECTIONS.SETTINGS)
        .doc("pos-integration")
        .get();
      
      if (!configDoc.exists || !configDoc.data()?.enabled) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Intégration POS non configurée"
        );
      }

      const config = configDoc.data();
      
      // Synchroniser les données (logique à adapter selon l'API POS)
      const syncResult = await fetchPosTransactions(
        config.webhookUrl,
        config.apiKey,
        startDate,
        endDate
      );

      return {
        success: true,
        syncedTransactions: syncResult.count,
        message: "Synchronisation terminée",
      };

    } catch (error) {
      console.error("Erreur synchronisation POS:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la synchronisation"
      );
    }
  });

/**
 * Obtenir les statistiques des ventes
 */
export const getSalesStatistics = functions
  .runWith({
    timeoutSeconds: 120,
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
      const { startDate, endDate, groupBy = "day" } = data;
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const transactionsSnapshot = await db.collection(COLLECTIONS.POS_TRANSACTIONS)
        .where("timestamp", ">=", start)
        .where("timestamp", "<=", end)
        .orderBy("timestamp", "desc")
        .limit(1000)
        .get();

      const transactions = transactionsSnapshot.docs.map(doc => 
        doc.data() as PosTransaction
      );

      const statistics = calculateSalesStatistics(transactions, groupBy);

      return {
        success: true,
        statistics,
        period: { start, end },
        totalTransactions: transactions.length,
      };

    } catch (error) {
      console.error("Erreur statistiques ventes:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors du calcul des statistiques"
      );
    }
  });

/**
 * Traiter une transaction POS
 */
async function processTransaction(transactionData: z.infer<typeof PosWebhookSchema>) {
  const transactionId = transactionData.transaction_id;
  
  // Vérifier si la transaction existe déjà
  const existingTransaction = await db.collection(COLLECTIONS.POS_TRANSACTIONS)
    .where("id", "==", transactionId)
    .limit(1)
    .get();

  if (!existingTransaction.empty) {
    console.log(`Transaction déjà traitée: ${transactionId}`);
    return { processedItems: 0, inventoryUpdated: false };
  }

  // Sauvegarder la transaction
  const transaction: PosTransaction = {
    id: transactionId,
    timestamp: new Date(transactionData.timestamp),
    items: transactionData.items.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      price: item.unit_price,
    })),
    total: transactionData.total_amount,
    paymentMethod: transactionData.payment_method,
  };

  await db.collection(COLLECTIONS.POS_TRANSACTIONS).add(transaction);

  // Mettre à jour l'inventaire
  let processedItems = 0;
  const batch = db.batch();

  for (const item of transactionData.items) {
    try {
      const updated = await updateProductInventory(
        item.product_id,
        item.quantity,
        batch
      );
      
      if (updated) processedItems++;
      
    } catch (error) {
      console.error(`Erreur mise à jour produit ${item.product_id}:`, error);
    }
  }

  await batch.commit();

  return {
    processedItems,
    inventoryUpdated: processedItems > 0,
  };
}

/**
 * Mettre à jour l'inventaire d'un produit
 */
async function updateProductInventory(
  productId: string, 
  soldQuantity: number,
  batch: FirebaseFirestore.WriteBatch
): Promise<boolean> {
  const productDoc = await db.collection(COLLECTIONS.PRODUCTS).doc(productId).get();
  
  if (!productDoc.exists) {
    console.warn(`Produit non trouvé: ${productId}`);
    return false;
  }

  const product = productDoc.data() as Product;
  let remainingToDeduct = soldQuantity;

  // Déduire des lots en ordre FIFO (First In, First Out)
  const updatedBatches = product.batches?.map(batch => {
    if (remainingToDeduct <= 0) return batch;

    if (batch.quantity <= remainingToDeduct) {
      remainingToDeduct -= batch.quantity;
      return { ...batch, quantity: 0 };
    } else {
      const newQuantity = batch.quantity - remainingToDeduct;
      remainingToDeduct = 0;
      return { ...batch, quantity: newQuantity };
    }
  }).filter(batch => batch.quantity > 0) || [];

  // Mettre à jour le produit
  batch.update(productDoc.ref, { batches: updatedBatches });

  // Créer une alerte si stock faible
  const totalQuantity = updatedBatches.reduce((sum, batch) => sum + batch.quantity, 0);
  if (totalQuantity < 10) {
    await createLowStockAlert(productId, product.name, totalQuantity);
  }

  return true;
}

/**
 * Vérifier l'authentification du webhook
 */
async function verifyWebhookAuth(authHeader: string): Promise<boolean> {
  try {
    // Récupérer la configuration d'authentification
    const configDoc = await db.collection(COLLECTIONS.SETTINGS)
      .doc("pos-integration")
      .get();
    
    if (!configDoc.exists) return false;
    
    const config = configDoc.data();
    const expectedToken = `Bearer ${config?.apiKey}`;
    
    return authHeader === expectedToken;
    
  } catch (error) {
    console.error("Erreur vérification auth webhook:", error);
    return false;
  }
}

/**
 * Récupérer les transactions depuis l'API POS
 */
async function fetchPosTransactions(
  apiUrl: string,
  apiKey: string,
  startDate?: string,
  endDate?: string
): Promise<{ count: number }> {
  // Logique d'intégration avec l'API POS
  // À adapter selon l'API spécifique du système de caisse
  
  console.log("Synchronisation avec API POS...");
  
  // Simulation - remplacer par l'appel API réel
  return { count: 0 };
}

/**
 * Calculer les statistiques de vente
 */
function calculateSalesStatistics(transactions: PosTransaction[], groupBy: string) {
  const stats = {
    totalRevenue: 0,
    totalTransactions: transactions.length,
    averageTransaction: 0,
    topProducts: new Map<string, { quantity: number; revenue: number }>(),
    timelineData: [] as Array<{ period: string; revenue: number; transactions: number }>,
  };

  // Calculer le chiffre d'affaires total
  stats.totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  stats.averageTransaction = stats.totalRevenue / stats.totalTransactions || 0;

  // Analyser les produits les plus vendus
  transactions.forEach(transaction => {
    transaction.items.forEach(item => {
      const existing = stats.topProducts.get(item.productId) || { quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
      stats.topProducts.set(item.productId, existing);
    });
  });

  // Données temporelles (groupées par jour/semaine/mois)
  const timeGroups = new Map<string, { revenue: number; count: number }>();
  
  transactions.forEach(transaction => {
    const date = transaction.timestamp;
    let groupKey: string;
    
    switch (groupBy) {
      case "day":
        groupKey = date.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        groupKey = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      default:
        groupKey = date.toISOString().split("T")[0];
    }
    
    const existing = timeGroups.get(groupKey) || { revenue: 0, count: 0 };
    existing.revenue += transaction.total;
    existing.count += 1;
    timeGroups.set(groupKey, existing);
  });

  stats.timelineData = Array.from(timeGroups.entries()).map(([period, data]) => ({
    period,
    revenue: data.revenue,
    transactions: data.count,
  })).sort((a, b) => a.period.localeCompare(b.period));

  return stats;
}

/**
 * Créer une alerte de stock faible
 */
async function createLowStockAlert(productId: string, productName: string, quantity: number): Promise<void> {
  try {
    await db.collection(COLLECTIONS.NOTIFICATIONS).add({
      type: "low_stock",
      productId,
      productName,
      currentQuantity: quantity,
      message: `Stock faible: ${productName} (${quantity} unités restantes)`,
      createdAt: new Date(),
      read: false,
      priority: "medium",
    });
  } catch (error) {
    console.error("Erreur création alerte stock:", error);
  }
}