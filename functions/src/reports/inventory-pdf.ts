import * as functions from "firebase-functions";
import { db, storage } from "../utils/firebase-admin";
import { COLLECTIONS, COST_OPTIMIZATION } from "../utils/constants";
import { Product, Category } from "../types";
import { format, startOfMonth, endOfMonth } from "date-fns";
import * as puppeteer from "puppeteer";

/**
 * Export PDF mensuel de l'inventaire
 * Généré automatiquement le 1er de chaque mois
 */
export const monthlyInventoryPDF = functions
  .runWith({
    timeoutSeconds: COST_OPTIMIZATION.FUNCTION_TIMEOUT,
    memory: "1GB", // Plus de mémoire pour Puppeteer
    maxInstances: 1,
  })
  .region("europe-west1")
  .pubsub.schedule("0 6 1 * *") // 1er du mois à 6h
  .timeZone("Europe/Paris")
  .onRun(async (context) => {
    try {
      console.log("Génération du rapport PDF mensuel d'inventaire");
      
      const reportDate = new Date();
      const previousMonth = new Date(reportDate.getFullYear(), reportDate.getMonth() - 1, 1);
      
      const reportData = await generateInventoryReport(previousMonth);
      const pdfBuffer = await generatePDF(reportData);
      const fileName = await savePDFToStorage(pdfBuffer, reportData.period);
      
      // Sauvegarder les métadonnées du rapport
      await saveReportMetadata(fileName, reportData);
      
      console.log(`Rapport PDF généré: ${fileName}`);
      
      return {
        success: true,
        fileName,
        reportPeriod: reportData.period,
        totalProducts: reportData.totalProducts,
        totalValue: reportData.totalValue,
      };
      
    } catch (error) {
      console.error("Erreur génération PDF mensuel:", error);
      throw error;
    }
  });

/**
 * Génération manuelle de rapport PDF
 */
export const generateCustomInventoryPDF = functions
  .runWith({
    timeoutSeconds: 300,
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

    try {
      const { startDate, endDate, includeExpired = true } = data;
      
      const reportDate = startDate ? new Date(startDate) : new Date();
      const reportData = await generateInventoryReport(reportDate, {
        endDate: endDate ? new Date(endDate) : undefined,
        includeExpired,
      });
      
      const pdfBuffer = await generatePDF(reportData);
      const fileName = await savePDFToStorage(pdfBuffer, reportData.period);
      
      // Générer une URL signée pour téléchargement
      const downloadUrl = await generateDownloadUrl(fileName);
      
      return {
        success: true,
        downloadUrl,
        fileName,
        reportData: {
          period: reportData.period,
          totalProducts: reportData.totalProducts,
          totalValue: reportData.totalValue,
          categories: reportData.categoryBreakdown,
        },
      };
      
    } catch (error) {
      console.error("Erreur génération PDF custom:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la génération du PDF"
      );
    }
  });

/**
 * Générer les données du rapport d'inventaire
 */
async function generateInventoryReport(
  reportDate: Date, 
  options: { endDate?: Date; includeExpired?: boolean } = {}
): Promise<InventoryReportData> {
  console.log("Collecte des données d'inventaire...");
  
  const { endDate, includeExpired = true } = options;
  const startPeriod = startOfMonth(reportDate);
  const endPeriod = endDate || endOfMonth(reportDate);
  
  // Récupérer tous les produits
  const productsSnapshot = await db.collection(COLLECTIONS.PRODUCTS).get();
  const products = productsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
  
  // Analyser l'inventaire
  const analysis = analyzeInventory(products, { includeExpired });
  
  return {
    period: `${format(startPeriod, "MMMM yyyy", { locale: require("date-fns/locale/fr") })}`,
    generatedAt: new Date(),
    totalProducts: products.length,
    totalQuantity: analysis.totalQuantity,
    totalValue: analysis.totalValue,
    categoryBreakdown: analysis.byCategory,
    expiryAnalysis: analysis.expiryAnalysis,
    lowStockItems: analysis.lowStock,
    expiredItems: analysis.expired,
    products: products,
    includeExpired,
  };
}

/**
 * Analyser l'inventaire
 */
function analyzeInventory(products: Product[], options: { includeExpired: boolean }) {
  const analysis = {
    totalQuantity: 0,
    totalValue: 0,
    byCategory: {} as Record<Category, { quantity: number; value: number; count: number }>,
    expiryAnalysis: {
      expiredCount: 0,
      expiringIn7Days: 0,
      expiringIn30Days: 0,
    },
    lowStock: [] as Array<{ product: Product; quantity: number }>,
    expired: [] as Array<{ product: Product; batches: any[] }>,
  };
  
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  products.forEach(product => {
    const totalQuantity = product.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
    const estimatedValue = totalQuantity * (product.unitCost || 2); // Prix estimé
    
    analysis.totalQuantity += totalQuantity;
    analysis.totalValue += estimatedValue;
    
    // Analyse par catégorie
    if (!analysis.byCategory[product.category]) {
      analysis.byCategory[product.category] = { quantity: 0, value: 0, count: 0 };
    }
    analysis.byCategory[product.category].quantity += totalQuantity;
    analysis.byCategory[product.category].value += estimatedValue;
    analysis.byCategory[product.category].count += 1;
    
    // Analyse de péremption
    const expiredBatches: any[] = [];
    product.batches?.forEach(batch => {
      if (batch.expiryDate) {
        const expiryDate = batch.expiryDate instanceof Date ? batch.expiryDate : new Date(batch.expiryDate);
        
        if (expiryDate < now) {
          analysis.expiryAnalysis.expiredCount++;
          expiredBatches.push(batch);
        } else if (expiryDate < in7Days) {
          analysis.expiryAnalysis.expiringIn7Days++;
        } else if (expiryDate < in30Days) {
          analysis.expiryAnalysis.expiringIn30Days++;
        }
      }
    });
    
    if (expiredBatches.length > 0) {
      analysis.expired.push({ product, batches: expiredBatches });
    }
    
    // Stock faible (moins de 10 unités)
    if (totalQuantity > 0 && totalQuantity < 10) {
      analysis.lowStock.push({ product, quantity: totalQuantity });
    }
  });
  
  return analysis;
}

/**
 * Générer le PDF avec Puppeteer
 */
async function generatePDF(reportData: InventoryReportData): Promise<Buffer> {
  console.log("Génération du PDF...");
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  
  try {
    const page = await browser.newPage();
    
    // Générer le HTML du rapport
    const htmlContent = generateReportHTML(reportData);
    
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });
    
    // Générer le PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; padding: 10px;">
          <strong>CuisineZen - Rapport d'Inventaire</strong>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; padding: 10px;">
          <span>Page <span class="pageNumber"></span> sur <span class="totalPages"></span></span>
          <span style="float: right;">Généré le ${format(new Date(), "dd/MM/yyyy HH:mm")}</span>
        </div>
      `,
    });
    
    return pdfBuffer;
    
  } finally {
    await browser.close();
  }
}

/**
 * Générer le HTML du rapport
 */
function generateReportHTML(data: InventoryReportData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rapport d'Inventaire - ${data.period}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 15px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0;
          font-size: 24px;
        }
        .header h2 {
          color: #64748b;
          margin: 5px 0;
          font-weight: normal;
          font-size: 16px;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        .summary-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          background: #f8fafc;
        }
        .summary-card h3 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 14px;
        }
        .summary-card .value {
          font-size: 20px;
          font-weight: bold;
          color: #2563eb;
        }
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .section h3 {
          color: #1e293b;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 8px;
          text-align: left;
        }
        th {
          background: #f1f5f9;
          font-weight: 600;
          color: #1e293b;
        }
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }
        .category-item {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px;
          text-align: center;
        }
        .alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 15px;
        }
        .alert-warning {
          background: #fffbeb;
          border-color: #fed7aa;
        }
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Rapport d'Inventaire</h1>
        <h2>${data.period}</h2>
        <p>Généré le ${format(data.generatedAt, "dd MMMM yyyy à HH:mm", { locale: require("date-fns/locale/fr") })}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total Produits</h3>
          <div class="value">${data.totalProducts}</div>
        </div>
        <div class="summary-card">
          <h3>Quantité Totale</h3>
          <div class="value">${data.totalQuantity.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Valeur Estimée</h3>
          <div class="value">${data.totalValue.toFixed(2)} €</div>
        </div>
        <div class="summary-card">
          <h3>Produits Expirés</h3>
          <div class="value" style="color: #dc2626;">${data.expiryAnalysis.expiredCount}</div>
        </div>
      </div>

      ${data.expiryAnalysis.expiredCount > 0 ? `
        <div class="alert">
          <strong>⚠️ Attention:</strong> ${data.expiryAnalysis.expiredCount} lot(s) expiré(s) détecté(s)
        </div>
      ` : ''}

      ${data.expiryAnalysis.expiringIn7Days > 0 ? `
        <div class="alert alert-warning">
          <strong>📅 À surveiller:</strong> ${data.expiryAnalysis.expiringIn7Days} lot(s) expire(nt) dans les 7 prochains jours
        </div>
      ` : ''}

      <div class="section">
        <h3>Répartition par Catégorie</h3>
        <div class="category-grid">
          ${Object.entries(data.categoryBreakdown).map(([category, stats]) => `
            <div class="category-item">
              <strong>${category}</strong><br>
              ${stats.count} produits<br>
              ${stats.quantity} unités<br>
              ${stats.value.toFixed(2)} €
            </div>
          `).join('')}
        </div>
      </div>

      ${data.lowStockItems.length > 0 ? `
        <div class="section">
          <h3>Stock Faible (< 10 unités)</h3>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              ${data.lowStockItems.map(item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.product.category}</td>
                  <td>${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${data.expiredItems.length > 0 ? `
        <div class="section page-break">
          <h3>Produits Expirés</h3>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Lots Expirés</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              ${data.expiredItems.map(item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.product.category}</td>
                  <td>${item.batches.length}</td>
                  <td>${item.batches.reduce((sum: number, batch: any) => sum + batch.quantity, 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="section page-break">
        <h3>Inventaire Complet</h3>
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Quantité</th>
              <th>Valeur Est.</th>
            </tr>
          </thead>
          <tbody>
            ${data.products.map(product => {
              const quantity = product.batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
              const value = quantity * (product.unitCost || 2);
              return `
                <tr>
                  <td>${product.name}</td>
                  <td>${product.category}</td>
                  <td>${quantity}</td>
                  <td>${value.toFixed(2)} €</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sauvegarder le PDF dans Cloud Storage
 */
async function savePDFToStorage(pdfBuffer: Buffer, period: string): Promise<string> {
  const bucket = storage.bucket();
  const fileName = `reports/inventory-${period.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  const file = bucket.file(fileName);
  
  await file.save(pdfBuffer, {
    metadata: {
      contentType: "application/pdf",
      metadata: {
        reportType: "inventory",
        period,
        generatedAt: new Date().toISOString(),
      },
    },
  });
  
  console.log(`PDF sauvegardé: ${fileName}`);
  return fileName;
}

/**
 * Sauvegarder les métadonnées du rapport
 */
async function saveReportMetadata(fileName: string, reportData: InventoryReportData): Promise<void> {
  await db.collection("reports").add({
    type: "inventory_pdf",
    fileName,
    period: reportData.period,
    generatedAt: reportData.generatedAt,
    totalProducts: reportData.totalProducts,
    totalValue: reportData.totalValue,
    expiryAlerts: reportData.expiryAnalysis.expiredCount,
  });
}

/**
 * Générer une URL de téléchargement signée
 */
async function generateDownloadUrl(fileName: string): Promise<string> {
  const bucket = storage.bucket();
  const file = bucket.file(fileName);
  
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 heures
  });
  
  return url;
}

// Types
interface InventoryReportData {
  period: string;
  generatedAt: Date;
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  categoryBreakdown: Record<Category, { quantity: number; value: number; count: number }>;
  expiryAnalysis: {
    expiredCount: number;
    expiringIn7Days: number;
    expiringIn30Days: number;
  };
  lowStockItems: Array<{ product: Product; quantity: number }>;
  expiredItems: Array<{ product: Product; batches: any[] }>;
  products: Product[];
  includeExpired: boolean;
}