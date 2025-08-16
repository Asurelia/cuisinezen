# Architecture Decision Records (ADR) - CuisineZen

Ce répertoire contient les Architecture Decision Records (ADR) qui documentent les décisions architecturales importantes prises pour le projet CuisineZen.

## Qu'est-ce qu'un ADR ?

Un Architecture Decision Record (ADR) est un document qui capture une décision architecturale importante faite avec son contexte et ses conséquences. Les ADR nous aident à :

- **Comprendre pourquoi** certaines décisions ont été prises
- **Éviter de répéter** les mêmes débats
- **Faciliter l'onboarding** des nouveaux développeurs
- **Maintenir la cohérence** architecturale

## Format des ADR

Chaque ADR suit le template suivant :

```
# ADR-XXXX: Titre de la décision

## Statut
[Proposé | Accepté | Rejeté | Déprécié | Remplacé par ADR-YYYY]

## Contexte
[Description du problème et des contraintes]

## Décision
[Description de la décision prise]

## Conséquences
[Impact positif et négatif de cette décision]

## Alternatives considérées
[Autres options évaluées]

## Références
[Liens vers documentation, discussions, etc.]
```

## Index des ADR

| ADR | Titre | Statut | Date |
|-----|-------|--------|----- |
| [ADR-0001](./ADR-0001-choix-tech-stack.md) | Choix du stack technologique | Accepté | 2025-08-15 |
| [ADR-0002](./ADR-0002-architecture-frontend.md) | Architecture frontend avec Next.js App Router | Accepté | 2025-08-15 |
| [ADR-0003](./ADR-0003-gestion-etat.md) | Stratégie de gestion d'état | Accepté | 2025-08-15 |
| [ADR-0004](./ADR-0004-base-donnees.md) | Choix et structure Firestore | Accepté | 2025-08-15 |
| [ADR-0005](./ADR-0005-authentification.md) | Système d'authentification et permissions | Accepté | 2025-08-15 |
| [ADR-0006](./ADR-0006-tests-qualite.md) | Stratégie de tests et qualité | Accepté | 2025-08-15 |
| [ADR-0007](./ADR-0007-ia-integration.md) | Intégration IA avec Genkit | Accepté | 2025-08-15 |
| [ADR-0008](./ADR-0008-performance.md) | Optimisations performance | Accepté | 2025-08-15 |
| [ADR-0009](./ADR-0009-dod-system.md) | Système Definition of Done | Accepté | 2025-08-15 |
| [ADR-0010](./ADR-0010-offline-mode.md) | Mode hors ligne et synchronisation | Proposé | 2025-08-15 |

## Comment créer un nouvel ADR

1. **Identifier le besoin** : Une décision architecturale importante doit être prise
2. **Créer le fichier** : `ADR-XXXX-titre-decision.md` (numéro séquentiel)
3. **Remplir le template** : Utiliser le format standard
4. **Révision** : Faire réviser par l'équipe technique
5. **Acceptation** : Mettre à jour le statut et l'index

## Processus de révision

1. **Proposition** : Créer un ADR avec statut "Proposé"
2. **Discussion** : Review en équipe technique
3. **Décision** : Vote ou consensus
4. **Documentation** : Mise à jour du statut et commit

## Maintenance des ADR

- Les ADR sont **immutables** une fois acceptés
- Pour modifier une décision, créer un nouvel ADR qui "Remplace" l'ancien
- Marquer l'ancien ADR comme "Remplacé par ADR-YYYY"
- Maintenir l'index à jour

---

*Documentation ADR maintenue par l'équipe technique CuisineZen*