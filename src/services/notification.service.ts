/**
 * CuisineZen Notification Service
 * Handles push notifications, in-app notifications, and notification preferences
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  expiryAlerts: boolean;
  inventoryLow: boolean;
  recipeUpdates: boolean;
  analyticsReports: boolean;
  marketingUpdates: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

export interface ScheduledNotification {
  id: string;
  type: string;
  payload: NotificationPayload;
  scheduledAt: Date;
  recurring?: {
    interval: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // 0-6 for Sunday-Saturday
  };
}

class NotificationService {
  private vapidPublicKey: string;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private preferences: NotificationPreferences;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();

  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    this.preferences = this.loadPreferences();
    this.initializeService();
  }

  /**
   * Initialize the notification service
   */
  async initializeService(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('Existing push subscription found');
        await this.syncSubscriptionWithServer();
      }

      // Load scheduled notifications
      await this.loadScheduledNotifications();

      // Setup notification event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Request notification permission and subscribe to push notifications
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        await this.subscribe();
        return true;
      }

      console.warn('Notification permission denied');
      return false;

    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    try {
      if (!this.registration || !this.vapidPublicKey) {
        throw new Error('Service worker or VAPID key not available');
      }

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      };

      this.subscription = await this.registration.pushManager.subscribe(subscribeOptions);
      console.log('Push subscription created:', this.subscription);

      // Send subscription to server
      await this.syncSubscriptionWithServer();

      return this.subscription;

    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.subscription) {
        return true;
      }

      const result = await this.subscription.unsubscribe();
      
      if (result) {
        this.subscription = null;
        await this.removeSubscriptionFromServer();
        console.log('Successfully unsubscribed from push notifications');
      }

      return result;

    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Show a local notification
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    try {
      if (!this.canShowNotification()) {
        console.log('Notification blocked by preferences or quiet hours');
        return;
      }

      if (this.registration) {
        await this.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/icon-72x72.png',
          image: payload.image,
          tag: payload.tag,
          requireInteraction: payload.requireInteraction || false,
          silent: payload.silent || false,
          vibrate: payload.vibrate || [200, 100, 200],
          data: payload.data,
          actions: payload.actions || [
            {
              action: 'open',
              title: 'Ouvrir',
              icon: '/icons/action-open.png'
            },
            {
              action: 'dismiss',
              title: 'Ignorer',
              icon: '/icons/action-dismiss.png'
            }
          ]
        });
      } else {
        // Fallback to browser notification
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          tag: payload.tag,
          silent: payload.silent || false,
          data: payload.data
        });
      }

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Schedule a notification for later
   */
  async scheduleNotification(notification: ScheduledNotification): Promise<void> {
    try {
      this.scheduledNotifications.set(notification.id, notification);
      await this.saveScheduledNotifications();

      const delay = notification.scheduledAt.getTime() - Date.now();
      
      if (delay > 0) {
        setTimeout(async () => {
          await this.showNotification(notification.payload);
          
          // Handle recurring notifications
          if (notification.recurring) {
            await this.scheduleRecurringNotification(notification);
          } else {
            this.scheduledNotifications.delete(notification.id);
            await this.saveScheduledNotifications();
          }
        }, delay);
      }

    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(id: string): Promise<void> {
    this.scheduledNotifications.delete(id);
    await this.saveScheduledNotifications();
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
    await this.savePreferences();
    
    // Update server with new preferences
    await this.syncPreferencesWithServer();
  }

  /**
   * Get current notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied';
  }

  /**
   * Check if subscribed to push notifications
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Create inventory expiry notification
   */
  async notifyInventoryExpiry(products: Array<{ name: string; expiryDate: Date; quantity: number }>): Promise<void> {
    if (!this.preferences.expiryAlerts) return;

    const expiredCount = products.filter(p => p.expiryDate <= new Date()).length;
    const expiringSoonCount = products.filter(p => {
      const daysUntilExpiry = (p.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 3;
    }).length;

    if (expiredCount > 0 || expiringSoonCount > 0) {
      const title = expiredCount > 0 
        ? `${expiredCount} produit(s) expiré(s)` 
        : `${expiringSoonCount} produit(s) expirent bientôt`;
      
      const body = expiredCount > 0
        ? `${expiredCount} produits ont expiré dans votre inventaire`
        : `${expiringSoonCount} produits expirent dans les 3 prochains jours`;

      await this.showNotification({
        title,
        body,
        tag: 'expiry-alert',
        requireInteraction: true,
        data: { 
          type: 'expiry',
          products,
          url: '/inventory?filter=expiring'
        },
        actions: [
          {
            action: 'view-inventory',
            title: 'Voir l\'inventaire',
            icon: '/icons/action-inventory.png'
          },
          {
            action: 'dismiss',
            title: 'Ignorer',
            icon: '/icons/action-dismiss.png'
          }
        ]
      });
    }
  }

  /**
   * Create low inventory notification
   */
  async notifyLowInventory(products: Array<{ name: string; quantity: number; minThreshold: number }>): Promise<void> {
    if (!this.preferences.inventoryLow) return;

    const lowStockProducts = products.filter(p => p.quantity <= p.minThreshold);
    
    if (lowStockProducts.length > 0) {
      await this.showNotification({
        title: `Stock faible: ${lowStockProducts.length} produit(s)`,
        body: `Certains produits sont en rupture de stock`,
        tag: 'low-inventory',
        data: {
          type: 'low-inventory',
          products: lowStockProducts,
          url: '/inventory?filter=low-stock'
        },
        actions: [
          {
            action: 'shopping-list',
            title: 'Liste de courses',
            icon: '/icons/action-shopping.png'
          },
          {
            action: 'view-inventory',
            title: 'Voir l\'inventaire',
            icon: '/icons/action-inventory.png'
          }
        ]
      });
    }
  }

  /**
   * Create recipe notification
   */
  async notifyRecipeUpdate(recipe: { name: string; type: 'new' | 'updated' }): Promise<void> {
    if (!this.preferences.recipeUpdates) return;

    const title = recipe.type === 'new' 
      ? 'Nouvelle recette disponible' 
      : 'Recette mise à jour';
    
    const body = recipe.type === 'new'
      ? `Découvrez la recette: ${recipe.name}`
      : `La recette "${recipe.name}" a été mise à jour`;

    await this.showNotification({
      title,
      body,
      tag: 'recipe-update',
      data: {
        type: 'recipe',
        recipe,
        url: '/recipes'
      },
      actions: [
        {
          action: 'view-recipe',
          title: 'Voir la recette',
          icon: '/icons/action-recipe.png'
        }
      ]
    });
  }

  /**
   * Create weekly analytics report notification
   */
  async notifyWeeklyReport(reportData: { savedMoney: number; itemsConsumed: number; wasteReduced: number }): Promise<void> {
    if (!this.preferences.analyticsReports) return;

    await this.showNotification({
      title: 'Rapport hebdomadaire CuisineZen',
      body: `Vous avez économisé ${reportData.savedMoney}€ cette semaine!`,
      tag: 'weekly-report',
      image: '/images/weekly-report-preview.png',
      data: {
        type: 'analytics',
        reportData,
        url: '/analytics?report=weekly'
      },
      actions: [
        {
          action: 'view-report',
          title: 'Voir le rapport',
          icon: '/icons/action-analytics.png'
        }
      ]
    });
  }

  // Private helper methods

  private canShowNotification(): boolean {
    if (!this.preferences.enabled) {
      return false;
    }

    if (this.preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = this.preferences.quietHours;
      
      if (start <= end) {
        // Same day range (e.g., 22:00 to 08:00)
        if (currentTime >= start && currentTime <= end) {
          return false;
        }
      } else {
        // Cross-midnight range (e.g., 22:00 to 08:00)
        if (currentTime >= start || currentTime <= end) {
          return false;
        }
      }
    }

    return true;
  }

  private async scheduleRecurringNotification(notification: ScheduledNotification): Promise<void> {
    if (!notification.recurring) return;

    const { interval, days } = notification.recurring;
    let nextScheduledAt: Date;

    const now = new Date();
    const originalDate = new Date(notification.scheduledAt);

    switch (interval) {
      case 'daily':
        nextScheduledAt = new Date(originalDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        if (days && days.length > 0) {
          // Find next occurrence based on specified days
          const currentDay = now.getDay();
          const sortedDays = days.sort((a, b) => a - b);
          const nextDay = sortedDays.find(day => day > currentDay) || sortedDays[0];
          const daysUntilNext = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
          nextScheduledAt = new Date(now.getTime() + daysUntilNext * 24 * 60 * 60 * 1000);
        } else {
          nextScheduledAt = new Date(originalDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        break;
      case 'monthly':
        nextScheduledAt = new Date(originalDate);
        nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 1);
        break;
      default:
        return;
    }

    // Set the time to match the original scheduled time
    nextScheduledAt.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);

    const recurringNotification: ScheduledNotification = {
      ...notification,
      scheduledAt: nextScheduledAt
    };

    await this.scheduleNotification(recurringNotification);
  }

  private setupEventListeners(): void {
    // Listen for visibility change to handle background notifications
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // App became visible, clear any pending notifications
        this.clearPendingNotifications();
      }
    });

    // Listen for focus to handle notification clicks
    window.addEventListener('focus', () => {
      this.clearPendingNotifications();
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NOTIFICATION_CLICK') {
          this.handleNotificationClick(event.data.payload);
        }
      });
    }
  }

  private clearPendingNotifications(): void {
    if (this.registration) {
      this.registration.getNotifications().then(notifications => {
        notifications.forEach(notification => {
          if (notification.tag !== 'critical') {
            notification.close();
          }
        });
      });
    }
  }

  private handleNotificationClick(data: any): void {
    // Handle different notification actions
    console.log('Notification clicked:', data);
    
    // You can implement specific routing logic here
    if (data.url) {
      window.location.href = data.url;
    }
  }

  private async syncSubscriptionWithServer(): Promise<void> {
    if (!this.subscription) return;

    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: this.subscription.toJSON(),
          preferences: this.preferences
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync subscription with server');
      }

      console.log('Subscription synced with server');
    } catch (error) {
      console.error('Failed to sync subscription:', error);
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }

      console.log('Subscription removed from server');
    } catch (error) {
      console.error('Failed to remove subscription:', error);
    }
  }

  private async syncPreferencesWithServer(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to sync preferences with server');
      }

      console.log('Preferences synced with server');
    } catch (error) {
      console.error('Failed to sync preferences:', error);
    }
  }

  private loadPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem('cuisinezen-notification-preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }

    return {
      enabled: true,
      expiryAlerts: true,
      inventoryLow: true,
      recipeUpdates: true,
      analyticsReports: true,
      marketingUpdates: false,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  private async savePreferences(): Promise<void> {
    try {
      localStorage.setItem('cuisinezen-notification-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  private async loadScheduledNotifications(): Promise<void> {
    try {
      const stored = localStorage.getItem('cuisinezen-scheduled-notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        for (const [id, notification] of Object.entries(notifications)) {
          this.scheduledNotifications.set(id, {
            ...(notification as ScheduledNotification),
            scheduledAt: new Date((notification as ScheduledNotification).scheduledAt)
          });
        }
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  }

  private async saveScheduledNotifications(): Promise<void> {
    try {
      const notifications = Object.fromEntries(this.scheduledNotifications);
      localStorage.setItem('cuisinezen-scheduled-notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;