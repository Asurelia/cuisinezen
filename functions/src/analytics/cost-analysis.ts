import * as functions from "firebase-functions";
import { db } from "../utils/firebase-admin";
import { COLLECTIONS, COST_OPTIMIZATION } from "../utils/constants";
import { Product, Recipe, CostAnalysis } from "../types";

/**
 * Calcul automatique des coûts et marges par recette
 * Exécuté quotidiennement pour maintenir les prix à jour
 */
export const dailyCostCalculation = functions
  .runWith({
    timeoutSeconds: COST_OPTIMIZATION.FUNCTION_TIMEOUT,
    memory: COST_OPTIMIZATION.MEMORY_SIZE,
    maxInstances: COST_OPTIMIZATION.MAX_INSTANCES,
  })
  .region("europe-west1")
  .pubsub.schedule("0 3 * * *") // Chaque jour à 3h
  .timeZone("Europe/Paris")
  .onRun(async (context) => {
    try {
      console.log("Début du calcul des coûts des recettes");
      
      // Récupérer toutes les recettes
      const recipesSnapshot = await db.collection(COLLECTIONS.RECIPES).get();
      const recipes = recipesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Recipe));
      
      // Récupérer tous les produits avec leurs coûts
      const productsSnapshot = await db.collection(COLLECTIONS.PRODUCTS).get();
      const products = new Map<string, Product>();
      productsSnapshot.docs.forEach(doc => {
        products.set(doc.id, { id: doc.id, ...doc.data() } as Product);
      });
      
      const analyses: CostAnalysis[] = [];
      let processedCount = 0;
      
      // Calculer le coût de chaque recette
      for (const recipe of recipes) {
        try {
          const analysis = await calculateRecipeCost(recipe, products);
          analyses.push(analysis);
          processedCount++;
          
          // Sauvegarder l'analyse
          await saveCostAnalysis(analysis);
          
        } catch (error) {
          console.error(`Erreur calcul coût recette ${recipe.id}:`, error);
        }
      }
      
      // Générer un rapport de synthèse
      const summary = generateCostSummary(analyses);
      await saveCostSummary(summary);
      
      console.log(`Calcul terminé: ${processedCount}/${recipes.length} recettes`);
      
      return {
        success: true,
        processedRecipes: processedCount,
        totalRecipes: recipes.length,
        averageCost: summary.averageCostPerRecipe,
      };
      
    } catch (error) {
      console.error("Erreur calcul coûts quotidien:", error);
      throw error;
    }
  });

/**
 * Calcul manuel du coût d'une recette spécifique
 */
export const calculateSingleRecipeCost = functions
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

    const { recipeId } = data;
    
    if (!recipeId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "recipeId requis"
      );
    }

    try {
      // Récupérer la recette
      const recipeDoc = await db.collection(COLLECTIONS.RECIPES).doc(recipeId).get();
      
      if (!recipeDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Recette non trouvée"
        );
      }

      const recipe = { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;
      
      // Récupérer les produits nécessaires
      const productIds = recipe.ingredients?.map(i => i.productId) || [];
      const products = await getProductsByIds(productIds);
      
      // Calculer le coût
      const analysis = await calculateRecipeCost(recipe, products);
      
      // Sauvegarder l'analyse
      await saveCostAnalysis(analysis);
      
      return {
        success: true,
        analysis,
      };
      
    } catch (error) {
      console.error("Erreur calcul coût recette:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors du calcul du coût"
      );
    }
  });

/**
 * Mettre à jour les coûts unitaires des produits
 */
export const updateProductCosts = functions
  .runWith({
    timeoutSeconds: 180,
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

    const { productCosts } = data;
    
    if (!productCosts || !Array.isArray(productCosts)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "productCosts doit être un tableau"
      );
    }

    try {
      const batch = db.batch();
      let updateCount = 0;
      
      for (const { productId, unitCost } of productCosts) {
        if (productId && typeof unitCost === "number" && unitCost >= 0) {
          const productRef = db.collection(COLLECTIONS.PRODUCTS).doc(productId);
          batch.update(productRef, { unitCost });
          updateCount++;
        }
      }
      
      await batch.commit();
      
      // Recalculer les coûts des recettes affectées
      await triggerRecipeCostRecalculation(productCosts.map(p => p.productId));
      
      return {
        success: true,
        updatedProducts: updateCount,
        message: "Coûts mis à jour avec succès",
      };
      
    } catch (error) {
      console.error("Erreur mise à jour coûts:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la mise à jour des coûts"
      );
    }
  });

/**
 * Rapport de rentabilité par recette
 */
export const profitabilityReport = functions
  .runWith({
    timeoutSeconds: 180,
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
      // Récupérer toutes les analyses de coûts récentes
      const analysesSnapshot = await db.collection(COLLECTIONS.COST_ANALYSES)
        .orderBy("calculatedAt", "desc")
        .limit(100)
        .get();
      
      const analyses = analysesSnapshot.docs.map(doc => doc.data() as CostAnalysis);
      
      // Grouper par recette (garder la plus récente)
      const latestAnalyses = new Map<string, CostAnalysis>();
      analyses.forEach(analysis => {
        if (!latestAnalyses.has(analysis.recipeId)) {
          latestAnalyses.set(analysis.recipeId, analysis);
        }
      });
      
      // Générer le rapport de rentabilité
      const profitabilityData = Array.from(latestAnalyses.values()).map(analysis => {
        // Prix de vente estimé (à adapter selon votre modèle)
        const estimatedSellingPrice = analysis.costPerServing * 3; // Marge x3
        const profit = estimatedSellingPrice - analysis.costPerServing;
        const profitMargin = (profit / estimatedSellingPrice) * 100;
        
        return {
          recipeId: analysis.recipeId,
          recipeName: analysis.recipeName,
          costPerServing: analysis.costPerServing,
          estimatedSellingPrice,
          profit,
          profitMargin,
          category: categorizeRecipeProfit(profitMargin),
        };
      });
      
      // Trier par rentabilité
      profitabilityData.sort((a, b) => b.profitMargin - a.profitMargin);
      
      return {
        success: true,
        data: profitabilityData,
        summary: {
          totalRecipes: profitabilityData.length,
          averageMargin: profitabilityData.reduce((sum, r) => sum + r.profitMargin, 0) / profitabilityData.length,
          highProfitCount: profitabilityData.filter(r => r.category === "high").length,
          lowProfitCount: profitabilityData.filter(r => r.category === "low").length,
        },
      };
      
    } catch (error) {
      console.error("Erreur rapport rentabilité:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la génération du rapport"
      );
    }
  });

/**
 * Calculer le coût d'une recette
 */
async function calculateRecipeCost(recipe: Recipe, products: Map<string, Product>): Promise<CostAnalysis> {
  const ingredientCosts: CostAnalysis["ingredients"] = [];
  let totalCost = 0;
  
  for (const ingredient of recipe.ingredients || []) {
    const product = products.get(ingredient.productId);
    
    if (!product) {
      console.warn(`Produit non trouvé: ${ingredient.productId}`);
      continue;
    }
    
    const unitCost = product.unitCost || estimateProductCost(product);
    const ingredientTotalCost = calculateIngredientCost(ingredient, unitCost);
    
    ingredientCosts.push({
      productId: ingredient.productId,
      productName: product.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      unitCost,
      totalCost: ingredientTotalCost,
    });
    
    totalCost += ingredientTotalCost;
  }
  
  const servings = recipe.servings || 4; // Défaut 4 portions
  const costPerServing = totalCost / servings;
  
  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    totalCost,
    costPerServing,
    ingredients: ingredientCosts,
    calculatedAt: new Date(),
  };
}

/**
 * Calculer le coût d'un ingrédient
 */
function calculateIngredientCost(ingredient: any, unitCost: number): number {
  // Conversion selon l'unité
  let costMultiplier = 1;
  
  switch (ingredient.unit) {
    case "g":
      costMultiplier = ingredient.quantity / 1000; // Si unitCost est au kg
      break;
    case "ml":
      costMultiplier = ingredient.quantity / 1000; // Si unitCost est au litre
      break;
    case "piece":
      costMultiplier = ingredient.quantity;
      break;
    default:
      costMultiplier = ingredient.quantity;
  }
  
  return unitCost * costMultiplier;
}

/**
 * Estimer le coût d'un produit s'il n'est pas défini
 */
function estimateProductCost(product: Product): number {
  // Estimation basée sur la catégorie
  const estimations: Record<string, number> = {
    "frais": 5.0,      // 5€/kg
    "surgelé": 3.5,    // 3.5€/kg
    "épicerie": 2.0,   // 2€/kg
    "boisson": 1.5,    // 1.5€/L
    "entretien": 4.0,  // 4€/unité
  };
  
  return estimations[product.category] || 3.0;
}

/**
 * Récupérer les produits par IDs
 */
async function getProductsByIds(productIds: string[]): Promise<Map<string, Product>> {
  const products = new Map<string, Product>();
  
  if (productIds.length === 0) return products;
  
  // Traiter par batches pour optimiser
  const batchSize = 10;
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);
    const snapshot = await db.collection(COLLECTIONS.PRODUCTS)
      .where("__name__", "in", batch.map(id => db.collection(COLLECTIONS.PRODUCTS).doc(id)))
      .get();
    
    snapshot.docs.forEach(doc => {
      products.set(doc.id, { id: doc.id, ...doc.data() } as Product);
    });
  }
  
  return products;
}

/**
 * Sauvegarder l'analyse de coût
 */
async function saveCostAnalysis(analysis: CostAnalysis): Promise<void> {
  await db.collection(COLLECTIONS.COST_ANALYSES).add(analysis);
}

/**
 * Générer un résumé des coûts
 */
function generateCostSummary(analyses: CostAnalysis[]) {
  const totalAnalyses = analyses.length;
  const totalCosts = analyses.reduce((sum, a) => sum + a.totalCost, 0);
  const averageCostPerRecipe = totalCosts / totalAnalyses;
  
  // Analyser les coûts par portion
  const costPerServingStats = analyses.map(a => a.costPerServing).sort((a, b) => a - b);
  const median = costPerServingStats[Math.floor(costPerServingStats.length / 2)];
  
  return {
    totalRecipes: totalAnalyses,
    averageCostPerRecipe,
    averageCostPerServing: analyses.reduce((sum, a) => sum + a.costPerServing, 0) / totalAnalyses,
    medianCostPerServing: median,
    mostExpensiveRecipe: analyses.reduce((max, a) => a.costPerServing > max.costPerServing ? a : max),
    cheapestRecipe: analyses.reduce((min, a) => a.costPerServing < min.costPerServing ? a : min),
    calculatedAt: new Date(),
  };
}

/**
 * Sauvegarder le résumé des coûts
 */
async function saveCostSummary(summary: any): Promise<void> {
  await db.collection("cost-summaries").add(summary);
}

/**
 * Déclencher le recalcul des coûts des recettes
 */
async function triggerRecipeCostRecalculation(affectedProductIds: string[]): Promise<void> {
  // Trouver les recettes qui utilisent ces produits
  const recipesSnapshot = await db.collection(COLLECTIONS.RECIPES).get();
  const affectedRecipes: string[] = [];
  
  recipesSnapshot.docs.forEach(doc => {
    const recipe = doc.data() as Recipe;
    const usesAffectedProduct = recipe.ingredients?.some(ing => 
      affectedProductIds.includes(ing.productId)
    );
    
    if (usesAffectedProduct) {
      affectedRecipes.push(doc.id);
    }
  });
  
  console.log(`${affectedRecipes.length} recettes à recalculer`);
  
  // Déclencher le recalcul (ici simplifié, pourrait être async)
  // En production, on pourrait utiliser une queue pour traiter ces recalculs
}

/**
 * Catégoriser la rentabilité d'une recette
 */
function categorizeRecipeProfit(profitMargin: number): "high" | "medium" | "low" {
  if (profitMargin >= 60) return "high";    // Marge > 60%
  if (profitMargin >= 40) return "medium";  // Marge 40-60%
  return "low";                             // Marge < 40%
}