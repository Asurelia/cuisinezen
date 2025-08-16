import { Context } from '../context';
import { ProductInput, ProductFilter, ProductSort, PaginationInput } from '../types';
import { ProductService } from '../../services/product.service';
import { CacheService } from '../../services/cache.service';
import { ValidationService } from '../../services/validation.service';
import { pubsub, PRODUCT_EVENTS } from '../subscriptions';
import DataLoader from 'dataloader';

// DataLoader pour optimiser les requêtes
const productLoader = new DataLoader(async (ids: readonly string[]) => {
  const products = await ProductService.getByIds(Array.from(ids));
  return ids.map(id => products.find(p => p.id === id) || null);
});

export const ProductResolvers = {
  Query: {
    products: async (
      _: any,
      { filter, sort, pagination }: {
        filter?: ProductFilter;
        sort?: ProductSort;
        pagination?: PaginationInput;
      },
      context: Context
    ) => {
      const cacheKey = `products:${JSON.stringify({ filter, sort, pagination })}`;
      
      // Vérifier le cache
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Validation des paramètres
      await ValidationService.validateProductFilter(filter);
      
      const result = await ProductService.getProducts(
        filter,
        sort,
        pagination || { page: 1, limit: 20 }
      );

      // Cache pendant 5 minutes
      await CacheService.set(cacheKey, result, 300);
      
      return result;
    },

    product: async (_: any, { id }: { id: string }, context: Context) => {
      return productLoader.load(id);
    },

    productsByBarcode: async (
      _: any,
      { barcode }: { barcode: string },
      context: Context
    ) => {
      const cacheKey = `products:barcode:${barcode}`;
      
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const products = await ProductService.getByBarcode(barcode);
      
      // Cache pendant 1 heure
      await CacheService.set(cacheKey, products, 3600);
      
      return products;
    },

    expiringProducts: async (
      _: any,
      { days = 7 }: { days?: number },
      context: Context
    ) => {
      const cacheKey = `products:expiring:${days}`;
      
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const products = await ProductService.getExpiringProducts(days);
      
      // Cache pendant 30 minutes
      await CacheService.set(cacheKey, products, 1800);
      
      return products;
    },
  },

  Mutation: {
    createProduct: async (
      _: any,
      { input }: { input: ProductInput },
      context: Context
    ) => {
      // Validation
      await ValidationService.validateProductInput(input);
      
      const product = await ProductService.create(input, context.userId);
      
      // Invalider les caches
      await CacheService.invalidatePattern('products:*');
      
      // Publier l'événement
      pubsub.publish(PRODUCT_EVENTS.PRODUCT_ADDED, { productAdded: product });
      
      return product;
    },

    updateProduct: async (
      _: any,
      { id, input }: { id: string; input: ProductInput },
      context: Context
    ) => {
      await ValidationService.validateProductInput(input);
      
      const product = await ProductService.update(id, input, context.userId);
      
      // Invalider les caches
      await CacheService.invalidatePattern('products:*');
      productLoader.clear(id);
      
      // Publier l'événement
      pubsub.publish(PRODUCT_EVENTS.PRODUCT_UPDATED, { productUpdated: product });
      
      return product;
    },

    deleteProduct: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      const success = await ProductService.delete(id, context.userId);
      
      if (success) {
        // Invalider les caches
        await CacheService.invalidatePattern('products:*');
        productLoader.clear(id);
        
        // Publier l'événement
        pubsub.publish(PRODUCT_EVENTS.PRODUCT_DELETED, { productDeleted: id });
      }
      
      return success;
    },

    bulkDeleteProducts: async (
      _: any,
      { ids }: { ids: string[] },
      context: Context
    ) => {
      const success = await ProductService.bulkDelete(ids, context.userId);
      
      if (success) {
        // Invalider les caches
        await CacheService.invalidatePattern('products:*');
        ids.forEach(id => productLoader.clear(id));
        
        // Publier les événements
        ids.forEach(id => {
          pubsub.publish(PRODUCT_EVENTS.PRODUCT_DELETED, { productDeleted: id });
        });
      }
      
      return success;
    },
  },

  Subscription: {
    productAdded: {
      subscribe: () => pubsub.asyncIterator([PRODUCT_EVENTS.PRODUCT_ADDED]),
    },
    
    productUpdated: {
      subscribe: () => pubsub.asyncIterator([PRODUCT_EVENTS.PRODUCT_UPDATED]),
    },
    
    productDeleted: {
      subscribe: () => pubsub.asyncIterator([PRODUCT_EVENTS.PRODUCT_DELETED]),
    },
    
    expirationAlert: {
      subscribe: () => pubsub.asyncIterator([PRODUCT_EVENTS.EXPIRATION_ALERT]),
    },
  },

  Product: {
    expirationStatus: (product: any) => {
      if (!product.expirationDate) return 'FRESH';
      
      const now = new Date();
      const expiration = new Date(product.expirationDate);
      const daysUntilExpiration = Math.ceil(
        (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExpiration < 0) return 'EXPIRED';
      if (daysUntilExpiration <= 3) return 'EXPIRING_SOON';
      return 'FRESH';
    },
  },
};