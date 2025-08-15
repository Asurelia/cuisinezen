'use client';

import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import {
  useFirestoreProducts,
  useUserPermissions,
  useMigration,
  useOfflineStatus,
  useCostMonitoring
} from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function FirestoreIntegrationExample() {
  const [user] = useAuthState(auth);
  const restaurantId = 'default-restaurant'; // À adapter selon votre logique
  
  // Hooks pour les données
  const { products, loading: productsLoading, addProduct } = useFirestoreProducts(restaurantId);
  const { permissions, isAdmin, loading: permissionsLoading } = useUserPermissions(restaurantId);
  const { needed: migrationNeeded, startMigration, progress } = useMigration(restaurantId);
  const { isOnline, queueLength } = useOfflineStatus();
  const { metrics, isNearLimit } = useCostMonitoring();

  // Migration automatique si nécessaire
  useEffect(() => {
    if (migrationNeeded && user?.email && !progress?.inProgress) {
      console.log('🔄 Migration automatique démarrée');
      startMigration();
    }
  }, [migrationNeeded, user?.email, startMigration, progress?.inProgress]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connexion requise</CardTitle>
          <CardDescription>Veuillez vous connecter pour accéder aux données</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statut de connexion et migration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? "En ligne" : "Hors ligne"}
              </Badge>
              {queueLength > 0 && (
                <Badge variant="secondary">{queueLength} en attente</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isAdmin() ? "default" : "outline"}>
              {isAdmin() ? "Administrateur" : "Utilisateur"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Utilisation Firebase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {metrics.dailyReads} lectures / 50k
            </div>
            <Progress 
              value={(metrics.dailyReads / 50000) * 100} 
              className="mt-2" 
            />
            {isNearLimit && (
              <div className="text-xs text-orange-600 mt-1">
                Proche de la limite
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Migration en cours */}
      {progress?.inProgress && (
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress.step}</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} />
              {progress.errors.length > 0 && (
                <div className="text-red-600 text-xs">
                  {progress.errors.length} erreur(s) détectée(s)
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Données produits */}
      <Card>
        <CardHeader>
          <CardTitle>Produits Firestore</CardTitle>
          <CardDescription>
            {productsLoading ? 'Chargement...' : `${products.length} produit(s) chargé(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Affichage des produits */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.slice(0, 6).map((product) => (
                <div key={product.id} className="border rounded p-3">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {product.category} - {product.batches.length} lot(s)
                  </div>
                </div>
              ))}
            </div>

            {/* Actions selon les permissions */}
            <div className="flex gap-2">
              {permissions?.canCreateProducts && (
                <Button 
                  onClick={() => addProduct({
                    name: `Nouveau produit ${Date.now()}`,
                    category: 'épicerie',
                    batches: []
                  })}
                  size="sm"
                >
                  Ajouter un produit test
                </Button>
              )}
              
              {permissions?.canViewAnalytics && (
                <Button variant="outline" size="sm">
                  Voir les statistiques
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations d'optimisation */}
      {isAdmin() && metrics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommandations</CardTitle>
            <CardDescription>
              Optimisations pour réduire les coûts Firebase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Debug info pour développement */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify({
                user: user?.email,
                restaurantId,
                productsCount: products.length,
                permissions: permissions ? Object.keys(permissions).filter(k => permissions[k as keyof typeof permissions]) : [],
                metrics: {
                  reads: metrics.dailyReads,
                  writes: metrics.dailyWrites,
                  cost: `$${metrics.monthlyCost.toFixed(4)}/mois`
                }
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}