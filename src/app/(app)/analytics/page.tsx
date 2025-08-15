'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { analyticsService } from '@/lib/analytics';
import { performanceService } from '@/lib/performance';
import { ProductMetrics } from '@/components/analytics/product-metrics';
import { RecipeMetrics } from '@/components/analytics/recipe-metrics';
import { PerformanceMetrics } from '@/components/analytics/performance-metrics';
import { WeeklyReport } from '@/components/analytics/weekly-report';
import { ExpirationAlerts } from '@/components/analytics/expiration-alerts';
import { OverviewMetrics } from '@/components/analytics/overview-metrics';

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tracker la vue de la page analytics
    analyticsService.trackPageView('analytics_dashboard');
    
    // Simuler le chargement des données
    const loadData = async () => {
      const startTime = performance.now();
      const traceId = performanceService.startDashboardRender(6); // 6 composants principaux
      
      try {
        // Simuler le chargement des métriques
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const endTime = performance.now();
        performanceService.stopDashboardRender(traceId, endTime - startTime);
        
        setIsLoading(false);
      } catch (error) {
        performanceService.stopTrace(traceId, {
          dashboard_load_failed: 1
        });
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord Analytics</h1>
        <p className="text-muted-foreground">
          Suivez les performances de votre restaurant et optimisez votre gestion quotidienne.
        </p>
      </div>

      <Separator />

      {/* Vue d'ensemble */}
      <OverviewMetrics />

      <Separator />

      {/* Tabs pour les différentes sections */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="recipes">Recettes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <ProductMetrics />
        </TabsContent>

        <TabsContent value="recipes" className="space-y-6">
          <RecipeMetrics />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceMetrics />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <WeeklyReport />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <ExpirationAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}