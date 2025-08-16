# 🚀 DoD (Definition of Done) - Guide Rapide CuisineZen

## Qu'est-ce que c'est ?

Un système simple pour garantir la qualité de votre code avant chaque déploiement.

## ✅ Ce qui est vérifié

### 1. **Tests** 
- ✅ Tests unitaires avec Vitest (couverture 70%+)
- ✅ Tests E2E avec Playwright (navigation, ajout produit, création recette)

### 2. **Qualité du code**
- ✅ Pas d'erreurs TypeScript
- ✅ Pas d'erreurs ESLint
- ✅ Code formaté correctement

### 3. **Performance**
- ✅ Score Lighthouse 80+
- ✅ Bundle size < 500KB

## 🎯 Commandes essentielles

```bash
# Vérifier tout avant de commit
npm run gates:check

# Tests unitaires
npm test                 # Mode watch
npm run test:run         # Une fois
npm run test:coverage    # Avec couverture

# Tests E2E
npm run test:e2e:basic   # Tests essentiels
npm run test:e2e:headed  # Mode visible (debug)

# Qualité du code
npm run lint             # ESLint
npm run typecheck        # TypeScript
npm run format:check     # Formatage

# Build
npm run build            # Construction Next.js
```

## 🔄 Workflow quotidien

### Avant de commiter :
```bash
# 1. Vérifier la qualité
npm run lint
npm run typecheck

# 2. Lancer les tests
npm run test:run

# 3. Si tout est vert, commit !
git add .
git commit -m "feat: ma nouvelle fonctionnalité"
```

### Avant une Pull Request :
```bash
# Vérification complète
npm run gates:check

# Si tout passe ✅, créer la PR
```

## 🤖 CI/CD Automatique

Le workflow GitHub Actions vérifie automatiquement :
- Sur chaque push vers `main`
- Sur chaque Pull Request

Si un check échoue ❌, le déploiement est bloqué.

## 📊 Seuils de qualité

| Métrique | Seuil minimum | Pourquoi |
|----------|---------------|----------|
| Couverture tests | 70% | Assure que le code critique est testé |
| TypeScript | 0 erreur | Type safety |
| ESLint | 0 erreur | Code propre et maintenable |
| Lighthouse | 80/100 | Performance acceptable |
| Bundle size | < 500KB | Chargement rapide |

## 🛠️ Configuration

Le fichier `dod.config.js` contient tous les seuils. Modifiez-les selon vos besoins.

## ❓ Problèmes courants

### "Les tests échouent"
```bash
# Lancer en mode debug
npm run test:e2e:headed
```

### "TypeScript a des erreurs"
```bash
# Voir les erreurs détaillées
npm run typecheck
```

### "ESLint bloque"
```bash
# Auto-fix si possible
npm run lint:fix
```

## 📈 Amélioration continue

Commencez avec ces seuils, puis augmentez-les progressivement :
- Couverture : 70% → 80% → 90%
- Lighthouse : 80 → 85 → 90

---

**💡 Astuce :** Utilisez `npm run gates:check` avant chaque commit important pour éviter les surprises !