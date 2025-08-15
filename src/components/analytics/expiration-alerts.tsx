'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  Line
} from 'recharts';
import { 
  AlertTriangle, 
  Clock, 
  Package, 
  Calendar, 
  Bell, 
  CheckCircle,
  XCircle,
  Mail,
  Smartphone
} from 'lucide-react';
import { analyticsService } from '@/lib/analytics';

// Données de simulation pour les produits arrivant à expiration
const expiringProducts = [
  {
    id: '1',
    name: 'Lait entier',
    category: 'Laitiers',
    quantity: 3,
    expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Dans 1 jour
    daysUntilExpiry: 1,
    priority: 'critical',
    batchId: 'LOT001'
  },
  {
    id: '2',
    name: 'Pain de mie',
    category: 'Boulangerie',
    quantity: 2,
    expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Dans 1 jour
    daysUntilExpiry: 1,
    priority: 'critical',
    batchId: 'LOT002'
  },
  {
    id: '3',
    name: 'Yaourts nature',
    category: 'Laitiers',
    quantity: 8,
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Dans 2 jours
    daysUntilExpiry: 2,
    priority: 'high',
    batchId: 'LOT003'
  },
  {
    id: '4',
    name: 'Tomates cerises',
    category: 'Légumes',
    quantity: 5,
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
    daysUntilExpiry: 3,
    priority: 'high',
    batchId: 'LOT004'
  },
  {
    id: '5',
    name: 'Saumon frais',
    category: 'Poissons',
    quantity: 1,
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Dans 2 jours
    daysUntilExpiry: 2,
    priority: 'critical',
    batchId: 'LOT005'
  },
  {
    id: '6',
    name: 'Salade verte',
    category: 'Légumes',
    quantity: 4,
    expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Dans 4 jours
    daysUntilExpiry: 4,
    priority: 'medium',
    batchId: 'LOT006'
  }
];

// Données pour l'analyse des tendances d'expiration
const expirationTrendData = [
  { week: 'S-3', expired: 5, prevented: 12, total: 17 },
  { week: 'S-2', expired: 8, prevented: 15, total: 23 },
  { week: 'S-1', expired: 3, prevented: 18, total: 21 },
  { week: 'S0', expired: 2, prevented: 14, total: 16 }
];

// Données pour la répartition par catégorie
const categoryExpirationData = [
  { name: 'Laitiers', count: 11, color: '#0088FE' },
  { name: 'Légumes', count: 9, color: '#00C49F' },
  { name: 'Viandes', count: 6, color: '#FFBB28' },
  { name: 'Poissons', count: 3, color: '#FF8042' },
  { name: 'Boulangerie', count: 2, color: '#8884d8' }
];

// Configuration des notifications
interface NotificationSettings {
  email: boolean;
  push: boolean;
  dailyDigest: boolean;
  criticalOnly: boolean;
}

export function ExpirationAlerts() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState(expiringProducts);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    dailyDigest: true,
    criticalOnly: false
  });

  useEffect(() => {
    // Simuler le chargement des données
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Tracker les alertes d'expiration pour chaque produit critique
    products
      .filter(p => p.priority === 'critical')
      .forEach(product => {
        analyticsService.trackExpirationAlert(product.name, product.daysUntilExpiry);
      });

    return () => clearTimeout(timer);
  }, [products]);

  const handleMarkAsUsed = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    // Ici on pourrait aussi déclencher une action pour retirer le produit de l'inventaire
  };

  const handleSnoozeAlert = (productId: string) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, priority: p.priority === 'critical' ? 'high' as const : p.priority }
          : p
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const criticalCount = products.filter(p => p.priority === 'critical').length;
  const highCount = products.filter(p => p.priority === 'high').length;
  const totalValue = products.reduce((acc, p) => acc + (p.quantity * 5), 0); // Estimation à 5€ par unité

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
      {/* Vue d'ensemble des alertes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Critique (1-2 jours)</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{criticalCount}</div>
            <p className="text-xs text-red-700">Attention immédiate requise</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Élevé (3-4 jours)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{highCount}</div>
            <p className="text-xs text-orange-700">À planifier rapidement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">À consommer bientôt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Estimée</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue}€</div>
            <p className="text-xs text-muted-foreground">À risque de perte</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes critiques */}
      {criticalCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">
            Alertes Critiques - Action Immédiate Requise
          </AlertTitle>
          <AlertDescription className="text-red-800">
            {criticalCount} produit{criticalCount > 1 ? 's' : ''} expire{criticalCount === 1 ? '' : 'nt'} dans 1-2 jours. 
            Planifiez leur utilisation dès maintenant pour éviter le gaspillage.
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des produits expirant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Produits Arrivant à Expiration
          </CardTitle>
          <CardDescription>
            Liste détaillée des produits à consommer en priorité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products
              .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
              .map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getPriorityIcon(product.priority)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{product.name}</h4>
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                      <Badge className={`text-xs ${getPriorityColor(product.priority)}`}>
                        {product.priority === 'critical' ? 'Critique' :
                         product.priority === 'high' ? 'Élevé' : 'Moyen'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Quantité: {product.quantity}</span>
                      <span>Lot: {product.batchId}</span>
                      <span>Expire le: {product.expiryDate.toLocaleDateString('fr-FR')}</span>
                      <span className={`font-medium ${
                        product.daysUntilExpiry <= 1 ? 'text-red-600' :
                        product.daysUntilExpiry <= 3 ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {product.daysUntilExpiry === 0 ? 'Aujourd\'hui' :
                         product.daysUntilExpiry === 1 ? 'Demain' :
                         `Dans ${product.daysUntilExpiry} jours`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSnoozeAlert(product.id)}
                  >
                    Reporter
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleMarkAsUsed(product.id)}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Utilisé
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Tendances d'expiration */}
        <Card>
          <CardHeader>
            <CardTitle>Tendances d'Expiration</CardTitle>
            <CardDescription>
              Évolution des expirations évitées vs perdues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expirationTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="prevented" fill="#22c55e" name="Évitées" />
                <Bar dataKey="expired" fill="#ef4444" name="Perdues" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Expirations évitées</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>Produits perdus</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle>Expirations par Catégorie</CardTitle>
            <CardDescription>
              Catégories les plus à risque d'expiration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryExpirationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryExpirationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} produits`, 'À expirer']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Configuration des notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration des Alertes</CardTitle>
          <CardDescription>
            Personnalisez vos notifications d'expiration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Canaux de notification</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <Button 
                    variant={notificationSettings.email ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNotificationSettings(prev => ({ ...prev, email: !prev.email }))}
                  >
                    {notificationSettings.email ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">Push</span>
                  </div>
                  <Button 
                    variant={notificationSettings.push ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNotificationSettings(prev => ({ ...prev, push: !prev.push }))}
                  >
                    {notificationSettings.push ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Fréquence</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Digest quotidien</span>
                  <Button 
                    variant={notificationSettings.dailyDigest ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNotificationSettings(prev => ({ ...prev, dailyDigest: !prev.dailyDigest }))}
                  >
                    {notificationSettings.dailyDigest ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Critiques seulement</span>
                  <Button 
                    variant={notificationSettings.criticalOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNotificationSettings(prev => ({ ...prev, criticalOnly: !prev.criticalOnly }))}
                  >
                    {notificationSettings.criticalOnly ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}