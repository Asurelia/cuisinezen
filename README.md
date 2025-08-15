# CuisineZen 🍽️

Application de gestion intelligente pour restaurant - Inventaire, Recettes, Menus et Analytics avec IA.

## 🚀 Fonctionnalités

### ✨ Gestion d'Inventaire
- **Scanner codes-barres** avec @zxing/library
- **Gestion des lots** avec dates d'expiration
- **Alertes automatiques** de péremption
- **Catégorisation automatique** par IA
- **Photos optimisées** avec Firebase Storage

### 📱 Interface Moderne
- **Design responsive** mobile-first
- **Thème adaptatif** clair/sombre
- **Composants accessibles** Radix UI
- **Performance optimisée** Next.js 15

### 🤖 Intelligence Artificielle
- **Extraction de menus** depuis photos (Google Gemini)
- **Suggestions automatiques** de catégories
- **Recommandations personnalisées**

### 🔥 Firebase Complet
- **Authentification** sécurisée
- **Firestore** synchronisation temps réel
- **Storage** optimisé pour images
- **Analytics** et monitoring
- **Cloud Functions** automatisées

### 📊 Analytics Restaurant
- **Dashboard métiers** temps réel
- **Rapports automatiques** hebdomadaires/mensuels
- **Analyse des coûts** et marges
- **Alertes intelligentes**

## 🛠️ Technologies

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **IA**: Google Genkit avec Gemini 2.0 Flash
- **Charts**: Recharts pour visualisations
- **Forms**: React Hook Form + Zod validation

## ⚡ Installation Rapide

```bash
# Cloner le projet
git clone https://github.com/votre-repo/cuisinezen.git
cd cuisinezen

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos clés Firebase

# Démarrer le développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 📚 Documentation Complète

- [🔧 Guide de Migration](docs/MIGRATION_GUIDE.md)
- [🏗️ Architecture](docs/ARCHITECTURE.md)
- [📖 API Documentation](docs/API_DOCUMENTATION.md)
- [🔒 Sécurité](docs/SECURITY.md)
- [⚡ Performance](docs/PERFORMANCE.md)
- [🔥 Configuration Firebase](docs/FIREBASE_SETUP.md)
- [📊 Audit Complet](docs/AUDIT_COMPLET.md)

## 🚦 Scripts Disponibles

```bash
npm run dev          # Développement avec Turbopack
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # Linting ESLint
npm run typecheck    # Vérification TypeScript
npm run genkit:dev   # Serveur IA développement
npm run genkit:watch # IA en mode watch
```

## 🏗️ Structure du Projet

```
src/
├── app/                 # Pages Next.js App Router
│   ├── (app)/          # Routes principales
│   │   ├── inventory/  # Gestion inventaire
│   │   ├── recipes/    # Gestion recettes
│   │   ├── menu/       # Planification menus
│   │   ├── shopping-list/ # Listes courses
│   │   ├── analytics/  # Dashboard analytics
│   │   └── account/    # Gestion compte
│   ├── (auth)/         # Authentification
│   └── api/            # API routes
├── components/         # Composants React
│   ├── ui/            # Composants UI base
│   └── analytics/     # Composants analytics
├── hooks/             # Hooks personnalisés
├── lib/               # Utilitaires et config
├── services/          # Services Firebase
└── ai/                # Intelligence artificielle
```

## 🔒 Sécurité

- Variables d'environnement pour toutes les clés
- Règles Firebase sécurisées
- Validation côté serveur et client
- Gestion des permissions utilisateurs
- Audit de sécurité complet disponible

## 📈 Performance

- Lazy loading automatique des images
- Optimisation bundles avec Next.js
- Cache Firebase intelligent
- Monitoring temps réel des performances
- Core Web Vitals optimisés

## 🎯 Utilisation

### Démarrage Rapide
1. **Inventaire**: Scanner ou ajouter produits manuellement
2. **Recettes**: Créer avec photos et ingrédients
3. **Analytics**: Consulter le dashboard pour insights
4. **Alertes**: Recevoir notifications d'expiration

### Multi-utilisateurs
- Jusqu'à 5-6 utilisateurs simultanés
- Permissions admin/manager/employee
- Synchronisation temps réel
- Gestion des rôles intégrée

## 💰 Coûts Firebase

Optimisé pour rester dans le **Free Tier**:
- Firestore: 50K lectures/jour, 20K écritures/jour
- Storage: 5GB, 1GB transfert/jour
- Functions: 2M invocations/mois
- Analytics: Illimité

**Estimation**: 0.10-0.50€/mois avec utilisation normale

## 🤝 Contribution

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour:
- Standards de code
- Workflow Git
- Tests et qualité
- Soumission de PR

## 📄 Licence

MIT - Voir [LICENSE](LICENSE)

## 🆘 Support

- Issues: [GitHub Issues](https://github.com/votre-repo/cuisinezen/issues)
- Documentation: [docs/](docs/)
- Audit complet: [AUDIT_COMPLET.md](docs/AUDIT_COMPLET.md)

---

**CuisineZen** - Transformez la gestion de votre restaurant avec l'intelligence artificielle 🚀