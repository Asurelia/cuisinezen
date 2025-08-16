# API Documentation - CuisineZen

**Version**: 2.0  
**Date**: 15 août 2025  
**Base URL**: `https://api.cuisinezen.com`  

## Vue d'ensemble

L'API CuisineZen fournit un accès programmatique complet aux fonctionnalités de gestion de restaurant. Cette API RESTful est conçue pour être simple, prévisible et robuste.

## Table des matières

1. [Authentification](#authentification)
2. [Endpoints disponibles](#endpoints-disponibles)
3. [Gestion des erreurs](#gestion-des-erreurs)
4. [Rate limiting](#rate-limiting)
5. [Webhooks](#webhooks)
6. [SDKs et exemples](#sdks-et-exemples)

---

## Authentification

### Firebase Auth Integration

L'API utilise Firebase Auth pour l'authentification. Chaque requête doit inclure un token JWT valide.

```typescript
// Headers requis
{
  "Authorization": "Bearer <firebase-jwt-token>",
  "Content-Type": "application/json",
  "X-Restaurant-ID": "<restaurant-id>" // Requis pour les endpoints multi-tenant
}
```

### Obtenir un token

```javascript
// Frontend (JavaScript)
import { getAuth, getIdToken } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
const token = await getIdToken(user);

// Utilisation dans les requêtes
fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Restaurant-ID': 'restaurant-123'
  }
});
```

### Permissions

L'API respecte le système de permissions granulaires défini dans Firestore :

```typescript
interface UserPermissions {
  canViewProducts: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canViewRecipes: boolean;
  canCreateRecipes: boolean;
  canEditRecipes: boolean;
  canDeleteRecipes: boolean;
  canDeleteOthersRecipes: boolean;
  canCreateMenus: boolean;
  canEditMenus: boolean;
  canDeleteMenus: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  canManageSettings: boolean;
}
```

---

## Endpoints disponibles

### Products API

#### GET /api/products
Récupère la liste des produits du restaurant.

**Paramètres de requête :**
- `category` (string, optionnel) : Filtrer par catégorie
- `search` (string, optionnel) : Recherche textuelle
- `page` (number, optionnel) : Page (défaut: 1)
- `limit` (number, optionnel) : Limite par page (défaut: 25, max: 100)

**Réponse :**
```json
{
  \"data\": [\n    {\n      \"id\": \"prod_123\",\n      \"name\": \"Tomates cerises\",\n      \"category\": \"frais\",\n      \"batches\": [\n        {\n          \"id\": \"batch_456\",\n          \"expirationDate\": \"2025-08-20T00:00:00Z\",\n          \"quantity\": 5,\n          \"unit\": \"kg\",\n          \"supplier\": \"Ferme Bio Local\",\n          \"lotNumber\": \"LOT2025-08-001\"\n        }\n      ],\n      \"createdAt\": \"2025-08-15T10:30:00Z\",\n      \"updatedAt\": \"2025-08-15T10:30:00Z\",\n      \"createdBy\": \"user@restaurant.com\",\n      \"imageUrl\": \"https://storage.googleapis.com/cuisinezen/images/tomates.webp\"\n    }\n  ],\n  \"pagination\": {\n    \"page\": 1,\n    \"limit\": 25,\n    \"total\": 156,\n    \"totalPages\": 7,\n    \"hasNext\": true,\n    \"hasPrev\": false\n  }\n}\n```\n\n#### POST /api/products\nCrée un nouveau produit.\n\n**Permissions requises :** `canCreateProducts`\n\n**Corps de la requête :**\n```json\n{\n  \"name\": \"Carottes bio\",\n  \"category\": \"frais\",\n  \"batches\": [\n    {\n      \"expirationDate\": \"2025-08-25T00:00:00Z\",\n      \"quantity\": 10,\n      \"unit\": \"kg\",\n      \"supplier\": \"Ferme Bio Regional\",\n      \"lotNumber\": \"LOT2025-08-002\"\n    }\n  ],\n  \"imageFile\": \"<base64-encoded-image>\" // Optionnel\n}\n```\n\n**Réponse :**\n```json\n{\n  \"data\": {\n    \"id\": \"prod_789\",\n    \"name\": \"Carottes bio\",\n    \"category\": \"frais\",\n    \"batches\": [...],\n    \"createdAt\": \"2025-08-15T11:00:00Z\",\n    \"createdBy\": \"user@restaurant.com\",\n    \"imageUrl\": \"https://storage.googleapis.com/cuisinezen/images/carottes.webp\"\n  }\n}\n```\n\n#### PUT /api/products/{id}\nMet à jour un produit existant.\n\n**Permissions requises :** `canEditProducts`\n\n#### DELETE /api/products/{id}\nSupprime un produit.\n\n**Permissions requises :** `canDeleteProducts`\n\n### Recipes API\n\n#### GET /api/recipes\nRécupère la liste des recettes.\n\n**Paramètres de requête :**\n- `search` (string, optionnel) : Recherche dans nom et description\n- `createdBy` (string, optionnel) : Filtrer par créateur\n- `page` (number, optionnel) : Page\n- `limit` (number, optionnel) : Limite par page\n\n#### POST /api/recipes\nCrée une nouvelle recette.\n\n**Permissions requises :** `canCreateRecipes`\n\n**Corps de la requête :**\n```json\n{\n  \"name\": \"Salade de tomates cerises\",\n  \"description\": \"Salade fraîche avec tomates cerises et basilic\",\n  \"ingredients\": [\n    {\n      \"productId\": \"prod_123\",\n      \"quantity\": 2,\n      \"unit\": \"kg\"\n    },\n    {\n      \"productId\": \"prod_456\",\n      \"quantity\": 50,\n      \"unit\": \"g\"\n    }\n  ],\n  \"instructions\": [\n    \"Laver les tomates cerises\",\n    \"Couper en deux\",\n    \"Ajouter le basilic ciselé\",\n    \"Assaisonner\"\n  ],\n  \"prepTime\": 15,\n  \"cookTime\": 0,\n  \"servings\": 4,\n  \"imageFile\": \"<base64-encoded-image>\" // Optionnel\n}\n```\n\n### Analytics API\n\n#### GET /api/analytics/inventory\nStatistiques d'inventaire.\n\n**Permissions requises :** `canViewAnalytics`\n\n**Paramètres de requête :**\n- `period` (string) : 'day', 'week', 'month', 'year'\n- `startDate` (ISO date, optionnel)\n- `endDate` (ISO date, optionnel)\n\n**Réponse :**\n```json\n{\n  \"data\": {\n    \"totalProducts\": 156,\n    \"totalValue\": 2450.75,\n    \"expiringProducts\": {\n      \"today\": 3,\n      \"thisWeek\": 12,\n      \"thisMonth\": 28\n    },\n    \"categoryBreakdown\": {\n      \"frais\": { \"count\": 45, \"value\": 890.25 },\n      \"surgelé\": { \"count\": 23, \"value\": 456.80 },\n      \"épicerie\": { \"count\": 78, \"value\": 1025.60 },\n      \"boisson\": { \"count\": 10, \"value\": 78.10 }\n    },\n    \"trends\": {\n      \"productCount\": [156, 148, 162, 159, 156],\n      \"totalValue\": [2450.75, 2234.50, 2678.90, 2589.30, 2450.75],\n      \"dates\": [\"2025-08-11\", \"2025-08-12\", \"2025-08-13\", \"2025-08-14\", \"2025-08-15\"]\n    }\n  }\n}\n```\n\n#### GET /api/analytics/recipes\nStatistiques des recettes.\n\n#### GET /api/analytics/usage\nStatistiques d'utilisation de l'application.\n\n### AI Integration API\n\n#### POST /api/ai/extract-menu\nExtraction de menu depuis une image.\n\n**Corps de la requête :**\n```json\n{\n  \"imageFile\": \"<base64-encoded-image>\",\n  \"options\": {\n    \"language\": \"fr\",\n    \"includeIngredients\": true,\n    \"includePrices\": false\n  }\n}\n```\n\n**Réponse :**\n```json\n{\n  \"data\": {\n    \"extractedItems\": [\n      {\n        \"name\": \"Salade César\",\n        \"description\": \"Salade avec poulet, parmesan et croûtons\",\n        \"ingredients\": [\"salade\", \"poulet\", \"parmesan\", \"croûtons\"],\n        \"confidence\": 0.95\n      }\n    ],\n    \"processingTime\": 1245,\n    \"confidence\": 0.92\n  }\n}\n```\n\n#### POST /api/ai/suggest-category\nSuggestion de catégorie pour un produit.\n\n**Corps de la requête :**\n```json\n{\n  \"productName\": \"Saumon fumé\",\n  \"description\": \"Saumon fumé artisanal\" // Optionnel\n}\n```\n\n---\n\n## Gestion des erreurs\n\n### Format standard des erreurs\n\n```json\n{\n  \"error\": {\n    \"code\": \"VALIDATION_ERROR\",\n    \"message\": \"Les données fournies ne sont pas valides\",\n    \"details\": {\n      \"field\": \"name\",\n      \"issue\": \"Le nom est requis et doit contenir au moins 1 caractère\"\n    },\n    \"timestamp\": \"2025-08-15T12:00:00Z\",\n    \"requestId\": \"req_123456789\"\n  }\n}\n```\n\n### Codes d'erreur courants\n\n| Code HTTP | Code Erreur | Description |\n|-----------|-------------|-------------|\n| 400 | `VALIDATION_ERROR` | Données de requête invalides |\n| 401 | `UNAUTHORIZED` | Token d'authentification manquant ou invalide |\n| 403 | `FORBIDDEN` | Permissions insuffisantes |\n| 404 | `NOT_FOUND` | Ressource introuvable |\n| 409 | `CONFLICT` | Conflit avec l'état actuel |\n| 429 | `RATE_LIMITED` | Trop de requêtes |\n| 500 | `INTERNAL_ERROR` | Erreur serveur interne |\n\n### Exemples d'erreurs\n\n```bash\n# Authentification manquante\nHTTP/1.1 401 Unauthorized\n{\n  \"error\": {\n    \"code\": \"UNAUTHORIZED\",\n    \"message\": \"Token d'authentification requis\"\n  }\n}\n\n# Permissions insuffisantes\nHTTP/1.1 403 Forbidden\n{\n  \"error\": {\n    \"code\": \"FORBIDDEN\",\n    \"message\": \"Permission 'canCreateProducts' requise\"\n  }\n}\n\n# Validation échouée\nHTTP/1.1 400 Bad Request\n{\n  \"error\": {\n    \"code\": \"VALIDATION_ERROR\",\n    \"message\": \"Validation failed\",\n    \"details\": [\n      {\n        \"field\": \"name\",\n        \"message\": \"Le nom est requis\"\n      },\n      {\n        \"field\": \"category\",\n        \"message\": \"Catégorie invalide\"\n      }\n    ]\n  }\n}\n```\n\n---\n\n## Rate Limiting\n\n### Limites par défaut\n\n| Endpoint | Limite | Fenêtre |\n|----------|--------|----------|\n| `/api/products` (GET) | 1000 req | 1 heure |\n| `/api/products` (POST) | 100 req | 1 heure |\n| `/api/recipes` (GET) | 1000 req | 1 heure |\n| `/api/recipes` (POST) | 50 req | 1 heure |\n| `/api/ai/*` | 20 req | 1 heure |\n| `/api/analytics/*` | 500 req | 1 heure |\n\n### Headers de rate limiting\n\n```\nX-RateLimit-Limit: 1000\nX-RateLimit-Remaining: 995\nX-RateLimit-Reset: 1692104400\nX-RateLimit-Window: 3600\n```\n\n### Gestion du rate limiting\n\n```javascript\n// Exemple de gestion côté client\nconst response = await fetch('/api/products');\n\nif (response.status === 429) {\n  const resetTime = response.headers.get('X-RateLimit-Reset');\n  const waitTime = resetTime - Math.floor(Date.now() / 1000);\n  \n  console.log(`Rate limited. Retry after ${waitTime} seconds`);\n  \n  // Attendre et réessayer\n  setTimeout(() => {\n    // Retry request\n  }, waitTime * 1000);\n}\n```\n\n---\n\n## Webhooks\n\n### Configuration\n\nLes webhooks permettent de recevoir des notifications en temps réel des événements CuisineZen.\n\n```javascript\n// Configuration webhook\nPOST /api/webhooks\n{\n  \"url\": \"https://votre-app.com/webhooks/cuisinezen\",\n  \"events\": [\"product.created\", \"product.expired\", \"recipe.created\"],\n  \"secret\": \"votre-secret-webhook\"\n}\n```\n\n### Événements disponibles\n\n| Événement | Description |\n|-----------|-------------|\n| `product.created` | Nouveau produit créé |\n| `product.updated` | Produit modifié |\n| `product.deleted` | Produit supprimé |\n| `product.expired` | Produit expiré |\n| `product.expiring` | Produit expire bientôt |\n| `recipe.created` | Nouvelle recette créée |\n| `recipe.updated` | Recette modifiée |\n| `menu.created` | Nouveau menu créé |\n| `user.added` | Utilisateur ajouté au restaurant |\n\n### Format webhook\n\n```json\n{\n  \"event\": \"product.created\",\n  \"timestamp\": \"2025-08-15T12:00:00Z\",\n  \"restaurantId\": \"restaurant_123\",\n  \"data\": {\n    \"product\": {\n      \"id\": \"prod_789\",\n      \"name\": \"Carottes bio\",\n      \"category\": \"frais\",\n      \"createdBy\": \"user@restaurant.com\"\n    }\n  },\n  \"signature\": \"sha256=abc123...\" // HMAC signature avec votre secret\n}\n```\n\n### Vérification signature\n\n```javascript\nconst crypto = require('crypto');\n\nfunction verifyWebhookSignature(payload, signature, secret) {\n  const expected = crypto\n    .createHmac('sha256', secret)\n    .update(payload)\n    .digest('hex');\n  \n  return `sha256=${expected}` === signature;\n}\n```\n\n---\n\n## SDKs et exemples\n\n### SDK JavaScript/TypeScript\n\n```bash\nnpm install @cuisinezen/sdk\n```\n\n```typescript\nimport { CuisineZenSDK } from '@cuisinezen/sdk';\n\nconst sdk = new CuisineZenSDK({\n  apiKey: 'your-api-key',\n  restaurantId: 'restaurant-123'\n});\n\n// Récupérer les produits\nconst products = await sdk.products.list({\n  category: 'frais',\n  limit: 10\n});\n\n// Créer un produit\nconst newProduct = await sdk.products.create({\n  name: 'Tomates cerises',\n  category: 'frais',\n  batches: [{\n    expirationDate: new Date('2025-08-20'),\n    quantity: 5,\n    unit: 'kg'\n  }]\n});\n\n// Écouter les événements temps réel\nsdk.on('product.created', (product) => {\n  console.log('Nouveau produit:', product);\n});\n```\n\n### Exemples cURL\n\n```bash\n# Lister les produits\ncurl -X GET \"https://api.cuisinezen.com/api/products\" \\\n  -H \"Authorization: Bearer your-firebase-token\" \\\n  -H \"X-Restaurant-ID: restaurant-123\"\n\n# Créer un produit\ncurl -X POST \"https://api.cuisinezen.com/api/products\" \\\n  -H \"Authorization: Bearer your-firebase-token\" \\\n  -H \"X-Restaurant-ID: restaurant-123\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"name\": \"Carottes bio\",\n    \"category\": \"frais\",\n    \"batches\": [{\n      \"expirationDate\": \"2025-08-25T00:00:00Z\",\n      \"quantity\": 10,\n      \"unit\": \"kg\"\n    }]\n  }'\n```\n\n### Exemples Python\n\n```python\nimport requests\nimport json\n\n# Configuration\nBASE_URL = \"https://api.cuisinezen.com\"\nTOKEN = \"your-firebase-token\"\nRESTAURANT_ID = \"restaurant-123\"\n\nheaders = {\n    \"Authorization\": f\"Bearer {TOKEN}\",\n    \"X-Restaurant-ID\": RESTAURANT_ID,\n    \"Content-Type\": \"application/json\"\n}\n\n# Lister les produits\nresponse = requests.get(f\"{BASE_URL}/api/products\", headers=headers)\nproducts = response.json()\n\n# Créer un produit\nproduct_data = {\n    \"name\": \"Saumon fumé\",\n    \"category\": \"frais\",\n    \"batches\": [{\n        \"expirationDate\": \"2025-08-30T00:00:00Z\",\n        \"quantity\": 2,\n        \"unit\": \"kg\"\n    }]\n}\n\nresponse = requests.post(\n    f\"{BASE_URL}/api/products\",\n    headers=headers,\n    json=product_data\n)\n\nif response.status_code == 201:\n    new_product = response.json()\n    print(f\"Produit créé: {new_product['data']['name']}\")\nelse:\n    print(f\"Erreur: {response.status_code} - {response.text}\")\n```\n\n---\n\n## Support et contact\n\n- **Documentation complète** : [https://docs.cuisinezen.com](https://docs.cuisinezen.com)\n- **Support technique** : api-support@cuisinezen.com\n- **Status page** : [https://status.cuisinezen.com](https://status.cuisinezen.com)\n- **GitHub** : [https://github.com/cuisinezen/api](https://github.com/cuisinezen/api)\n\n---\n\n*Documentation API maintenue automatiquement par l'équipe CuisineZen*  \n*Dernière mise à jour : 15 août 2025*