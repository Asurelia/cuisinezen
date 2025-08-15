'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { Zap, Clock, Server, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';

// Données de simulation pour les temps de réponse
const responseTimeData = [
  { time: '00:00', inventory: 1.2, recipes: 0.8, search: 2.1, auth: 0.5 },
  { time: '04:00', inventory: 1.1, recipes: 0.9, search: 1.8, auth: 0.4 },
  { time: '08:00', inventory: 1.5, recipes: 1.2, search: 2.8, auth: 0.7 },
  { time: '12:00', inventory: 2.1, recipes: 1.8, search: 3.2, auth: 1.1 },
  { time: '16:00', inventory: 1.8, recipes: 1.4, search: 2.6, auth: 0.9 },
  { time: '20:00', inventory: 1.3, recipes: 1.0, search: 2.2, auth: 0.6 }
];

// Données pour les métriques de performance par fonctionnalité
const featurePerformanceData = [
  { 
    name: 'Chargement Inventaire', 
    avgTime: 1.4, 
    targetTime: 2.0, 
    status: 'good',
    p95: 2.1,
    p99: 3.2,
    errorRate: 0.2
  },
  { 
    name: 'Création Recette', 
    avgTime: 0.8, 
    targetTime: 1.5, 
    status: 'excellent',
    p95: 1.2,
    p99: 1.8,
    errorRate: 0.1
  },
  { 
    name: 'Scan Code-barres', 
    avgTime: 2.6, 
    targetTime: 3.0, 
    status: 'good',
    p95: 3.8,
    p99: 4.5,
    errorRate: 1.2
  },
  { 
    name: 'Recherche Produits', 
    avgTime: 2.4, 
    targetTime: 2.0, 
    status: 'warning',
    p95: 3.1,
    p99: 4.2,
    errorRate: 0.3
  },
  { 
    name: 'Authentification', 
    avgTime: 0.7, 
    targetTime: 1.0, 
    status: 'excellent',
    p95: 1.1,
    p99: 1.4,
    errorRate: 0.0
  },
  { 
    name: 'Génération Menu', 
    avgTime: 3.8, 
    targetTime: 4.0, 
    status: 'good',
    p95: 5.2,
    p99: 6.8,
    errorRate: 0.5
  }
];

// Données pour l'utilisation des ressources
const resourceUsageData = [
  { time: '09:00', cpu: 45, memory: 62, network: 34 },
  { time: '10:00', cpu: 52, memory: 68, network: 41 },
  { time: '11:00', cpu: 38, memory: 59, network: 28 },
  { time: '12:00', cpu: 71, memory: 84, network: 65 },
  { time: '13:00', cpu: 68, memory: 79, network: 58 },
  { time: '14:00', cpu: 43, memory: 65, network: 35 },
  { time: '15:00', cpu: 49, memory: 71, network: 42 }
];

// Données pour les erreurs et succès
const errorRateData = [
  { day: 'Lun', success: 98.5, error: 1.5, total: 1200 },
  { day: 'Mar', success: 99.2, error: 0.8, total: 1450 },
  { day: 'Mer', success: 97.8, error: 2.2, total: 980 },
  { day: 'Jeu', success: 99.1, error: 0.9, total: 1680 },
  { day: 'Ven', success: 98.9, error: 1.1, total: 1820 },
  { day: 'Sam', success: 99.4, error: 0.6, total: 2100 },
  { day: 'Dim', success: 98.7, error: 1.3, total: 1350 }
];

export function PerformanceMetrics() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des données
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-32"></div>
              <div className="h-4 bg-muted rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Métriques de Performance</h2>
        <Badge variant="outline" className="text-xs">
          <Zap className="mr-1 h-3 w-3" />
          Monitoring en temps réel
        </Badge>
      </div>

      {/* Métriques globales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.52s</div>
            <p className="text-xs text-muted-foreground">
              -12% depuis hier
            </p>
            <Progress value={76} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.7%</div>
            <p className="text-xs text-muted-foreground">
              +0.3% depuis hier
            </p>
            <Progress value={98.7} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requêtes/Heure</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +8% depuis hier
            </p>
            <Progress value={82} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              +4 depuis hier
            </p>
            <Progress value={64} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Temps de réponse par fonctionnalité */}
        <Card>
          <CardHeader>
            <CardTitle>Temps de Réponse (24h)</CardTitle>
            <CardDescription>
              Evolution des temps de réponse par fonctionnalité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis label={{ value: 'Temps (s)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value}s`, 'Temps de réponse']} />
                <Line type="monotone" dataKey="inventory" stroke="#0088FE" strokeWidth={2} name="Inventaire" />
                <Line type="monotone" dataKey="recipes" stroke="#00C49F" strokeWidth={2} name="Recettes" />
                <Line type="monotone" dataKey="search" stroke="#FFBB28" strokeWidth={2} name="Recherche" />
                <Line type="monotone" dataKey="auth" stroke="#FF8042" strokeWidth={2} name="Auth" />
                <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="5 5" label="Seuil critique" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Utilisation des ressources */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisation des Ressources</CardTitle>
            <CardDescription>
              CPU, Mémoire et Réseau en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={resourceUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Utilisation']} />
                <Area type="monotone" dataKey="cpu" stackId="1" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} name="CPU" />
                <Area type="monotone" dataKey="memory" stackId="1" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} name="Mémoire" />
                <Area type="monotone" dataKey="network" stackId="1" stroke="#FFBB28" fill="#FFBB28" fillOpacity={0.6} name="Réseau" />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" label="Seuil d'alerte" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance par fonctionnalité */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par Fonctionnalité</CardTitle>
          <CardDescription>
            Détail des métriques de performance pour chaque fonctionnalité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featurePerformanceData.map((feature, index) => (
              <div key={feature.name} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(feature.status)}
                    <h4 className="font-medium">{feature.name}</h4>
                  </div>
                  <Badge className={`mt-1 text-xs ${getStatusColor(feature.status)}`}>
                    {feature.status === 'excellent' ? 'Excellent' : 
                     feature.status === 'good' ? 'Bon' : 
                     feature.status === 'warning' ? 'Attention' : 'Erreur'}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold">{feature.avgTime}s</div>
                  <div className="text-xs text-muted-foreground">Temps moyen</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold">{feature.p95}s</div>
                  <div className="text-xs text-muted-foreground">95e percentile</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold">{feature.errorRate}%</div>
                  <div className="text-xs text-muted-foreground">Taux d'erreur</div>
                </div>
                
                <div className="flex flex-col justify-center">
                  <Progress 
                    value={Math.min((feature.targetTime - feature.avgTime) / feature.targetTime * 100, 100)} 
                    className="mb-2"
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    Objectif: {feature.targetTime}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Taux de succès par jour */}
      <Card>
        <CardHeader>
          <CardTitle>Fiabilité Hebdomadaire</CardTitle>
          <CardDescription>
            Taux de succès et volume de requêtes par jour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={errorRateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" domain={[95, 100]} label={{ value: 'Taux (%)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Requêtes', angle: 90, position: 'insideRight' }} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'total' ? `${value} requêtes` : `${value}%`,
                  name === 'success' ? 'Succès' : name === 'error' ? 'Erreurs' : 'Total'
                ]} 
              />
              <Bar yAxisId="right" dataKey="total" fill="#e5e7eb" name="Total" />
              <Line yAxisId="left" type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={3} name="Succès" />
              <Line yAxisId="left" type="monotone" dataKey="error" stroke="#ef4444" strokeWidth={2} name="Erreurs" />
              <ReferenceLine yAxisId="left" y={98} stroke="#f59e0b" strokeDasharray="5 5" label="SLA" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}