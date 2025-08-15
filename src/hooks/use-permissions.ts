'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { permissionsService, type UserPermissions, type UserRole, type RestaurantUser } from '@/services/permissions';

export function useUserPermissions(restaurantId?: string) {
  const [user] = useAuthState(auth);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email || !restaurantId) {
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userPermissions, userRole] = await Promise.all([
          permissionsService.getUserPermissions(user.email!, restaurantId),
          permissionsService.getUserRole(user.email!, restaurantId)
        ]);

        if (!userPermissions) {
          // Utilisateur pas encore dans le système, le créer comme employé par défaut
          await permissionsService.createOrUpdateUser(
            user.email!,
            restaurantId,
            'employee',
            user.displayName || undefined
          );
          
          const newPermissions = await permissionsService.getUserPermissions(user.email!, restaurantId);
          setPermissions(newPermissions);
          setRole('employee');
        } else {
          setPermissions(userPermissions);
          setRole(userRole);
        }
      } catch (err: any) {
        setError(`Erreur chargement permissions: ${err.message}`);
        console.error('Erreur permissions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user?.email, restaurantId]);

  // Vérifier une permission spécifique
  const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
    return permissions?.[permission] || false;
  }, [permissions]);

  // Vérifier si l'utilisateur est admin
  const isAdmin = useCallback((): boolean => {
    return role === 'admin';
  }, [role]);

  // Vérifier si l'utilisateur peut effectuer une action
  const canPerformAction = useCallback((action: 'create' | 'edit' | 'delete' | 'view', entity: 'products' | 'recipes' | 'menus'): boolean => {
    if (!permissions) return false;

    const permissionKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}${entity.charAt(0).toUpperCase() + entity.slice(1)}` as keyof UserPermissions;
    return permissions[permissionKey] || false;
  }, [permissions]);

  return {
    permissions,
    role,
    loading,
    error,
    hasPermission,
    isAdmin,
    canPerformAction,
    userEmail: user?.email || null
  };
}

// Hook pour la gestion des utilisateurs (admin seulement)
export function useUserManagement(restaurantId?: string) {
  const [users, setUsers] = useState<RestaurantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useUserPermissions(restaurantId);

  useEffect(() => {
    if (!restaurantId || !isAdmin()) {
      setLoading(false);
      return;
    }

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const restaurantUsers = await permissionsService.getRestaurantUsers(restaurantId);
        setUsers(restaurantUsers);
      } catch (err: any) {
        setError(`Erreur chargement utilisateurs: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [restaurantId, isAdmin]);

  const createUser = useCallback(async (
    email: string,
    role: UserRole,
    displayName?: string,
    customPermissions?: Partial<UserPermissions>
  ) => {
    if (!restaurantId) throw new Error('Restaurant non spécifié');
    
    await permissionsService.createOrUpdateUser(email, restaurantId, role, displayName, customPermissions);
    
    // Recharger la liste
    const updatedUsers = await permissionsService.getRestaurantUsers(restaurantId);
    setUsers(updatedUsers);
  }, [restaurantId]);

  const updateUserPermissions = useCallback(async (
    email: string,
    permissions: Partial<UserPermissions>
  ) => {
    if (!restaurantId) throw new Error('Restaurant non spécifié');
    
    await permissionsService.updateUserPermissions(email, restaurantId, permissions);
    
    // Recharger la liste
    const updatedUsers = await permissionsService.getRestaurantUsers(restaurantId);
    setUsers(updatedUsers);
  }, [restaurantId]);

  const deactivateUser = useCallback(async (email: string) => {
    if (!restaurantId) throw new Error('Restaurant non spécifié');
    
    await permissionsService.deactivateUser(email, restaurantId);
    
    // Recharger la liste
    const updatedUsers = await permissionsService.getRestaurantUsers(restaurantId);
    setUsers(updatedUsers);
  }, [restaurantId]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUserPermissions,
    deactivateUser,
    refresh: () => {
      if (restaurantId) {
        permissionsService.getRestaurantUsers(restaurantId).then(setUsers);
      }
    }
  };
}

// Hook pour la protection des routes
export function useRouteProtection(requiredPermission: keyof UserPermissions, restaurantId?: string) {
  const { hasPermission, loading } = useUserPermissions(restaurantId);
  
  return {
    canAccess: hasPermission(requiredPermission),
    loading
  };
}

// Hook pour les actions conditionnelles
export function useConditionalActions(restaurantId?: string) {
  const { canPerformAction, isAdmin, loading } = useUserPermissions(restaurantId);

  const getAvailableActions = useCallback((entity: 'products' | 'recipes' | 'menus') => {
    return {
      canCreate: canPerformAction('create', entity),
      canEdit: canPerformAction('edit', entity),
      canDelete: canPerformAction('delete', entity),
      canView: canPerformAction('view', entity)
    };
  }, [canPerformAction]);

  const getAdminActions = useCallback(() => {
    if (!isAdmin()) return {};
    
    return {
      canManageUsers: true,
      canViewAnalytics: true,
      canManageSettings: true,
      canExportData: true
    };
  }, [isAdmin]);

  return {
    getAvailableActions,
    getAdminActions,
    isAdmin: isAdmin(),
    loading
  };
}