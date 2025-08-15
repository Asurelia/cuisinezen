'use client';

import { enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface OfflineQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineManager {
  private queue: OfflineQueueItem[] = [];
  private isProcessing = false;
  private readonly STORAGE_KEY = 'cuisinezen_offline_queue';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 seconde

  constructor() {
    this.loadQueue();
    this.setupPersistence();
    
    // Écouter les changements de connectivité
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      window.addEventListener('offline', () => this.saveQueue());
    }
  }

  private async setupPersistence() {
    if (!db) return;

    try {
      // Essayer la persistance multi-tab d'abord (plus récent)
      await enableMultiTabIndexedDbPersistence(db);
      console.log('✅ Persistance multi-tab activée');
    } catch (error: any) {
      if (error.code === 'unimplemented') {
        try {
          // Fallback vers la persistance simple
          await enableIndexedDbPersistence(db);
          console.log('✅ Persistance simple activée');
        } catch (err) {
          console.warn('⚠️ Persistance non disponible:', err);
        }
      } else if (error.code === 'failed-precondition') {
        console.warn('⚠️ Persistance déjà activée dans un autre onglet');
      } else {
        console.error('❌ Erreur persistance:', error);
      }
    }
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📦 ${this.queue.length} opérations en attente chargées`);
      }
    } catch (error) {
      console.error('Erreur chargement queue offline:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Erreur sauvegarde queue offline:', error);
    }
  }

  addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>) {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    };

    this.queue.push(queueItem);
    this.saveQueue();
    
    console.log(`📝 Opération ajoutée à la queue: ${item.type} ${item.collection}`);

    // Essayer de traiter immédiatement si en ligne
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Traitement de ${this.queue.length} opérations en attente`);

    const { firestoreService } = await import('./firestore');

    while (this.queue.length > 0 && navigator.onLine) {
      const item = this.queue[0];

      try {
        await this.executeQueueItem(item, firestoreService);
        
        // Succès : retirer de la queue
        this.queue.shift();
        console.log(`✅ Opération synchronisée: ${item.type} ${item.collection}`);
        
      } catch (error) {
        console.error(`❌ Erreur synchronisation:`, error);
        
        item.retryCount++;
        
        if (item.retryCount >= item.maxRetries) {
          // Échec définitif : retirer de la queue
          this.queue.shift();
          console.error(`💀 Opération abandonnée après ${item.maxRetries} tentatives`);
        } else {
          // Réessayer plus tard
          console.log(`🔄 Tentative ${item.retryCount}/${item.maxRetries} pour: ${item.type} ${item.collection}`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * item.retryCount));
        }
      }
    }

    this.saveQueue();
    this.isProcessing = false;
    
    if (this.queue.length === 0) {
      console.log('✅ Toutes les opérations synchronisées');
    }
  }

  private async executeQueueItem(item: OfflineQueueItem, firestoreService: any) {
    // Cette méthode doit être adaptée selon vos besoins spécifiques
    switch (item.collection) {
      case 'products':
        return this.executeProductOperation(item, firestoreService);
      case 'recipes':
        return this.executeRecipeOperation(item, firestoreService);
      default:
        throw new Error(`Collection non supportée: ${item.collection}`);
    }
  }

  private async executeProductOperation(item: OfflineQueueItem, firestoreService: any) {
    switch (item.type) {
      case 'create':
        return firestoreService.addProduct(item.data, item.data.createdBy);
      case 'update':
        return firestoreService.updateProduct(item.documentId, item.data, item.data.updatedBy);
      case 'delete':
        return firestoreService.deleteProduct(item.documentId, item.data.deletedBy);
    }
  }

  private async executeRecipeOperation(item: OfflineQueueItem, firestoreService: any) {
    switch (item.type) {
      case 'create':
        return firestoreService.addRecipe(item.data, item.data.createdBy);
      case 'update':
        return firestoreService.updateRecipe(item.documentId, item.data, item.data.updatedBy);
      case 'delete':
        return firestoreService.deleteRecipe(item.documentId, item.data.deletedBy);
    }
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      isOnline: navigator.onLine,
      oldestItem: this.queue.length > 0 ? new Date(this.queue[0].timestamp) : null
    };
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
    console.log('🗑️ Queue offline vidée');
  }

  // Méthode pour forcer la synchronisation
  async forcSync() {
    if (!navigator.onLine) {
      throw new Error('Synchronisation impossible: hors ligne');
    }
    
    return this.processQueue();
  }
}

// Instance singleton
export const offlineManager = new OfflineManager();

// Hook utilitaire pour les composants React
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [queueLength, setQueueLength] = React.useState(0);

  React.useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
      setQueueLength(offlineManager.getQueueStatus().queueLength);
    };

    updateStatus();
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    // Vérifier périodiquement la queue
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    queueLength,
    forceSync: () => offlineManager.forcSync(),
    clearQueue: () => offlineManager.clearQueue()
  };
}

// Ajout de React import pour le hook
import React from 'react';