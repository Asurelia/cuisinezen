# CuisineZen Cloud Functions

Cloud Functions Firebase optimisées pour le restaurant CuisineZen.

## 🚀 Fonctionnalités

### 1. Notifications de Péremption
- **Fonction**: `dailyExpiryNotifications`
- **Horaire**: Chaque jour à 8h00
- **Description**: Vérifie les produits proches de la péremption et envoie des alertes

### 2. Génération de Listes de Courses
- **Fonction**: `generateShoppingList` (manuelle)
- **Fonction**: `weeklyShoppingListGeneration` (automatique dimanche 18h)
- **Description**: Génère des listes de courses basées sur les recettes planifiées

### 3. Backup Automatique
- **Fonction**: `dailyDataBackup` (automatique 2h du matin)
- **Fonction**: `manualBackup` (manuelle)
- **Fonction**: `restoreFromBackup` (restauration)
- **Description**: Sauvegarde et restauration des données

### 4. Rapports PDF
- **Fonction**: `monthlyInventoryPDF` (1er du mois à 6h)
- **Fonction**: `generateCustomInventoryPDF` (manuelle)
- **Description**: Génère des rapports PDF d'inventaire

### 5. Analyse des Coûts
- **Fonction**: `dailyCostCalculation` (quotidien 3h)
- **Fonction**: `calculateSingleRecipeCost` (manuelle)
- **Fonction**: `profitabilityReport` (rapport rentabilité)
- **Description**: Calcule les coûts et marges des recettes

### 6. Intégration POS (Optionnel)
- **Fonction**: `posWebhook` (webhook)
- **Fonction**: `configurePosWebhook` (configuration)
- **Fonction**: `getSalesStatistics` (statistiques)
- **Description**: Intégration avec système de caisse

## 📊 Optimisations de Coûts

### Limites Free Tier Firebase
- **Invocations**: 2M/mois maximum
- **Temps d'exécution**: 400,000 GB-s/mois
- **Trafic sortant**: 5GB/mois

### Stratégies d'Optimisation
1. **Mémoire optimisée**: 256MB par défaut
2. **Timeout court**: 5 minutes maximum
3. **Instances limitées**: Max 3 instances concurrentes
4. **Cache intelligent**: Réutilisation des données
5. **Rate limiting**: Contrôle des appels
6. **Région unique**: europe-west1

## 🛠️ Installation

```bash
cd functions
npm install
```

## 🔧 Configuration

1. **Firebase CLI**:
```bash
npm install -g firebase-tools
firebase login
```

2. **Variables d'environnement**:
```bash
firebase functions:config:set pos.api_key="your-api-key"
firebase functions:config:set notifications.email="admin@restaurant.com"
```

## 🚀 Déploiement

```bash
# Déployer toutes les fonctions
npm run deploy

# Déployer une fonction spécifique
firebase deploy --only functions:dailyExpiryNotifications
```

## 🧪 Tests

```bash
# Émulateur local
npm run serve

# Test d'une fonction
firebase functions:shell
```

## 📋 Maintenance

### Monitoring
- Utiliser `maintenance` function pour statistiques
- Vérifier les logs: `firebase functions:log`
- Health check: `/healthCheck` endpoint

### Nettoyage
- Cache automatique toutes les heures
- Cleanup des backups après 30 jours
- Rate limiting par IP/utilisateur

## 🔒 Sécurité

1. **Authentification**: Toutes les fonctions HTTP callable nécessitent une auth
2. **Rate Limiting**: Protection contre les abus
3. **Validation**: Schémas Zod pour les données entrantes
4. **CORS**: Configuration appropriée pour les webhooks

## 📈 Monitoring des Coûts

### Tableau de Bord Recommandé
1. Invocations par fonction
2. Durée d'exécution moyenne
3. Erreurs et timeout
4. Utilisation mémoire
5. Trafic réseau

### Alertes Suggérées
- Seuil 80% du quota mensuel
- Erreurs > 5% du total
- Timeout > 10% des exécutions

## 🏗️ Architecture

```
functions/
├── src/
│   ├── notifications/     # Alertes péremption
│   ├── shopping/          # Listes de courses
│   ├── backup/            # Sauvegarde/restauration
│   ├── reports/           # Rapports PDF
│   ├── analytics/         # Analyse coûts
│   ├── integrations/      # POS webhook
│   ├── utils/             # Utilitaires partagés
│   └── index.ts           # Point d'entrée
└── package.json
```

## 🔄 Fréquences d'Exécution

| Fonction | Fréquence | Invocations/mois | % Budget |
|----------|-----------|------------------|----------|
| Notifications | Quotidien | 30 | 0.002% |
| Shopping List | Hebdomadaire | 4 | 0.0002% |
| Backup | Quotidien | 30 | 0.002% |
| PDF Rapports | Mensuel | 1 | 0.00005% |
| Coûts | Quotidien | 30 | 0.002% |
| **Total Schedulé** | | **95** | **0.005%** |

Reste **99.995%** du quota pour les appels manuels et webhooks.

## 📞 Support

Pour toute question sur l'implémentation ou les optimisations, consultez la documentation Firebase Functions ou créez une issue.