'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Package, ChefHat, Clock, TrendingUp, Users } from 'lucide-react';

// Interface pour les métriques d'overview
interface OverviewData {
  totalProducts: number;
  totalRecipes: number;
  dailyOperations: number;
  avgPerformance: number;
  expiringProducts: number;
  weeklyGrowth: number;
}

// Données de simulation pour démonstration
const mockOverviewData: OverviewData = {
  totalProducts: 247,
  totalRecipes: 89,
  dailyOperations: 156,
  avgPerformance: 1.2, // secondes
  expiringProducts: 12,
  weeklyGrowth: 8.5 // pourcentage
};

export function OverviewMetrics() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des données
    const loadOverviewData = async () => {
      try {
        // En production, ici on ferait un appel API ou à Firebase
        await new Promise(resolve => setTimeout(resolve, 800));
        setData(mockOverviewData);
      } catch (error) {
        console.error('Erreur lors du chargement des métriques:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOverviewData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erreur lors du chargement des métriques</p>
      </div>
    );
  }

  const metrics = [
    {
      title: "Produits en Stock",
      value: data.totalProducts,
      description: "Articles dans l'inventaire",
      icon: Package,
      trend: data.totalProducts > 200 ? "positive" : "neutral"
    },
    {
      title: "Recettes Créées",
      value: data.totalRecipes,
      description: "Recettes disponibles",
      icon: ChefHat,
      trend: "positive"
    },
    {
      title: "Opérations/Jour",
      value: data.dailyOperations,
      description: "Activités quotidiennes",
      icon: Activity,
      trend: data.dailyOperations > 100 ? "positive" : "neutral"
    },
    {
      title: "Performance Moy.",
      value: `${data.avgPerformance}s`,
      description: "Temps de réponse moyen",
      icon: Clock,
      trend: data.avgPerformance < 2 ? "positive" : "negative"
    },
    {
      title: "Produits à Péremption",
      value: data.expiringProducts,
      description: "Alertes d'expiration",
      icon: Users,
      trend: data.expiringProducts > 15 ? "negative" : data.expiringProducts > 5 ? "neutral" : "positive"
    },
    {
      title: "Croissance",
      value: `+${data.weeklyGrowth}%`,
      description: "Cette semaine",
      icon: TrendingUp,
      trend: data.weeklyGrowth > 5 ? "positive" : "neutral"
    }
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Vue d'Ensemble</h2>
        <p className="text-sm text-muted-foreground">
          Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${getTrendColor(metric.trend)}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}