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
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';
import { ChefHat, Clock, Star, Users, TrendingUp } from 'lucide-react';

// Données de simulation pour les recettes favorites
const favoriteRecipes = [
  { name: 'Poulet au curry', views: 67, difficulty: 'moyen', time: 45, rating: 4.8 },
  { name: 'Salade César', views: 54, difficulty: 'facile', time: 20, rating: 4.6 },
  { name: 'Ratatouille', views: 41, difficulty: 'moyen', time: 60, rating: 4.7 },
  { name: 'Carbonara', views: 38, difficulty: 'facile', time: 25, rating: 4.5 },
  { name: 'Coq au vin', views: 29, difficulty: 'difficile', time: 120, rating: 4.9 },
  { name: 'Tarte tatin', views: 24, difficulty: 'difficile', time: 90, rating: 4.4 }
];

// Données pour l'évolution des créations de recettes
const recipeCreationData = [
  { week: 'S1', created: 3, viewed: 45, used: 12 },
  { week: 'S2', created: 5, viewed: 62, used: 18 },
  { week: 'S3', created: 2, viewed: 38, used: 8 },
  { week: 'S4', created: 7, viewed: 89, used: 25 },
  { week: 'S5', created: 4, viewed: 71, used: 19 },
  { week: 'S6', created: 6, viewed: 95, used: 32 },
  { week: 'S7', created: 3, viewed: 56, used: 15 }
];

// Données pour l'analyse de la complexité vs popularité
const complexityAnalysis = [
  { difficulty: 'Facile', avgViews: 45, avgTime: 25, count: 24 },
  { difficulty: 'Moyen', avgViews: 38, avgTime: 50, count: 18 },
  { difficulty: 'Difficile', avgViews: 22, avgTime: 95, count: 8 }
];

// Données radar pour les types de cuisines
const cuisineTypeData = [
  { cuisine: 'Française', count: 25, popularity: 4.2, A: 25, fullMark: 30 },
  { cuisine: 'Italienne', count: 18, popularity: 4.5, A: 18, fullMark: 30 },
  { cuisine: 'Asiatique', count: 12, popularity: 4.1, A: 12, fullMark: 30 },
  { cuisine: 'Végétarienne', count: 15, popularity: 3.8, A: 15, fullMark: 30 },
  { cuisine: 'Desserts', count: 10, popularity: 4.6, A: 10, fullMark: 30 },
  { cuisine: 'Entrées', count: 8, popularity: 3.9, A: 8, fullMark: 30 }
];

// Données pour le scatter plot temps vs popularité
const timeVsPopularityData = favoriteRecipes.map(recipe => ({
  name: recipe.name,
  time: recipe.time,
  views: recipe.views,
  difficulty: recipe.difficulty
}));

export function RecipeMetrics() {
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'bg-green-100 text-green-800';
      case 'moyen': return 'bg-yellow-100 text-yellow-800';
      case 'difficile': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyDotColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return '#22c55e';
      case 'moyen': return '#f59e0b';
      case 'difficile': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Métriques des Recettes</h2>
        <Badge variant="outline" className="text-xs">
          <ChefHat className="mr-1 h-3 w-3" />
          {favoriteRecipes.length} recettes trackées
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Recettes favorites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Recettes les Plus Consultées
            </CardTitle>
            <CardDescription>
              Top 6 des recettes les plus visualisées cette semaine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={favoriteRecipes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                  formatter={(value) => [`${value} vues`, 'Popularité']}
                  labelFormatter={(label) => `Recette: ${label}`}
                />
                <Bar dataKey="views" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {favoriteRecipes.slice(0, 3).map((recipe, index) => (
                <div key={recipe.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}></div>
                    <span className="font-medium">{recipe.name}</span>
                    <Badge variant="secondary" className={`text-xs ${getDifficultyColor(recipe.difficulty)}`}>
                      {recipe.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>{recipe.time}min</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{recipe.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Évolution des créations */}
        <Card>
          <CardHeader>
            <CardTitle>Activité Recettes (7 semaines)</CardTitle>
            <CardDescription>
              Évolution des créations, consultations et utilisations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recipeCreationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke="#0088FE" 
                  strokeWidth={3}
                  name="Créées"
                />
                <Line 
                  type="monotone" 
                  dataKey="viewed" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  name="Consultées"
                />
                <Line 
                  type="monotone" 
                  dataKey="used" 
                  stroke="#FFBB28" 
                  strokeWidth={2}
                  name="Utilisées"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Analyse par type de cuisine */}
        <Card>
          <CardHeader>
            <CardTitle>Types de Cuisine</CardTitle>
            <CardDescription>
              Répartition des recettes par type de cuisine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={cuisineTypeData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="cuisine" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis 
                  angle={0} 
                  domain={[0, 30]} 
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Nombre de recettes"
                  dataKey="A"
                  stroke="#0088FE"
                  fill="#0088FE"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip formatter={(value) => [`${value} recettes`, 'Nombre']} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Temps vs Popularité */}
        <Card>
          <CardHeader>
            <CardTitle>Temps de Cuisson vs Popularité</CardTitle>
            <CardDescription>
              Relation entre temps de préparation et nombre de vues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={timeVsPopularityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="time" 
                  name="Temps (min)" 
                  domain={[0, 'dataMax + 10']}
                />
                <YAxis 
                  type="number" 
                  dataKey="views" 
                  name="Vues" 
                  domain={[0, 'dataMax + 5']}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [
                    name === 'time' ? `${value} min` : `${value} vues`,
                    name === 'time' ? 'Temps de cuisson' : 'Nombre de vues'
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `Recette: ${payload[0].payload.name}`;
                    }
                    return '';
                  }}
                />
                <Scatter 
                  dataKey="views" 
                  fill={(entry) => getDifficultyDotColor(entry?.difficulty || 'facile')}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Facile</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Moyen</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Difficile</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse de complexité */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse de Complexité</CardTitle>
          <CardDescription>
            Performance des recettes selon leur niveau de difficulté
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {complexityAnalysis.map((item, index) => (
              <div key={item.difficulty} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{item.difficulty}</h4>
                  <Badge variant="outline">{item.count} recettes</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vues moyennes:</span>
                    <span className="font-medium">{item.avgViews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temps moyen:</span>
                    <span className="font-medium">{item.avgTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Popularité:</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`h-3 w-3 ${item.avgViews > 35 ? 'text-green-500' : item.avgViews > 25 ? 'text-yellow-500' : 'text-red-500'}`} />
                      <span className={`text-xs ${item.avgViews > 35 ? 'text-green-600' : item.avgViews > 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {item.avgViews > 35 ? 'Élevée' : item.avgViews > 25 ? 'Moyenne' : 'Faible'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}