'use client';

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type UserRole = 'admin' | 'manager' | 'employee';

export interface UserPermissions {
  // Gestion des produits
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canViewProducts: boolean;
  
  // Gestion des recettes
  canCreateRecipes: boolean;
  canEditRecipes: boolean;
  canDeleteRecipes: boolean;
  canViewRecipes: boolean;
  
  // Gestion du menu
  canCreateMenus: boolean;
  canEditMenus: boolean;
  canDeleteMenus: boolean;
  canViewMenus: boolean;
  
  // Administration
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canExportData: boolean;
  
  // Permissions spéciales
  canAccessOfflineData: boolean;
  canForceSync: boolean;
}

export interface RestaurantUser {
  email: string;
  role: UserRole;
  displayName?: string;
  isActive: boolean;
  joinedAt: any;
  lastLoginAt?: any;
  permissions: UserPermissions;
  restaurantId: string;
}

// Permissions par défaut selon le rôle
const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewProducts: true,
    canCreateRecipes: true,
    canEditRecipes: true,
    canDeleteRecipes: true,
    canViewRecipes: true,
    canCreateMenus: true,
    canEditMenus: true,
    canDeleteMenus: true,
    canViewMenus: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canManageSettings: true,
    canExportData: true,
    canAccessOfflineData: true,
    canForceSync: true
  },
  manager: {
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: false,
    canViewProducts: true,
    canCreateRecipes: true,
    canEditRecipes: true,
    canDeleteRecipes: false,
    canViewRecipes: true,
    canCreateMenus: true,
    canEditMenus: true,
    canDeleteMenus: false,
    canViewMenus: true,
    canManageUsers: false,
    canViewAnalytics: true,
    canManageSettings: false,
    canExportData: true,
    canAccessOfflineData: true,
    canForceSync: false
  },
  employee: {
    canCreateProducts: false,
    canEditProducts: true,
    canDeleteProducts: false,
    canViewProducts: true,
    canCreateRecipes: false,
    canEditRecipes: false,
    canDeleteRecipes: false,
    canViewRecipes: true,
    canCreateMenus: false,
    canEditMenus: false,
    canDeleteMenus: false,
    canViewMenus: true,
    canManageUsers: false,
    canViewAnalytics: false,
    canManageSettings: false,
    canExportData: false,
    canAccessOfflineData: false,
    canForceSync: false
  }
};

class PermissionsService {
  private userCache = new Map<string, RestaurantUser>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Obtenir les permissions d'un utilisateur
  async getUserPermissions(userEmail: string, restaurantId: string): Promise<UserPermissions | null> {
    if (!db) throw new Error('Firestore non initialisé');

    const cacheKey = `${userEmail}-${restaurantId}`;
    const cached = this.userCache.get(cacheKey);

    if (cached) {
      return cached.permissions;
    }

    try {
      const userRef = doc(db, 'restaurants', restaurantId, 'users', userEmail);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      const userData = userSnap.data() as RestaurantUser;
      this.userCache.set(cacheKey, userData);

      return userData.permissions;
    } catch (error) {
      console.error('Erreur lecture permissions:', error);
      return null;
    }
  }

  // Obtenir le rôle d'un utilisateur
  async getUserRole(userEmail: string, restaurantId: string): Promise<UserRole | null> {
    const permissions = await this.getUserPermissions(userEmail, restaurantId);
    if (!permissions) return null;

    const user = this.userCache.get(`${userEmail}-${restaurantId}`);
    return user?.role || null;
  }

  // Créer ou mettre à jour un utilisateur
  async createOrUpdateUser(
    userEmail: string,
    restaurantId: string,
    role: UserRole,
    displayName?: string,
    customPermissions?: Partial<UserPermissions>
  ): Promise<void> {
    if (!db) throw new Error('Firestore non initialisé');

    const userRef = doc(db, 'restaurants', restaurantId, 'users', userEmail);
    const permissions = customPermissions 
      ? { ...DEFAULT_PERMISSIONS[role], ...customPermissions }
      : DEFAULT_PERMISSIONS[role];

    const userData: RestaurantUser = {
      email: userEmail,
      role,
      displayName,
      isActive: true,
      joinedAt: new Date(),
      permissions,
      restaurantId
    };

    try {
      await setDoc(userRef, userData, { merge: true });
      
      // Mettre à jour le cache
      this.userCache.set(`${userEmail}-${restaurantId}`, userData);
      
      console.log(`✅ Utilisateur ${role} créé/mis à jour:`, userEmail);
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      throw error;
    }
  }

  // Mettre à jour les permissions spécifiques
  async updateUserPermissions(
    userEmail: string,
    restaurantId: string,
    permissions: Partial<UserPermissions>
  ): Promise<void> {
    if (!db) throw new Error('Firestore non initialisé');

    const userRef = doc(db, 'restaurants', restaurantId, 'users', userEmail);

    try {
      await updateDoc(userRef, { permissions });
      
      // Mettre à jour le cache
      const cached = this.userCache.get(`${userEmail}-${restaurantId}`);
      if (cached) {
        cached.permissions = { ...cached.permissions, ...permissions };
      }
      
      console.log(`✅ Permissions mises à jour pour:`, userEmail);
    } catch (error) {
      console.error('Erreur mise à jour permissions:', error);
      throw error;
    }
  }

  // Désactiver un utilisateur
  async deactivateUser(userEmail: string, restaurantId: string): Promise<void> {
    if (!db) throw new Error('Firestore non initialisé');

    const userRef = doc(db, 'restaurants', restaurantId, 'users', userEmail);

    try {
      await updateDoc(userRef, { isActive: false });
      
      // Retirer du cache
      this.userCache.delete(`${userEmail}-${restaurantId}`);
      
      console.log(`✅ Utilisateur désactivé:`, userEmail);
    } catch (error) {
      console.error('Erreur désactivation utilisateur:', error);
      throw error;
    }
  }

  // Lister tous les utilisateurs du restaurant
  async getRestaurantUsers(restaurantId: string): Promise<RestaurantUser[]> {
    if (!db) throw new Error('Firestore non initialisé');

    try {
      const usersRef = collection(db, 'restaurants', restaurantId, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users: RestaurantUser[] = [];
      querySnapshot.forEach(doc => {
        users.push(doc.data() as RestaurantUser);
      });

      return users.filter(user => user.isActive);
    } catch (error) {
      console.error('Erreur liste utilisateurs:', error);
      return [];
    }
  }

  // Vérifier une permission spécifique
  async checkPermission(
    userEmail: string,
    restaurantId: string,
    permission: keyof UserPermissions
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userEmail, restaurantId);
    return permissions?.[permission] || false;
  }

  // Vérifier si l'utilisateur est admin
  async isAdmin(userEmail: string, restaurantId: string): Promise<boolean> {
    const role = await this.getUserRole(userEmail, restaurantId);
    return role === 'admin';
  }

  // Initialiser le premier utilisateur admin
  async initializeFirstAdmin(userEmail: string, restaurantId: string): Promise<void> {
    // Vérifier s'il y a déjà des admins
    const users = await this.getRestaurantUsers(restaurantId);
    const hasAdmin = users.some(user => user.role === 'admin');

    if (!hasAdmin) {
      await this.createOrUpdateUser(userEmail, restaurantId, 'admin');
      console.log(`✅ Premier admin initialisé: ${userEmail}`);
    }
  }

  // Nettoyer le cache
  clearCache() {
    this.userCache.clear();
  }

  // Obtenir les statistiques du cache
  getCacheStats() {
    return {
      cacheSize: this.userCache.size,
      cachedUsers: Array.from(this.userCache.keys())
    };
  }
}

// Instance singleton
export const permissionsService = new PermissionsService();

// Utilitaires pour les composants React
export function getPermissionLabel(permission: keyof UserPermissions): string {
  const labels: Record<keyof UserPermissions, string> = {
    canCreateProducts: 'Créer des produits',
    canEditProducts: 'Modifier les produits',
    canDeleteProducts: 'Supprimer les produits',
    canViewProducts: 'Voir les produits',
    canCreateRecipes: 'Créer des recettes',
    canEditRecipes: 'Modifier les recettes',
    canDeleteRecipes: 'Supprimer les recettes',
    canViewRecipes: 'Voir les recettes',
    canCreateMenus: 'Créer des menus',
    canEditMenus: 'Modifier les menus',
    canDeleteMenus: 'Supprimer les menus',
    canViewMenus: 'Voir les menus',
    canManageUsers: 'Gérer les utilisateurs',
    canViewAnalytics: 'Voir les statistiques',
    canManageSettings: 'Gérer les paramètres',
    canExportData: 'Exporter les données',
    canAccessOfflineData: 'Accès hors ligne',
    canForceSync: 'Forcer la synchronisation'
  };

  return labels[permission] || permission;
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    employee: 'Employé'
  };

  return labels[role];
}

export { DEFAULT_PERMISSIONS };