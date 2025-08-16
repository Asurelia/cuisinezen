# ADR-0001: Choix du stack technologique

**Date**: 2025-08-15  
**Statut**: Accepté  
**Décideurs**: Équipe technique CuisineZen  

## Contexte

CuisineZen nécessite une architecture moderne, scalable et maintenable pour une application de gestion de restaurant. Les besoins principaux sont :

- **Performance** : Application web rapide avec temps de chargement < 2s
- **Scalabilité** : Support de multiples restaurants avec croissance organique
- **Développement** : Productivité élevée et maintenance simplifiée
- **Coûts** : Optimisation des coûts d'infrastructure
- **IA** : Intégration native de fonctionnalités IA
- **Mobile** : Application web progressive (PWA)
- **Offline** : Fonctionnement hors ligne avec synchronisation

## Décision

Nous adoptons le stack technologique suivant :

### Frontend
- **Next.js 15** avec App Router
- **React 18** avec Server Components
- **TypeScript** strict pour la robustesse
- **Tailwind CSS** pour le styling
- **Radix UI** pour les composants base

### Backend
- **Firebase** comme Backend-as-a-Service
  - **Firestore** pour la base de données
  - **Firebase Functions** pour la logique serveur
  - **Firebase Auth** pour l'authentification
  - **Firebase Storage** pour les fichiers
  - **Firebase Hosting** pour le déploiement

### IA
- **Google Genkit** pour l'orchestration IA
- **Gemini** comme modèle principal
- **Zod** pour la validation des schémas IA

### Développement
- **Turbopack** pour le bundling (Next.js)
- **Vitest** + **Playwright** pour les tests
- **ESLint** + **Prettier** pour la qualité code

## Conséquences

### Positives

✅ **Productivité développeur**
- Écosystème intégré Firebase
- TypeScript pour la robustesse
- Hot reload avec Turbopack
- Components réutilisables avec Radix

✅ **Performance**
- Server Components pour le SSR
- CDN Firebase global
- Optimisations automatiques Next.js
- Lazy loading natif

✅ **Scalabilité**
- Architecture serverless Firebase
- Auto-scaling automatique
- Cache distribué intégré

✅ **Coûts**
- Pay-as-you-use Firebase
- Pas de serveurs à maintenir
- Optimisations automatiques

✅ **Sécurité**
- Rules Firestore granulaires
- Authentification robuste
- HTTPS par défaut

### Négatives

❌ **Vendor lock-in Firebase**
- Dépendance forte à Google
- Migration complexe si nécessaire

❌ **Coûts potentiels à grande échelle**
- Pricing Firebase peut devenir élevé
- Nécessite monitoring attentif

❌ **Courbe d'apprentissage**
- App Router Next.js relativement nouveau
- Concepts Firebase spécifiques

❌ **Limitations offline**
- Firestore offline limité
- Nécessite architecture spécifique

## Alternatives considérées

### Option 1: MEAN Stack (MongoDB + Express + Angular + Node.js)
- **Avantages** : Stack mature, contrôle total
- **Inconvénients** : Maintenance infrastructure, complexité setup
- **Rejet** : Overhead opérationnel trop important

### Option 2: JAMstack avec Supabase
- **Avantages** : Open source, PostgreSQL
- **Inconvénients** : Écosystème moins mature, moins d'intégrations
- **Rejet** : Moins d'outils IA intégrés

### Option 3: Full Stack avec AWS
- **Avantages** : Flexibilité maximale, puissance
- **Inconvénients** : Complexité configuration, coûts prévisibilité
- **Rejet** : Complexity vs. team size ratio défavorable

### Option 4: Laravel + Vue.js
- **Avantages** : Framework PHP mature, communauté
- **Inconvénients** : Moins moderne, infrastructure PHP
- **Rejet** : Stack moins adapté aux besoins IA et performance

## Migration et transition

### Phase 1: Setup initial (Semaine 1-2)
- Configuration environnements Firebase
- Setup Next.js avec TypeScript
- Architecture de base

### Phase 2: Core features (Semaine 3-8)
- Authentification
- CRUD produits/recettes
- Interface utilisateur de base

### Phase 3: Advanced features (Semaine 9-16)
- Intégrations IA
- Optimisations performance
- Tests complets

## Métriques de succès

- **Performance** : Lighthouse score > 90
- **Développement** : Time to market features < 2 semaines
- **Qualité** : Test coverage > 85%
- **Coûts** : Infrastructure < 100€/mois pour 10 restaurants

## Références

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Genkit](https://firebase.google.com/docs/genkit)
- [Benchmarks performance JAMstack](https://jamstack.org/generators/)
- [Firestore pricing calculator](https://firebase.google.com/pricing)

---

**Impact**: Architecture complète de l'application  
**Révision prévue**: Dans 6 mois (Février 2026)  
**Responsable**: Tech Lead CuisineZen