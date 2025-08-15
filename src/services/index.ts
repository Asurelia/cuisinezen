// Services principaux
export { firestoreService } from './firestore';
export { offlineManager } from './offline-manager';
export { migrationService } from './migration';
export { permissionsService } from './permissions';
export { costOptimizer, TrackedFirestoreOperations } from './cost-optimizer';

// Types et interfaces
export type {
  RestaurantData,
  FirestoreProduct,
  FirestoreRecipe,
  UserActivity
} from './firestore';

export type {
  OfflineQueueItem
} from './offline-manager';

export type {
  MigrationProgress
} from './migration';

export type {
  UserRole,
  UserPermissions,
  RestaurantUser
} from './permissions';

export type {
  CostMetrics,
  QueryOptimization
} from './cost-optimizer';

// Hooks
export { 
  useFirestoreProducts, 
  useFirestoreRecipes, 
  useFirestoreProduct,
  useFirestoreStats 
} from '../hooks/use-firestore';

export {
  useUserPermissions,
  useUserManagement,
  useRouteProtection,
  useConditionalActions
} from '../hooks/use-permissions';

export {
  useMigration
} from '../hooks/use-migration';

export {
  useOfflineStatus
} from './offline-manager';

export {
  useCostMonitoring
} from './cost-optimizer';