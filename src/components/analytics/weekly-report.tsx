'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ChefHat, 
  Clock, 
  Users,
  Mail
} from 'lucide-react';

// Données de simulation pour le rapport hebdomadaire
const weeklyData = {
  period: 'Semaine du 8 au 14 Janvier 2025',
  summary: {
    totalProducts: 247,
    newProducts: 23,
    totalRecipes: 89,
    newRecipes: 7,
    totalOperations: 1092,
    avgResponseTime: 1.4,
    userEngagement: 87.3
  },
  trends: {
    products: +15,
    recipes: +8,
    operations: +22,
    performance: -12
  },
  topCategories: [
    { name: 'Légumes', count: 85, trend: '+12%', color: '#0088FE' },
    { name: 'Viandes', count: 65, trend: '+8%', color: '#00C49F' },
    { name: 'Laitiers', count: 45, trend: '+5%', color: '#FFBB28' },
    { name: 'Céréales', count: 28, trend: '+3%', color: '#FF8042' }
  ],
  dailyActivity: [
    { day: 'Lun 8', products: 12, recipes: 2, operations: 145 },
    { day: 'Mar 9', products: 15, recipes: 1, operations: 167 },
    { day: 'Mer 10', products: 8, recipes: 0, operations: 123 },
    { day: 'Jeu 11', products: 18, recipes: 3, operations: 189 },
    { day: 'Ven 12', products: 22, recipes: 1, operations: 201 },
    { day: 'Sam 13', products: 25, recipes: 0, operations: 178 },
    { day: 'Dim 14', products: 14, recipes: 0, operations: 89 }
  ],
  insights: [
    {
      type: 'success',
      title: 'Performance excellente',
      description: 'Les temps de réponse ont été améliorés de 12% cette semaine'
    },
    {
      type: 'info',
      title: 'Pic d\'activité',
      description: 'Vendredi 12 janvier a été la journée la plus active avec 201 opérations'
    },
    {
      type: 'warning',
      title: 'Stock à surveiller',
      description: '12 produits arrivent à expiration dans les 3 prochains jours'
    },
    {
      type: 'success',
      title: 'Nouvelles recettes populaires',
      description: '3 nouvelles recettes ont été créées jeudi et sont déjà consultées régulièrement'
    }
  ],
  recommendations: [
    'Réapprovisionner les oignons et la farine (stocks critiques)',
    'Optimiser les recettes "Poulet au curry" et "Salade César" qui sont très demandées',
    'Planifier l\'utilisation des produits arrivant à expiration',
    'Continuer sur la lancée des créations de recettes du jeudi'
  ]
};

export function WeeklyReport() {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState(weeklyData);

  useEffect(() => {
    // Simuler le chargement des données
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleDownloadReport = () => {
    // Ici on pourrait générer et télécharger un PDF du rapport
    console.log('Téléchargement du rapport...');
  };

  const handleSendReport = () => {
    // Ici on pourrait envoyer le rapport par email
    console.log('Envoi du rapport par email...');
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = (trend: number) => {
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Package className="h-4 w-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-64"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du rapport */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rapport Hebdomadaire
              </CardTitle>
              <CardDescription>{reportData.period}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSendReport}>
                <Mail className="mr-2 h-4 w-4" />
                Envoyer
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Produits Total</p>
                <p className="text-2xl font-bold">{reportData.summary.totalProducts}</p>
                <p className="text-xs text-muted-foreground">+{reportData.summary.newProducts} cette semaine</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(reportData.trends.products)}
                <span className={`text-sm ${getTrendColor(reportData.trends.products)}`}>
                  {reportData.trends.products > 0 ? '+' : ''}{reportData.trends.products}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Recettes Total</p>
                <p className="text-2xl font-bold">{reportData.summary.totalRecipes}</p>
                <p className="text-xs text-muted-foreground">+{reportData.summary.newRecipes} cette semaine</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(reportData.trends.recipes)}
                <span className={`text-sm ${getTrendColor(reportData.trends.recipes)}`}>
                  {reportData.trends.recipes > 0 ? '+' : ''}{reportData.trends.recipes}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Opérations</p>
                <p className="text-2xl font-bold">{reportData.summary.totalOperations}</p>
                <p className="text-xs text-muted-foreground">Cette semaine</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(reportData.trends.operations)}
                <span className={`text-sm ${getTrendColor(reportData.trends.operations)}`}>
                  {reportData.trends.operations > 0 ? '+' : ''}{reportData.trends.operations}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Performance</p>
                <p className="text-2xl font-bold">{reportData.summary.avgResponseTime}s</p>
                <p className="text-xs text-muted-foreground">Temps moyen</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(reportData.trends.performance)}
                <span className={`text-sm ${getTrendColor(reportData.trends.performance)}`}>
                  {reportData.trends.performance > 0 ? '+' : ''}{reportData.trends.performance}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Activité quotidienne */}
        <Card>
          <CardHeader>
            <CardTitle>Activité Quotidienne</CardTitle>
            <CardDescription>
              Répartition des activités par jour de la semaine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="products" fill="#0088FE" name="Produits ajoutés" />
                <Bar dataKey="recipes" fill="#00C49F" name="Recettes créées" />
                <Bar dataKey="operations" fill="#FFBB28" name="Opérations totales" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top catégories */}
        <Card>
          <CardHeader>
            <CardTitle>Catégories les Plus Actives</CardTitle>
            <CardDescription>
              Répartition des ajouts par catégorie de produits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.topCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {reportData.topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} produits`, 'Quantité']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {reportData.topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span>{category.name}</span>
                  </div>
                  <span className="text-green-600 font-medium">{category.trend}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights et recommandations */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Insights de la Semaine</CardTitle>
            <CardDescription>
              Observations importantes et points d'attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.insights.map((insight, index) => (
                <div key={index} className={`p-3 border rounded-lg ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommandations</CardTitle>
            <CardDescription>
              Actions suggérées pour optimiser votre gestion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer du rapport */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Rapport généré automatiquement le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
            <p className="mt-1">Prochaine génération prévue le {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}