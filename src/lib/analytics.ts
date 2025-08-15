import { analytics } from './firebase';
import { logEvent, type Analytics } from 'firebase/analytics';

// Types d'événements personnalisés pour le restaurant
export type CuisineZenEvent = 
  | 'product_added'
  | 'product_scanned'
  | 'recipe_created'
  | 'recipe_viewed'
  | 'inventory_viewed'
  | 'menu_created'
  | 'product_expired_alert'
  | 'shopping_list_created'
  | 'barcode_scan_success'
  | 'barcode_scan_failed'
  | 'user_login'
  | 'dashboard_viewed';

// Interface pour les paramètres d'événements
interface EventParams {
  [key: string]: string | number | boolean;
}

// Service Analytics
export class AnalyticsService {
  private static instance: AnalyticsService;
  private analyticsInstance: Analytics | null = null;

  private constructor() {
    // Initialisation côté client uniquement
    if (typeof window !== 'undefined') {
      this.analyticsInstance = analytics;
    }
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Méthode générique pour logger des événements
  public logEvent(eventName: CuisineZenEvent, parameters?: EventParams): void {
    if (!this.analyticsInstance || typeof window === 'undefined') {
      return;
    }

    try {
      logEvent(this.analyticsInstance, eventName, {
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        ...parameters
      });
    } catch (error) {
      console.warn('Erreur lors du logging de l\'événement:', error);
    }
  }

  // Événements spécifiques pour l'inventaire
  public trackProductAdded(productName: string, category: string, quantity: number): void {
    this.logEvent('product_added', {
      product_name: productName,
      category,
      quantity,
      method: 'manual'
    });
  }

  public trackProductScanned(productName: string, barcode: string, success: boolean): void {
    if (success) {
      this.logEvent('product_scanned', {
        product_name: productName,
        barcode,
        scan_method: 'barcode'
      });
      this.logEvent('barcode_scan_success', {
        barcode,
        product_name: productName
      });
    } else {
      this.logEvent('barcode_scan_failed', {
        barcode,
        error_reason: 'product_not_found'
      });
    }
  }

  // Événements pour les recettes
  public trackRecipeCreated(recipeName: string, ingredients: number, cookingTime: number): void {
    this.logEvent('recipe_created', {
      recipe_name: recipeName,
      ingredients_count: ingredients,
      cooking_time_minutes: cookingTime,
      creation_method: 'manual'
    });
  }

  public trackRecipeViewed(recipeName: string, category: string): void {
    this.logEvent('recipe_viewed', {
      recipe_name: recipeName,
      category,
      view_source: 'recipe_list'
    });
  }

  // Événements pour le menu
  public trackMenuCreated(menuDate: string, recipesCount: number): void {
    this.logEvent('menu_created', {
      menu_date: menuDate,
      recipes_count: recipesCount,
      planning_method: 'manual'
    });
  }

  // Événements pour les alertes
  public trackExpirationAlert(productName: string, daysUntilExpiry: number): void {
    this.logEvent('product_expired_alert', {
      product_name: productName,
      days_until_expiry: daysUntilExpiry,
      alert_type: 'expiration_warning'
    });
  }

  // Événements de navigation
  public trackPageView(pageName: string): void {
    this.logEvent('dashboard_viewed', {
      page_name: pageName,
      view_time: Date.now()
    });
  }

  public trackInventoryView(productCount: number): void {
    this.logEvent('inventory_viewed', {
      product_count: productCount,
      view_source: 'navigation'
    });
  }

  // Événements d'authentification
  public trackUserLogin(email: string, method: string): void {
    this.logEvent('user_login', {
      user_email: email,
      login_method: method,
      login_time: Date.now()
    });
  }

  // Événements pour les listes de courses
  public trackShoppingListCreated(itemsCount: number): void {
    this.logEvent('shopping_list_created', {
      items_count: itemsCount,
      creation_source: 'inventory_shortage'
    });
  }
}

// Export de l'instance singleton
export const analyticsService = AnalyticsService.getInstance();