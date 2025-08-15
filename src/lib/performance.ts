import { performance } from './firebase';
import { trace, type FirebasePerformance, type Trace } from 'firebase/performance';

// Types de traces personnalisées
export type PerformanceTrace = 
  | 'inventory_load'
  | 'recipes_load'
  | 'barcode_scan'
  | 'product_search'
  | 'menu_generation'
  | 'user_authentication'
  | 'dashboard_render'
  | 'data_sync'
  | 'image_upload'
  | 'recipe_creation';

// Service de monitoring des performances
export class PerformanceService {
  private static instance: PerformanceService;
  private performanceInstance: FirebasePerformance | null = null;
  private activeTraces: Map<string, Trace> = new Map();

  private constructor() {
    // Initialisation côté client uniquement
    if (typeof window !== 'undefined') {
      this.performanceInstance = performance;
    }
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Démarrer une trace
  public startTrace(traceName: PerformanceTrace, customAttributes?: Record<string, string>): string {
    if (!this.performanceInstance || typeof window === 'undefined') {
      return '';
    }

    try {
      const traceId = `${traceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const traceInstance = trace(this.performanceInstance, traceName);
      
      // Ajouter des attributs personnalisés
      if (customAttributes) {
        Object.entries(customAttributes).forEach(([key, value]) => {
          traceInstance.putAttribute(key, value);
        });
      }

      // Ajouter des attributs par défaut
      traceInstance.putAttribute('timestamp', new Date().toISOString());
      traceInstance.putAttribute('user_agent', navigator.userAgent.substring(0, 100));
      
      traceInstance.start();
      this.activeTraces.set(traceId, traceInstance);
      
      return traceId;
    } catch (error) {
      console.warn('Erreur lors du démarrage de la trace:', error);
      return '';
    }
  }

  // Arrêter une trace
  public stopTrace(traceId: string, metrics?: Record<string, number>): void {
    if (!this.performanceInstance || typeof window === 'undefined' || !traceId) {
      return;
    }

    try {
      const traceInstance = this.activeTraces.get(traceId);
      if (!traceInstance) {
        console.warn('Trace non trouvée:', traceId);
        return;
      }

      // Ajouter des métriques personnalisées
      if (metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
          traceInstance.putMetric(key, value);
        });
      }

      traceInstance.stop();
      this.activeTraces.delete(traceId);
    } catch (error) {
      console.warn('Erreur lors de l\'arrêt de la trace:', error);
    }
  }

  // Méthodes spécifiques pour différentes opérations

  // Monitoring du chargement de l'inventaire
  public startInventoryLoad(productCount?: number): string {
    return this.startTrace('inventory_load', {
      operation_type: 'data_fetch',
      expected_items: productCount?.toString() || 'unknown'
    });
  }

  public stopInventoryLoad(traceId: string, itemsLoaded: number, loadTime: number): void {
    this.stopTrace(traceId, {
      items_loaded: itemsLoaded,
      load_time_ms: loadTime,
      items_per_second: itemsLoaded / (loadTime / 1000)
    });
  }

  // Monitoring des recettes
  public startRecipesLoad(): string {
    return this.startTrace('recipes_load', {
      operation_type: 'recipes_fetch'
    });
  }

  public stopRecipesLoad(traceId: string, recipesCount: number): void {
    this.stopTrace(traceId, {
      recipes_loaded: recipesCount
    });
  }

  // Monitoring du scan de code-barres
  public startBarcodesScan(): string {
    return this.startTrace('barcode_scan', {
      operation_type: 'camera_scan'
    });
  }

  public stopBarcodesScan(traceId: string, success: boolean, processingTime: number): void {
    this.stopTrace(traceId, {
      scan_success: success ? 1 : 0,
      processing_time_ms: processingTime
    });
  }

  // Monitoring de la recherche de produits
  public startProductSearch(query: string): string {
    return this.startTrace('product_search', {
      operation_type: 'search',
      query_length: query.length.toString(),
      search_type: 'product'
    });
  }

  public stopProductSearch(traceId: string, resultsCount: number, searchTime: number): void {
    this.stopTrace(traceId, {
      results_count: resultsCount,
      search_time_ms: searchTime
    });
  }

  // Monitoring de la génération de menu
  public startMenuGeneration(recipesCount: number): string {
    return this.startTrace('menu_generation', {
      operation_type: 'menu_planning',
      recipes_input: recipesCount.toString()
    });
  }

  public stopMenuGeneration(traceId: string, generationTime: number): void {
    this.stopTrace(traceId, {
      generation_time_ms: generationTime
    });
  }

  // Monitoring de l'authentification
  public startAuthentication(method: string): string {
    return this.startTrace('user_authentication', {
      auth_method: method,
      operation_type: 'authentication'
    });
  }

  public stopAuthentication(traceId: string, success: boolean): void {
    this.stopTrace(traceId, {
      auth_success: success ? 1 : 0
    });
  }

  // Monitoring du rendu du dashboard
  public startDashboardRender(componentCount: number): string {
    return this.startTrace('dashboard_render', {
      operation_type: 'ui_render',
      components_count: componentCount.toString()
    });
  }

  public stopDashboardRender(traceId: string, renderTime: number): void {
    this.stopTrace(traceId, {
      render_time_ms: renderTime
    });
  }

  // Monitoring de la synchronisation des données
  public startDataSync(dataType: string): string {
    return this.startTrace('data_sync', {
      operation_type: 'data_synchronization',
      data_type: dataType
    });
  }

  public stopDataSync(traceId: string, syncedItems: number): void {
    this.stopTrace(traceId, {
      synced_items: syncedItems
    });
  }

  // Utilitaire pour mesurer automatiquement une fonction
  public async measureOperation<T>(
    traceName: PerformanceTrace,
    operation: () => Promise<T>,
    attributes?: Record<string, string>
  ): Promise<T> {
    const traceId = this.startTrace(traceName, attributes);
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      this.stopTrace(traceId, {
        operation_duration: endTime - startTime
      });
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.stopTrace(traceId, {
        operation_duration: endTime - startTime,
        operation_failed: 1
      });
      throw error;
    }
  }
}

// Export de l'instance singleton
export const performanceService = PerformanceService.getInstance();