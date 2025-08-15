'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { ShoppingCart, Package, TrendingUp, AlertTriangle } from 'lucide-react';

// Données de simulation pour les produits populaires
const popularProducts = [
  { name: 'Tomates', count: 45, trend: '+12%', category: 'Légumes' },
  { name: 'Poulet', count: 38, trend: '+8%', category: 'Viandes' },
  { name: 'Lait', count: 32, trend: '+5%', category: 'Laitiers' },
  { name: 'Pain', count: 29, trend: '+15%', category: 'Boulangerie' },
  { name: 'Oeufs', count: 25, trend: '+3%', category: 'Laitiers' },
  { name: 'Riz', count: 22, trend: '-2%', category: 'Céréales' }
];

// Données pour les catégories de produits
const categoryData = [
  { name: 'Légumes', value: 85, count: 85, color: '#0088FE' },
  { name: 'Viandes', value: 65, count: 65, color: '#00C49F' },
  { name: 'Laitiers', value: 45, count: 45, color: '#FFBB28' },
  { name: 'Boulangerie', value: 32, count: 32, color: '#FF8042' },
  { name: 'Céréales', value: 28, count: 28, color: '#8884d8' },
  { name: 'Autres', value: 15, count: 15, color: '#82ca9d' }
];

// Données pour l'évolution des ajouts de produits (7 derniers jours)
const productAdditionsData = [
  { day: 'Lun', count: 12, scan: 4 },
  { day: 'Mar', count: 15, scan: 6 },
  { day: 'Mer', count: 8, scan: 2 },
  { day: 'Jeu', count: 18, scan: 8 },
  { day: 'Ven', count: 22, scan: 12 },
  { day: 'Sam', count: 25, scan: 15 },
  { day: 'Dim', count: 14, scan: 5 }
];

// Données pour les stocks faibles
const lowStockProducts = [
  { name: 'Oignons', stock: 2, minStock: 10, category: 'Légumes' },
  { name: 'Farine', stock: 1, minStock: 5, category: 'Céréales' },
  { name: 'Huile d\'olive', stock: 3, minStock: 8, category: 'Condiments' },
  { name: 'Beurre', stock: 1, minStock: 6, category: 'Laitiers' }
];

export function ProductMetrics() {
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

  const getTrendIcon = (trend: string) => {
    return trend.startsWith('+') ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Métriques des Produits</h2>
        <Badge variant="outline" className="text-xs">
          <Package className="mr-1 h-3 w-3" />
          {popularProducts.reduce((acc, p) => acc + p.count, 0)} produits trackés
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Produits populaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Produits les Plus Ajoutés
            </CardTitle>
            <CardDescription>
              Top 6 des produits les plus fréquemment ajoutés à l'inventaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularProducts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`${value} ajouts`, 'Fréquence']}
                  labelFormatter={(label) => `Produit: ${label}`}
                />
                <Bar dataKey="count" fill="#0088FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {popularProducts.slice(0, 3).map((product, index) => (
                <div key={product.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}></div>
                    <span className="font-medium">{product.name}</span>
                    <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon(product.trend)}
                    <span className={product.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                      {product.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Répartition par catégories */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Catégories</CardTitle>
            <CardDescription>
              Distribution des produits par catégorie dans l'inventaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} produits`, 'Quantité']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Évolution des ajouts */}
        <Card>
          <CardHeader>
            <CardTitle>Ajouts de Produits (7 jours)</CardTitle>
            <CardDescription>
              Évolution quotidienne des ajouts manuels vs scan de codes-barres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={productAdditionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Ajouts manuels' : 'Scans']} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stackId="1" 
                  stroke="#0088FE" 
                  fill="#0088FE" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="scan" 
                  stackId="1" 
                  stroke="#00C49F" 
                  fill="#00C49F" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stocks faibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Stocks Faibles
            </CardTitle>
            <CardDescription>
              Produits nécessitant un réapprovisionnement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{product.name}</h4>
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Stock actuel: {product.stock} | Min recommandé: {product.minStock}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={product.stock <= 2 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {product.stock <= 2 ? 'Critique' : 'Bas'}
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  {lowStockProducts.length} produit{lowStockProducts.length > 1 ? 's' : ''} nécessite{lowStockProducts.length === 1 ? '' : 'nt'} un réapprovisionnement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}