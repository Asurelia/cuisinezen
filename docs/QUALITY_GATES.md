# 🔒 Quality Gates Documentation - CuisineZen

Ce document décrit l'implémentation complète des gates de qualité pour CuisineZen, assurant la sécurité, la performance, l'accessibilité et la qualité du code avant toute mise en production.

## Vue d'ensemble

Les quality gates sont organisés en 5 catégories principales :

1. **Performance Gates** 🚀
2. **Accessibilité Gates** ♿
3. **Sécurité Gates** 🔒
4. **Qualité Code Gates** 📋
5. **Monitoring & SBOM** 📊

## 🚀 Performance Gates

### Seuils Lighthouse CI
- **LCP (Largest Contentful Paint)** : < 2.5s
- **TBT (Total Blocking Time)** : < 200ms
- **CLS (Cumulative Layout Shift)** : < 0.1
- **FCP (First Contentful Paint)** : < 1.8s
- **TTI (Time to Interactive)** : < 3.8s
- **Score Performance** : ≥ 90%

### Bundle Size Limits
- **Taille maximale par asset** : 300KB
- **Taille maximale du bundle** : 300KB
- **Optimisations automatiques** :
  - Tree shaking
  - Code splitting
  - Compression Gzip/Brotli
  - Optimisation des images (WebP/AVIF)

### Configuration
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // ...
      },
    },
  },
};
```

## ♿ Accessibilité Gates

### Standards WCAG
- **WCAG 2.1 AA** : Conformité complète
- **Score Lighthouse** : ≥ 95%
- **Violations** : 0 toléré

### Tests automatisés
- **axe-core** avec Playwright
- Tests sur multiple navigateurs (Chrome, Firefox, Safari)
- Tests responsive (desktop et mobile)
- Validation des éléments interactifs (44x44px minimum)

### Vérifications
- Contraste de couleurs
- Navigation clavier
- Textes alternatifs des images
- Labels des formulaires
- Structure des titres (H1-H6)
- Rôles ARIA

## 🔒 Sécurité Gates

### Scan de vulnérabilités
- **NPM Audit** : 0 vulnérabilité critique/high, max 5 moderate
- **Semgrep** : 0 issue de sécurité
- **Gitleaks** : 0 secret détecté

### Règles de sécurité
```yaml
# .semgrep.yml
rules:
  - id: dangerous-react-html
    pattern: dangerouslySetInnerHTML={{__html: $VALUE}}
    message: "Avoid using dangerouslySetInnerHTML as it can lead to XSS attacks"
    severity: ERROR
  
  - id: hardcoded-secrets
    pattern: const $VAR = "$SECRET"
    message: "Potential hardcoded secret detected"
    severity: ERROR
```

### Configuration Gitleaks
- Détection des clés API Firebase
- Scan des tokens JWT
- Vérification des clés privées
- Exclusions pour les fichiers de test

## 📋 Qualité Code Gates

### TypeScript Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### ESLint Configuration Stricte
- **0 warning** toléré en mode strict
- **0 erreur** toléré
- Règles de sécurité activées
- Règles d'accessibilité (jsx-a11y)
- Import/export validation

### Couverture de Tests
- **Lignes** : ≥ 80%
- **Branches** : ≥ 70%
- **Fonctions** : ≥ 80%
- **Statements** : ≥ 80%

### Mutation Testing
- **Score minimum** : 60%
- Configuration Stryker avec Jest
- Exclusion des fichiers de configuration et types

## 📊 Monitoring & SBOM

### Software Bill of Materials
- **Format SPDX** 2.3
- **Format CycloneDX** 1.4
- Informations de licence
- Vulnérabilités des dépendances
- Checksums et signatures

### Rapport de conformité
```json
{
  "compliance": {
    "licenses": {
      "distribution": { "MIT": 45, "Apache-2.0": 12, ... },
      "unknownLicenses": 0
    },
    "security": {
      "riskLevel": "MINIMAL",
      "vulnerabilities": []
    }
  }
}
```

## 🔄 Enforcement Automatique

### GitHub Actions Workflows

#### 1. Quality Gates Enforcement (`.github/workflows/quality-gates.yml`)
- Exécution sur push/PR vers main/develop
- Validation de tous les gates en parallèle
- Échec du build si gates non respectés

#### 2. Security Audit (`.github/workflows/security-audit.yml`)
- Exécution quotidienne (2h UTC)
- Scan complet avec NPM audit, Semgrep, Gitleaks
- CodeQL analysis
- Dependency review sur les PRs

#### 3. Deployment Gate (`.github/workflows/deployment-gate.yml`)
- Validation finale avant production
- Score qualité minimum : 80/100
- Option force deploy pour les urgences
- Monitoring post-déploiement

### Scoring System
```
Score de base : 100 points
- Échec code quality : -30 points
- Échec performance : -25 points  
- Échec accessibilité : -20 points
- Vulnérabilités critiques : -50 points

Déploiement autorisé si score ≥ 80
```

## 📋 Scripts disponibles

```bash
# Linting strict
npm run lint:strict

# Tests avec couverture
npm run test:coverage

# Tests de mutation
npm run test:mutation

# Tests d'accessibilité
npm run test:a11y

# Scan de sécurité
npm run security:scan
npm run security:secrets
npm run security:audit

# Performance
npm run lighthouse
npm run bundle:analyze

# SBOM
npm run sbom:generate

# Vérification globale
npm run gates:all
npm run gates:check
```

## 🚨 Procédure d'urgence

En cas de besoin critique de déployer avec des gates non respectés :

1. **Workflow Dispatch** avec `force_deploy: true`
2. **Justification obligatoire** dans les logs
3. **Correction immédiate** planifiée
4. **Monitoring renforcé** post-déploiement

## 📈 Métriques et Reporting

### Rapports générés
- **Quality Gates Summary** : JSON détaillé de tous les résultats
- **Security Audit Report** : Vulnérabilités et recommandations
- **SBOM Reports** : SPDX et CycloneDX
- **Compliance Report** : Licences et conformité

### Rétention des artifacts
- **Security reports** : 90 jours
- **SBOM** : 90 jours
- **Quality gates** : 90 jours
- **Deployment info** : 180 jours

## 🔧 Configuration Locale

Pour exécuter les gates localement :

```bash
# Installation des dépendances
npm ci

# Vérification complète
npm run gates:check

# Tests spécifiques
npm run test:a11y
npm run security:scan
npm run lighthouse
```

## 📚 Ressources

- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [axe-core](https://github.com/dequelabs/axe-core)
- [Semgrep](https://semgrep.dev/)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
- [SPDX Specification](https://spdx.github.io/spdx-spec/)
- [CycloneDX](https://cyclonedx.org/)

---

**Dernière mise à jour** : 2025-08-15
**Version** : 1.0.0
**Auteur** : DevOps Team CuisineZen