import { 
  getFirestore, 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  getDoc,
  writeBatch,
  runTransaction,
  onSnapshot,
  Timestamp,
  FieldValue,
  CollectionGroup
} from 'firebase-admin/firestore';
import { CacheService } from './cache.service';

export class FirestoreAdvancedService {
  private db = getFirestore();

  /**
   * Requête paginée avec cache intelligent
   */
  async getPaginatedData<T>(
    collectionName: string,
    filters: any[] = [],
    sorting: { field: string; direction: 'asc' | 'desc' } = { field: 'createdAt', direction: 'desc' },
    pageSize: number = 20,
    lastDocId?: string,
    useCache: boolean = true
  ): Promise<{
    data: T[];
    lastDocId: string | null;
    hasMore: boolean;
    total?: number;
  }> {
    const cacheKey = `paginated:${collectionName}:${JSON.stringify(filters)}:${JSON.stringify(sorting)}:${pageSize}:${lastDocId || 'first'}`;
    
    if (useCache) {
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      let q = collection(this.db, collectionName);

      // Appliquer les filtres
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      // Appliquer le tri
      q = query(q, orderBy(sorting.field, sorting.direction));

      // Pagination
      if (lastDocId) {
        const lastDoc = await getDoc(doc(this.db, collectionName, lastDocId));
        if (lastDoc.exists()) {
          q = query(q, startAfter(lastDoc));
        }
      }

      q = query(q, limit(pageSize + 1)); // +1 pour vérifier s'il y a plus de données

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      const hasMore = docs.length > pageSize;
      const actualDocs = hasMore ? docs.slice(0, -1) : docs;
      
      const data = actualDocs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      const result = {
        data,
        lastDocId: actualDocs.length > 0 ? actualDocs[actualDocs.length - 1].id : null,
        hasMore,
      };

      // Cache pendant 5 minutes
      if (useCache) {
        await CacheService.set(cacheKey, result, 300);
      }

      return result;
    } catch (error) {
      console.error('Error in getPaginatedData:', error);
      throw error;
    }
  }

  /**
   * Requête avec agrégation
   */
  async getAggregatedData(
    collectionName: string,
    aggregations: Array<{
      field: string;
      operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
      filters?: any[];
    }>
  ): Promise<any> {
    const cacheKey = `aggregated:${collectionName}:${JSON.stringify(aggregations)}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const results: any = {};

    for (const agg of aggregations) {
      let q = collection(this.db, collectionName);

      // Appliquer les filtres spécifiques à cette agrégation
      if (agg.filters) {
        agg.filters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
      }

      const snapshot = await getDocs(q);
      const values = snapshot.docs
        .map(doc => doc.data()[agg.field])
        .filter(val => val !== undefined && val !== null);

      switch (agg.operation) {
        case 'count':
          results[`${agg.field}_count`] = values.length;
          break;
        case 'sum':
          results[`${agg.field}_sum`] = values.reduce((sum, val) => sum + (Number(val) || 0), 0);
          break;
        case 'avg':
          const sum = values.reduce((s, val) => s + (Number(val) || 0), 0);
          results[`${agg.field}_avg`] = values.length > 0 ? sum / values.length : 0;
          break;
        case 'min':
          results[`${agg.field}_min`] = values.length > 0 ? Math.min(...values.map(Number)) : null;
          break;
        case 'max':
          results[`${agg.field}_max`] = values.length > 0 ? Math.max(...values.map(Number)) : null;
          break;
      }
    }

    // Cache pendant 10 minutes
    await CacheService.set(cacheKey, results, 600);
    
    return results;
  }

  /**
   * Recherche full-text optimisée
   */
  async searchDocuments<T>(
    collectionName: string,
    searchTerm: string,
    searchFields: string[],
    filters: any[] = [],
    maxResults: number = 50
  ): Promise<T[]> {
    const cacheKey = `search:${collectionName}:${searchTerm}:${JSON.stringify(searchFields)}:${JSON.stringify(filters)}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Pour une recherche optimale, nous utilisons une approche combinée
      const searchTerms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
      
      let q = collection(this.db, collectionName);

      // Appliquer les filtres de base
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      const snapshot = await getDocs(q);
      
      // Filtrage et scoring côté client pour la recherche full-text
      const results = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          _score: this.calculateSearchScore(doc.data(), searchTerms, searchFields)
        }))
        .filter(item => item._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, maxResults)
        .map(({ _score, ...item }) => item) as T[];

      // Cache pendant 5 minutes
      await CacheService.set(cacheKey, results, 300);
      
      return results;
    } catch (error) {
      console.error('Error in searchDocuments:', error);
      throw error;
    }
  }

  private calculateSearchScore(data: any, searchTerms: string[], searchFields: string[]): number {
    let score = 0;
    
    searchTerms.forEach(term => {
      searchFields.forEach(field => {
        const fieldValue = String(data[field] || '').toLowerCase();
        
        if (fieldValue.includes(term)) {
          // Score plus élevé pour les correspondances exactes au début
          if (fieldValue.startsWith(term)) {
            score += 10;
          } else if (fieldValue.includes(` ${term}`)) {
            score += 5;
          } else {
            score += 1;
          }
        }
      });
    });
    
    return score;
  }

  /**
   * Batch operations optimisées
   */
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    id?: string;
    data?: any;
  }>): Promise<boolean> {
    const batchSize = 500; // Limite Firestore
    const batches: any[] = [];

    // Diviser en lots de 500 opérations max
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = writeBatch(this.db);
      const batchOps = operations.slice(i, i + batchSize);

      batchOps.forEach(op => {
        const docRef = op.id 
          ? doc(this.db, op.collection, op.id)
          : doc(collection(this.db, op.collection));

        switch (op.type) {
          case 'create':
            batch.set(docRef, {
              ...op.data,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...op.data,
              updatedAt: FieldValue.serverTimestamp()
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      batches.push(batch);
    }

    try {
      // Exécuter tous les batches
      await Promise.all(batches.map(batch => batch.commit()));
      
      // Invalider les caches pertinents
      const collections = [...new Set(operations.map(op => op.collection))];
      await Promise.all(
        collections.map(col => CacheService.invalidatePattern(`*${col}*`))
      );
      
      return true;
    } catch (error) {
      console.error('Error in batchWrite:', error);
      throw error;
    }
  }

  /**
   * Transaction avec retry automatique
   */
  async runTransactionWithRetry<T>(
    updateFunction: (transaction: any) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await runTransaction(this.db, updateFunction);
      } catch (error: any) {
        lastError = error;
        
        // Retry seulement pour certains types d'erreurs
        if (error.code === 'aborted' || error.code === 'failed-precondition') {
          if (attempt < maxRetries) {
            // Backoff exponentiel
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
            continue;
          }
        }
        
        // Pour les autres erreurs, échouer immédiatement
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Optimisation des index avec analyse des requêtes
   */
  async analyzeQueryPerformance(
    collectionName: string,
    queryAnalysis: {
      filters: any[];
      sorting: any;
      frequency: number; // Fréquence d'utilisation de cette requête
    }
  ): Promise<{
    recommendedIndexes: string[];
    estimatedPerformance: 'excellent' | 'good' | 'poor';
    suggestions: string[];
  }> {
    const recommendations: string[] = [];
    const suggestions: string[] = [];
    
    // Analyser les filtres pour recommander des index
    const filterFields = queryAnalysis.filters.map(f => f.field);
    const sortField = queryAnalysis.sorting?.field;
    
    if (filterFields.length > 0) {
      if (sortField && !filterFields.includes(sortField)) {
        recommendations.push(`Index composite: [${filterFields.join(', ')}, ${sortField}]`);
      } else {
        recommendations.push(`Index composite: [${filterFields.join(', ')}]`);
      }
    }
    
    // Analyser la performance estimée
    let estimatedPerformance: 'excellent' | 'good' | 'poor' = 'good';
    
    if (filterFields.length > 3) {
      estimatedPerformance = 'poor';
      suggestions.push('Considérer réduire le nombre de filtres ou utiliser une recherche en deux étapes');
    }
    
    if (queryAnalysis.frequency > 100) {
      suggestions.push('Requête très fréquente - considérer la mise en cache aggressive');
      if (estimatedPerformance === 'good') {
        estimatedPerformance = 'excellent';
      }
    }
    
    return {
      recommendedIndexes: recommendations,
      estimatedPerformance,
      suggestions
    };
  }

  /**
   * Surveillance en temps réel avec optimisations
   */
  setupRealtimeListener<T>(
    collectionName: string,
    filters: any[] = [],
    callback: (data: T[], changes: any[]) => void,
    options: {
      includeMetadataChanges?: boolean;
      cache?: boolean;
    } = {}
  ): () => void {
    let q = collection(this.db, collectionName);

    // Appliquer les filtres
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value));
    });

    const unsubscribe = onSnapshot(
      q,
      {
        includeMetadataChanges: options.includeMetadataChanges || false
      },
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];

        const changes = snapshot.docChanges().map(change => ({
          type: change.type,
          doc: {
            id: change.doc.id,
            ...change.doc.data()
          },
          oldIndex: change.oldIndex,
          newIndex: change.newIndex
        }));

        // Mettre en cache si demandé
        if (options.cache) {
          const cacheKey = `realtime:${collectionName}:${JSON.stringify(filters)}`;
          CacheService.set(cacheKey, data, 60); // Cache court pour les données temps réel
        }

        callback(data, changes);
      },
      (error) => {
        console.error('Realtime listener error:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Nettoyage automatique des données anciennes
   */
  async cleanupOldData(
    collectionName: string,
    olderThanDays: number,
    dateField: string = 'createdAt',
    batchSize: number = 100
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let deletedCount = 0;
    let lastDoc: any = null;

    do {
      let q = query(
        collection(this.db, collectionName),
        where(dateField, '<', Timestamp.fromDate(cutoffDate)),
        limit(batchSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        break;
      }

      const batch = writeBatch(this.db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += snapshot.docs.length;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

    } while (true);

    return deletedCount;
  }
}