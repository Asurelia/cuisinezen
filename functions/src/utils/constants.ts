// Configuration pour optimiser les coûts
export const COST_OPTIMIZATION = {
  // Limiter les exécutions simultanées
  MAX_CONCURRENT_EXECUTIONS: 10,
  
  // Timeout court pour éviter les coûts
  FUNCTION_TIMEOUT: 300, // 5 minutes max
  
  // Memory allocation optimale
  MEMORY_SIZE: "256MB" as const,
  
  // Réutilisation d'instances
  MIN_INSTANCES: 0,
  MAX_INSTANCES: 3,
  
  // Cache TTL pour éviter les appels répétés
  CACHE_TTL: 3600, // 1 heure
};

export const COLLECTIONS = {
  PRODUCTS: "products",
  RECIPES: "recipes",
  USERS: "users",
  SETTINGS: "settings",
  NOTIFICATIONS: "notifications",
  BACKUPS: "backups",
  SHOPPING_LISTS: "shopping-lists",
  COST_ANALYSES: "cost-analyses",
  POS_TRANSACTIONS: "pos-transactions",
} as const;

export const NOTIFICATION_SETTINGS = {
  DEFAULT_EXPIRY_DAYS: 3,
  MORNING_HOUR: 8,
  TIMEZONE: "Europe/Paris",
} as const;

export const BACKUP_SETTINGS = {
  RETENTION_DAYS: 30,
  MAX_BACKUPS: 30,
  COMPRESSION: true,
} as const;