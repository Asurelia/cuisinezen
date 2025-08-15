'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { migrationService, type MigrationProgress } from '@/services/migration';

export interface MigrationState {
  needed: boolean;
  inProgress: boolean;
  progress: MigrationProgress | null;
  error: string | null;
  completed: boolean;
}

export function useMigration(restaurantId?: string) {
  const [user] = useAuthState(auth);
  const [state, setState] = useState<MigrationState>({
    needed: false,
    inProgress: false,
    progress: null,
    error: null,
    completed: false
  });

  // Vérifier si la migration est nécessaire
  useEffect(() => {
    const needed = migrationService.isMigrationNeeded();
    setState(prev => ({ ...prev, needed }));
  }, []);

  // Démarrer la migration
  const startMigration = async () => {
    if (!user?.email || !restaurantId) {
      setState(prev => ({ 
        ...prev, 
        error: 'Utilisateur non connecté ou restaurant non spécifié' 
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      inProgress: true, 
      error: null, 
      completed: false 
    }));

    try {
      await migrationService.migrateToFirestore(
        restaurantId,
        user.email,
        (progress) => {
          setState(prev => ({ ...prev, progress }));
        }
      );

      setState(prev => ({ 
        ...prev, 
        inProgress: false, 
        completed: true, 
        needed: false 
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        inProgress: false, 
        error: `Erreur migration: ${error.message}` 
      }));
    }
  };

  // Réinitialiser la migration
  const resetMigration = () => {
    migrationService.resetMigration();
    setState({
      needed: true,
      inProgress: false,
      progress: null,
      error: null,
      completed: false
    });
  };

  // Ignorer la migration (pour tests ou cas spéciaux)
  const skipMigration = () => {
    setState(prev => ({ 
      ...prev, 
      needed: false, 
      completed: true 
    }));
  };

  return {
    ...state,
    startMigration,
    resetMigration,
    skipMigration,
    stats: migrationService.getMigrationStats()
  };
}