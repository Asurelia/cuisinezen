# Guide de Migration et Déploiement CuisineZen

Ce guide détaille la migration des données localStorage vers Firestore et le déploiement complet de l'application CuisineZen.

## Table des matières

1. [Prérequis](#prérequis)
2. [Migration localStorage → Firestore](#migration-localstorage--firestore)
3. [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
4. [Déploiement Firebase](#déploiement-firebase)
5. [Tests et vérification](#tests-et-vérification)
6. [Troubleshooting](#troubleshooting)

---

## Prérequis

### Outils requis

```bash
# Node.js (version 18+)
node --version

# npm ou yarn
npm --version

# Firebase CLI
npm install -g firebase-tools
firebase --version
```

### Comptes et accès

- [ ] Compte Google/Firebase actif
- [ ] Projet Firebase créé ([console.firebase.google.com](https://console.firebase.google.com))
- [ ] Clé API Google AI (Genkit) configurée
- [ ] Droits d'administration sur le projet Firebase

---

## Migration localStorage → Firestore

### 1. Sauvegarde des données avant migration

⚠️ **IMPORTANT** : Toujours sauvegarder les données avant migration.

#### Script de sauvegarde automatique

Créez un fichier `backup-local-data.html` pour sauvegarder vos données :

```html
<!DOCTYPE html>
<html>
<head>
    <title>Sauvegarde localStorage CuisineZen</title>
</head>
<body>
    <h1>Sauvegarde des données CuisineZen</h1>
    <button onclick="backupData()">Créer une sauvegarde</button>
    <button onclick="loadBackup()">Charger une sauvegarde</button>
    
    <script>
    function backupData() {
        const backup = {
            timestamp: new Date().toISOString(),
            products: JSON.parse(localStorage.getItem('products') || '[]'),
            recipes: JSON.parse(localStorage.getItem('recipes') || '[]'),
            inventory: JSON.parse(localStorage.getItem('inventory') || '[]'),
            'cuisinezen-products': JSON.parse(localStorage.getItem('cuisinezen-products') || '[]'),
            'cuisinezen-recipes': JSON.parse(localStorage.getItem('cuisinezen-recipes') || '[]')
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cuisinezen-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        console.log('Sauvegarde créée:', backup);
    }
    
    function loadBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const backup = JSON.parse(e.target.result);
                
                // Restaurer les données
                Object.keys(backup).forEach(key => {
                    if (key !== 'timestamp') {
                        localStorage.setItem(key, JSON.stringify(backup[key]));
                    }
                });
                
                alert('Sauvegarde restaurée avec succès !');
            };
            reader.readAsText(file);
        };
        input.click();
    }
    </script>
</body>
</html>
```

### 2. Configuration du service de migration

Le service de migration est déjà intégré dans l'application (`src/services/migration.ts`). 

#### Vérification des données à migrer

Ouvrez la console développeur sur votre application et exécutez :

```javascript
// Vérifier les données présentes
console.log('Produits:', localStorage.getItem('products'));
console.log('Recettes:', localStorage.getItem('recipes'));
console.log('Inventaire:', localStorage.getItem('inventory'));

// Statistiques de migration
import { migrationService } from './src/services/migration';
console.log('Stats migration:', migrationService.getMigrationStats());
```

### 3. Processus de migration étape par étape

#### Étape 1 : Initialisation de Firebase

Assurez-vous que votre configuration Firebase est correcte dans `.env.local` :

```bash
# Copier le template
cp .env.local.example .env.local

# Éditer avec vos vraies valeurs Firebase
nano .env.local
```

#### Étape 2 : Lancement de la migration

La migration se lance automatiquement lors de la première connexion utilisateur. Pour forcer une migration :

```javascript
// Dans la console développeur de l'application
import { migrationService } from './src/services/migration';

// Réinitialiser la migration (si nécessaire)
migrationService.resetMigration();

// Lancer la migration manuelle
const restaurantId = 'your-restaurant-id';
const userEmail = 'user@example.com';

migrationService.migrateToFirestore(restaurantId, userEmail, (progress) => {
    console.log(`${progress.step}: ${progress.progress}%`);
    if (progress.errors.length > 0) {
        console.error('Erreurs:', progress.errors);
    }
});
```

#### Étape 3 : Validation des données migrées

```javascript
// Vérifier les données dans Firestore
import { firestoreService } from './src/services/firestore';

// Lister les produits migrés
const products = await firestoreService.getProducts('your-restaurant-id');
console.log('Produits migrés:', products);

// Vérifier l'intégrité des données
products.forEach(product => {
    console.log(`✓ ${product.name}: ${product.batches.length} lots`);
});
```

### 4. Script de migration automatique

Créez un script pour automatiser la migration :

```bash
#!/bin/bash
# scripts/migrate.sh

echo "🚀 Démarrage de la migration CuisineZen"

# Vérifier les prérequis
if [ ! -f ".env.local" ]; then
    echo "❌ Fichier .env.local manquant"
    echo "📋 Copiez .env.local.example vers .env.local et configurez-le"
    exit 1
fi

# Démarrer l'application en mode développement
echo "🔧 Démarrage de l'application..."
npm run dev &
DEV_PID=$!

# Attendre que l'application soit prête
sleep 10

echo "📊 Application prête pour la migration"
echo "🌐 Ouvrez http://localhost:3000 et connectez-vous pour lancer la migration"
echo "⚠️  Surveillez la console pour le progress de la migration"

# Nettoyer à la fin
trap "kill $DEV_PID" EXIT
wait
```

Rendez le script exécutable :

```bash
chmod +x scripts/migrate.sh
./scripts/migrate.sh
```

---

## Configuration des variables d'environnement

### 1. Variables Firebase requises

Copiez et configurez le fichier d'environnement :

```bash
cp .env.local.example .env.local
```

### 2. Configuration complète .env.local

```bash
# ====================================
# CONFIGURATION FIREBASE - OBLIGATOIRE
# ====================================

# Configuration principale Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyExample123456789
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre-projet-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# ====================================
# GOOGLE AI (GENKIT) - OPTIONNEL
# ====================================

# Clé API pour les fonctionnalités IA
GOOGLE_GENAI_API_KEY=AIzaSyExample-GoogleAI-Key123

# ====================================
# ADMINISTRATION - OBLIGATOIRE
# ====================================

# Emails des administrateurs (séparés par des virgules)
NEXT_PUBLIC_ADMIN_EMAILS=admin@votre-domaine.com,autre-admin@votre-domaine.com

# ====================================
# DÉVELOPPEMENT - OPTIONNEL
# ====================================

# Mode debug (true/false)
NEXT_PUBLIC_DEBUG=false

# URL de l'application (pour les redirections)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ====================================
# CONFIGURATION AVANCÉE - OPTIONNEL
# ====================================

# Région Firebase Functions
NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION=europe-west1

# Taille maximale d'upload (en MB)
NEXT_PUBLIC_MAX_UPLOAD_SIZE=5

# Durée de cache des images (en secondes)
NEXT_PUBLIC_IMAGE_CACHE_DURATION=3600
```

### 3. Obtenir les valeurs Firebase

#### Console Firebase :

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionnez votre projet
3. Cliquez sur l'icône ⚙️ > **Paramètres du projet**
4. Descendez jusqu'à "Vos applications"
5. Cliquez sur l'icône `</>` pour ajouter une app web
6. Copiez les valeurs de configuration

#### Exemple de récupération par script :

```bash
# Script pour extraire la config Firebase
# scripts/get-firebase-config.sh

echo "📋 Configuration Firebase pour .env.local"
echo ""
echo "1. Allez sur https://console.firebase.google.com"
echo "2. Sélectionnez votre projet : [VOTRE_PROJET]"
echo "3. Paramètres > Paramètres du projet"
echo "4. Section 'Vos applications' > Config SDK"
echo ""
echo "🔧 Format pour .env.local :"
echo "NEXT_PUBLIC_FIREBASE_API_KEY=votre_apiKey"
echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_authDomain"
echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_projectId"
echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_storageBucket"
echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_messagingSenderId"
echo "NEXT_PUBLIC_FIREBASE_APP_ID=votre_appId"
```

### 4. Validation de la configuration

Créez un script de validation :

```bash
# scripts/validate-env.sh

echo "🔍 Validation de la configuration..."

# Vérifier que le fichier existe
if [ ! -f ".env.local" ]; then
    echo "❌ Fichier .env.local manquant"
    exit 1
fi

# Variables obligatoires
required_vars=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
    "NEXT_PUBLIC_ADMIN_EMAILS"
)

# Vérifier chaque variable
for var in "${required_vars[@]}"; do
    if grep -q "^$var=" .env.local; then
        value=$(grep "^$var=" .env.local | cut -d'=' -f2)
        if [ "$value" = "" ] || [[ "$value" == *"your_"* ]] || [[ "$value" == *"example"* ]]; then
            echo "❌ $var: valeur par défaut détectée"
        else
            echo "✅ $var: configuré"
        fi
    else
        echo "❌ $var: manquant"
    fi
done

echo ""
echo "🔧 Pour corriger les erreurs, éditez .env.local"
```

### 5. Configuration par environnement

#### Développement (.env.local)

```bash
# Développement - localhost
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION=europe-west1
```

#### Production (.env.production)

```bash
# Production
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION=europe-west1
```

---

## Déploiement Firebase

### 1. Installation et configuration Firebase CLI

```bash
# Installation globale de Firebase CLI
npm install -g firebase-tools

# Connexion à votre compte Google
firebase login

# Vérification de la connexion
firebase projects:list
```

### 2. Initialisation du projet Firebase

```bash
# Initialiser Firebase dans le projet
firebase init

# Sélectionnez les services :
# ☑ Firestore
# ☑ Functions
# ☑ Hosting
# ☑ Storage
# ☑ Emulators

# Configuration recommandée :
# - Firestore rules: firestore.rules
# - Functions: functions/
# - Hosting: out/ (pour Next.js export)
# - Storage rules: storage.rules
```

### 3. Configuration des règles Firestore

Créez le fichier `firestore.rules` :

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction pour vérifier l'authentification
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Fonction pour vérifier les permissions admin
    function isAdmin() {
      return isAuthenticated() && 
             request.auth.token.email in ['admin@votre-domaine.com'];
    }
    
    // Fonction pour vérifier l'appartenance au restaurant
    function belongsToRestaurant(restaurantId) {
      return isAuthenticated() && 
             request.auth.uid in get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.members;
    }
    
    // === RÈGLES POUR LES RESTAURANTS ===
    
    match /restaurants/{restaurantId} {
      // Lecture : membres du restaurant
      allow read: if belongsToRestaurant(restaurantId) || isAdmin();
      
      // Écriture : admins seulement
      allow write: if isAdmin();
    }
    
    // === RÈGLES POUR LES PRODUITS ===
    
    match /restaurants/{restaurantId}/products/{productId} {
      // Lecture : membres du restaurant
      allow read: if belongsToRestaurant(restaurantId);
      
      // Écriture : membres du restaurant
      allow write: if belongsToRestaurant(restaurantId);
    }
    
    // === RÈGLES POUR LES RECETTES ===
    
    match /restaurants/{restaurantId}/recipes/{recipeId} {
      // Lecture : membres du restaurant
      allow read: if belongsToRestaurant(restaurantId);
      
      // Écriture : membres du restaurant
      allow write: if belongsToRestaurant(restaurantId);
    }
    
    // === RÈGLES POUR LES MENUS ===
    
    match /restaurants/{restaurantId}/menus/{menuId} {
      // Lecture : membres du restaurant
      allow read: if belongsToRestaurant(restaurantId);
      
      // Écriture : membres du restaurant
      allow write: if belongsToRestaurant(restaurantId);
    }
    
    // === RÈGLES POUR LES ANALYTICS ===
    
    match /restaurants/{restaurantId}/analytics/{document=**} {
      // Lecture : membres du restaurant
      allow read: if belongsToRestaurant(restaurantId);
      
      // Écriture : système seulement (via Functions)
      allow write: if false;
    }
    
    // Interdire tout le reste
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Déploiement des règles Firestore et Storage

```bash
# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer les règles Storage
firebase deploy --only storage

# Vérifier le déploiement
firebase firestore:rules:list
```

### 5. Déploiement des Cloud Functions

```bash
# Aller dans le dossier functions
cd functions

# Installer les dépendances
npm install

# Compiler TypeScript
npm run build

# Déployer les functions
firebase deploy --only functions

# Retourner au dossier racine
cd ..
```

#### Configuration avancée des Functions

Éditez `functions/src/index.ts` pour configurer les régions :

```typescript
import { setGlobalOptions } from 'firebase-functions/v2';

// Configuration globale pour toutes les functions
setGlobalOptions({
  region: 'europe-west1', // Région proche de vos utilisateurs
  maxInstances: 10,       // Limite de coût
  memory: '256MiB'        // Mémoire optimisée
});
```

### 6. Configuration du monitoring et alertes

#### Configurer les alertes de coût

```bash
# Script de configuration des alertes
# scripts/setup-monitoring.sh

echo "📊 Configuration du monitoring Firebase..."

# Budget et alertes via la console GCP
echo "1. Allez sur https://console.cloud.google.com"
echo "2. Sélectionnez votre projet Firebase"
echo "3. Menu > Facturation > Budgets et alertes"
echo "4. Créer un budget avec alerte à 80% et 100%"

echo ""
echo "📈 Monitoring recommandé :"
echo "- Budget mensuel : 10-50€ selon l'usage"
echo "- Alertes : 80% (warning), 100% (critique)"
echo "- Métriques : Opérations Firestore, Storage, Functions"
```

### 7. Configuration du hosting Next.js

```bash
# Build de l'application
npm run build

# Export statique (si nécessaire)
npm run export

# Configuration firebase.json pour le hosting
```

Configurez `firebase.json` :

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 8. Déploiement complet

```bash
# Script de déploiement complet
# scripts/deploy.sh

#!/bin/bash

echo "🚀 Déploiement complet CuisineZen"

# Vérifications préalables
echo "🔍 Vérifications..."

# Vérifier la configuration
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local manquant"
    exit 1
fi

if [ ! -f "firebase.json" ]; then
    echo "❌ firebase.json manquant"
    exit 1
fi

# Tests
echo "🧪 Exécution des tests..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "❌ Erreurs TypeScript"
    exit 1
fi

# Build
echo "🔨 Build de l'application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erreur de build"
    exit 1
fi

# Déploiement par étapes
echo "📤 Déploiement des règles..."
firebase deploy --only firestore:rules,storage

echo "📤 Déploiement des functions..."
firebase deploy --only functions

echo "📤 Déploiement du hosting..."
firebase deploy --only hosting

echo "✅ Déploiement terminé !"
echo "🌐 URL: https://votre-projet.web.app"
```

---

## Tests et vérification

### 1. Checklist des fonctionnalités à tester

#### Tests de connexion et authentification

```bash
# Checklist de tests manuels
echo "📋 Checklist de vérification post-déploiement"

# ✅ Authentification
# - [ ] Connexion Google
# - [ ] Déconnexion
# - [ ] Persistance de session
# - [ ] Redirection après connexion

# ✅ Migration des données
# - [ ] Données localStorage détectées
# - [ ] Migration automatique
# - [ ] Intégrité des produits migrés
# - [ ] Intégrité des recettes migrées
# - [ ] Nettoyage localStorage post-migration

# ✅ Gestion des produits
# - [ ] Ajout produit
# - [ ] Modification produit
# - [ ] Suppression produit
# - [ ] Upload d'images
# - [ ] Scanner code-barres

# ✅ Gestion des recettes
# - [ ] Création recette
# - [ ] Modification recette
# - [ ] Suppression recette
# - [ ] Association ingrédients

# ✅ Analytics
# - [ ] Métriques d'inventaire
# - [ ] Alertes d'expiration
# - [ ] Rapports PDF

# ✅ Performance
# - [ ] Temps de chargement < 3s
# - [ ] Optimisation des images
# - [ ] Cache approprié
```

#### Script de test automatisé

```javascript
// scripts/test-functions.js
// Test des fonctionnalités critiques

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

// Configuration de test (utiliser un projet de test)
const firebaseConfig = {
  // Votre config de test
};

async function runTests() {
  console.log('🧪 Démarrage des tests automatisés...');
  
  try {
    // Initialiser Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Test 1 : Authentification
    console.log('Test 1 : Authentification...');
    await signInWithEmailAndPassword(auth, 'test@example.com', 'password');
    console.log('✅ Authentification réussie');
    
    // Test 2 : Ajout de données
    console.log('Test 2 : Ajout produit...');
    const testProduct = {
      name: 'Produit Test',
      category: 'épicerie',
      batches: [],
      createdAt: new Date(),
      createdBy: auth.currentUser.uid
    };
    
    await addDoc(collection(db, 'restaurants/test/products'), testProduct);
    console.log('✅ Ajout produit réussi');
    
    // Test 3 : Lecture des données
    console.log('Test 3 : Lecture produits...');
    const querySnapshot = await getDocs(collection(db, 'restaurants/test/products'));
    console.log(`✅ ${querySnapshot.size} produits récupérés`);
    
    console.log('🎉 Tous les tests passés !');
    
  } catch (error) {
    console.error('❌ Erreur de test:', error);
    process.exit(1);
  }
}

runTests();
```

### 2. Vérification des permissions

#### Test des règles Firestore

```bash
# Utiliser l'émulateur pour tester les règles
firebase emulators:start --only firestore

# Dans un autre terminal, exécuter les tests
npm install -g @firebase/rules-unit-testing

# Créer des tests de règles
# tests/firestore.rules.test.js
```

Exemple de test de règles :

```javascript
// tests/firestore.rules.test.js
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');

describe('Firestore Rules', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8'),
      },
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  test('Utilisateur authentifié peut lire ses produits', async () => {
    const authenticatedDb = testEnv.authenticatedContext('user123').firestore();
    
    await assertSucceeds(
      authenticatedDb.collection('restaurants/rest123/products').get()
    );
  });
  
  test('Utilisateur non authentifié ne peut pas lire', async () => {
    const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
    
    await assertFails(
      unauthenticatedDb.collection('restaurants/rest123/products').get()
    );
  });
});
```

### 3. Tests de performance

#### Monitoring des temps de réponse

```javascript
// scripts/performance-test.js
// Test de performance des requêtes Firestore

async function testPerformance() {
  console.log('⚡ Tests de performance...');
  
  const tests = [
    {
      name: 'Lecture produits',
      fn: () => firestoreService.getProducts('restaurant-id')
    },
    {
      name: 'Ajout produit',
      fn: () => firestoreService.addProduct(testProduct, 'user@test.com')
    },
    {
      name: 'Upload image',
      fn: () => imageService.uploadImage(testFile, 'product')
    }
  ];
  
  for (const test of tests) {
    const start = performance.now();
    await test.fn();
    const end = performance.now();
    
    const duration = end - start;
    const status = duration < 1000 ? '✅' : duration < 3000 ? '⚠️' : '❌';
    
    console.log(`${status} ${test.name}: ${duration.toFixed(2)}ms`);
  }
}
```

### 4. Monitoring des coûts

#### Configuration des alertes de coût

```bash
# Script de monitoring des coûts
# scripts/cost-monitoring.sh

echo "💰 Configuration du monitoring des coûts..."

echo "📊 Métriques à surveiller :"
echo "- Opérations de lecture Firestore"
echo "- Opérations d'écriture Firestore"
echo "- Bande passante Storage"
echo "- Invocations Functions"
echo "- Temps d'exécution Functions"

echo ""
echo "🔔 Alertes recommandées :"
echo "- Budget mensuel : 20€"
echo "- Alerte à 50% (10€)"
echo "- Alerte à 90% (18€)"
echo "- Blocage à 100%"

echo ""
echo "📈 Optimisations :"
echo "- Utiliser des requêtes avec limite"
echo "- Implémenter la pagination"
echo "- Cache côté client"
echo "- Optimiser les images"
```

#### Dashboard de coûts personnalisé

```javascript
// src/components/cost-dashboard.tsx
// Dashboard pour surveiller les coûts en temps réel

export function CostDashboard() {
  const [costs, setCosts] = useState(null);
  
  useEffect(() => {
    // Récupérer les métriques de coût via Cloud Functions
    fetch('/api/costs')
      .then(res => res.json())
      .then(setCosts);
  }, []);
  
  return (
    <div className="cost-dashboard">
      <h2>Monitoring des coûts</h2>
      {costs && (
        <div className="metrics">
          <div>Firestore: {costs.firestore}€</div>
          <div>Storage: {costs.storage}€</div>
          <div>Functions: {costs.functions}€</div>
          <div>Total: {costs.total}€</div>
        </div>
      )}
    </div>
  );
}
```

---

## Troubleshooting

### 1. Problèmes courants et solutions

#### Erreur de configuration Firebase

```bash
# Problème : Firebase config incorrect
# Symptôme : Erreur "Firebase: Error (auth/invalid-api-key)"

# Solution 1 : Vérifier .env.local
cat .env.local | grep FIREBASE

# Solution 2 : Régénérer la config
echo "Allez sur console.firebase.google.com"
echo "Projet > Paramètres > Config SDK"

# Solution 3 : Vérifier les restrictions d'API
echo "Console Google Cloud > APIs > Credentials"
echo "Vérifier les restrictions de domaine"
```

#### Problèmes de permissions Firestore

```bash
# Problème : Erreur "Missing or insufficient permissions"
# Symptôme : Requêtes Firestore échouent

# Solution 1 : Vérifier les règles
firebase firestore:rules:get

# Solution 2 : Tester avec l'émulateur
firebase emulators:start --only firestore

# Solution 3 : Vérifier l'authentification
# Dans la console développeur :
console.log('User:', auth.currentUser);
console.log('Token:', await auth.currentUser.getIdToken());
```

#### Échec de migration des données

```javascript
// Problème : Migration incomplète ou erreurs
// Solution : Script de diagnostic

function diagnoseMigration() {
  console.log('🔍 Diagnostic de migration...');
  
  // Vérifier les données localStorage
  const keys = Object.keys(localStorage);
  console.log('Clés localStorage:', keys);
  
  keys.forEach(key => {
    if (key.includes('cuisine') || key.includes('product') || key.includes('recipe')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`${key}:`, Array.isArray(data) ? `${data.length} items` : typeof data);
      } catch (e) {
        console.error(`Erreur parsing ${key}:`, e);
      }
    }
  });
  
  // Vérifier le statut de migration
  console.log('Statut migration:', localStorage.getItem('cuisinezen_migration_status'));
  console.log('Version données:', localStorage.getItem('cuisinezen_data_version'));
}

// Exécuter le diagnostic
diagnoseMigration();
```

#### Problèmes d'images et Storage

```bash
# Problème : Upload d'images échoue
# Symptôme : Erreur "Firebase Storage: User does not have permission"

# Solution 1 : Vérifier les règles Storage
cat storage.rules

# Solution 2 : Vérifier la taille des fichiers
# Max autorisé : 5MB dans les règles actuelles

# Solution 3 : Vérifier les types MIME
# Autorisés : image/jpeg, image/jpg, image/png, image/webp
```

### 2. Logs et debugging

#### Configuration des logs détaillés

```javascript
// src/lib/logger.ts
// Système de logging centralisé

export const logger = {
  debug: (message, data = null) => {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log(`🔍 [DEBUG] ${message}`, data);
    }
  },
  
  info: (message, data = null) => {
    console.log(`ℹ️ [INFO] ${message}`, data);
  },
  
  warn: (message, data = null) => {
    console.warn(`⚠️ [WARN] ${message}`, data);
  },
  
  error: (message, error = null) => {
    console.error(`❌ [ERROR] ${message}`, error);
    
    // Envoyer à un service de monitoring en production
    if (process.env.NODE_ENV === 'production') {
      // Sentry, LogRocket, etc.
    }
  }
};
```

#### Monitoring en temps réel

```bash
# Surveiller les logs Firebase Functions
firebase functions:log --follow

# Surveiller les logs par fonction spécifique
firebase functions:log --only "functions:backupData"

# Surveiller avec filtrage
firebase functions:log --filter "ERROR"
```

#### Debug des règles Firestore

```javascript
// Activer le debug des règles Firestore
import { connectFirestoreEmulator, enableNetwork } from 'firebase/firestore';

// En développement seulement
if (process.env.NODE_ENV === 'development') {
  // Connecter à l'émulateur
  connectFirestoreEmulator(db, 'localhost', 8080);
  
  // Activer les logs détaillés
  import { setLogLevel } from 'firebase/firestore';
  setLogLevel('debug');
}
```

### 3. Rollback en cas de problème

#### Procédure de rollback complet

```bash
#!/bin/bash
# scripts/rollback.sh

echo "🔄 Procédure de rollback CuisineZen"

# Étape 1 : Arrêter le trafic
echo "1. 🛑 Arrêt du trafic..."
# Désactiver le hosting si nécessaire
# firebase hosting:disable

# Étape 2 : Restaurer la version précédente
echo "2. ⏪ Restauration version précédente..."
git log --oneline -10
read -p "Entrez le hash du commit à restaurer : " commit_hash

# Créer une branche de rollback
git checkout -b rollback-$(date +%Y%m%d-%H%M%S)
git reset --hard $commit_hash

# Étape 3 : Redéployer
echo "3. 📤 Redéploiement..."
npm run build
firebase deploy --only hosting,functions

# Étape 4 : Vérifier
echo "4. ✅ Vérification..."
curl -I https://votre-projet.web.app

echo "🎉 Rollback terminé"
echo "📋 N'oubliez pas de :"
echo "- Notifier les utilisateurs"
echo "- Analyser la cause du problème"
echo "- Corriger avant le prochain déploiement"
```

#### Restauration des données depuis backup

```javascript
// Script de restauration d'urgence
// scripts/restore-backup.js

async function restoreFromBackup(backupFile) {
  console.log('🔄 Restauration depuis backup...');
  
  try {
    // Charger le fichier de backup
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    // Restaurer dans localStorage (temporaire)
    Object.keys(backup).forEach(key => {
      if (key !== 'timestamp') {
        localStorage.setItem(key, JSON.stringify(backup[key]));
      }
    });
    
    // Relancer la migration vers Firestore
    await migrationService.resetMigration();
    await migrationService.migrateToFirestore(restaurantId, userEmail);
    
    console.log('✅ Restauration terminée');
    
  } catch (error) {
    console.error('❌ Erreur de restauration:', error);
  }
}
```

#### Monitoring post-rollback

```bash
# Script de surveillance post-rollback
# scripts/monitor-rollback.sh

echo "👁️ Surveillance post-rollback..."

# Vérifier les services
echo "🔍 Vérification des services..."
curl -s https://votre-projet.web.app/api/health || echo "❌ API KO"
curl -s https://votre-projet.web.app || echo "❌ Frontend KO"

# Surveiller les logs
echo "📊 Surveillance des logs..."
firebase functions:log --filter "ERROR" &

# Surveiller les métriques
echo "📈 Métriques à surveiller :"
echo "- Temps de réponse"
echo "- Taux d'erreur"
echo "- Nombre d'utilisateurs actifs"
echo "- Utilisation des ressources"

echo "⏰ Surveillance active pendant 30 minutes..."
sleep 1800

echo "✅ Surveillance terminée"
```

---

## Conclusion

Ce guide couvre l'ensemble du processus de migration et déploiement de CuisineZen. Points clés à retenir :

### ✅ Checklist finale de déploiement

- [ ] Sauvegarde des données localStorage effectuée
- [ ] Configuration `.env.local` complète et validée
- [ ] Règles Firestore et Storage déployées et testées
- [ ] Cloud Functions déployées et fonctionnelles
- [ ] Migration des données testée et validée
- [ ] Tests de performance satisfaisants
- [ ] Monitoring et alertes configurés
- [ ] Procédures de rollback testées

### 🚀 Prochaines étapes

1. **Optimisation continue** : Surveiller les performances et coûts
2. **Fonctionnalités avancées** : Implémenter les fonctionnalités IA (Genkit)
3. **Scaling** : Adapter l'infrastructure selon la croissance
4. **Sécurité** : Audit régulier des permissions et règles

### 📞 Support

En cas de problème :
1. Consulter la section [Troubleshooting](#troubleshooting)
2. Vérifier les logs Firebase Functions
3. Utiliser les émulateurs pour les tests
4. Contacter l'équipe de développement avec les logs détaillés

---

*Guide généré pour CuisineZen v1.0 - Dernière mise à jour : 2025-08-15*