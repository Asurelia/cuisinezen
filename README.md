Créez une application complète de gestion d'inventaire de cuisine nommée "CuisineZen" en utilisant Next.js avec le App Router, TypeScript, Tailwind CSS, et les composants ShadCN. L'application doit être performante, visuellement soignée et en français.

**Architecture et Principes Clés :**
1.  **Server Components par défaut :** La plupart des pages et des listes (`Inventaire`, `Recettes`, `Menus`, `Liste de courses`) doivent être des Server Components pour une performance optimale. L'interactivité (dialogues, boutons, etc.) sera encapsulée dans de petits Client Components.
2.  **Hooks personnalisés :** Utilisez un hook `useLocalStorage` pour gérer le state côté client (menus, inventaire, recettes) de manière persistante, en veillant à éviter les erreurs d'hydratation.
3.  **IA avec Genkit :** Intégrez Genkit pour deux fonctionnalités :
    *   Suggérer une catégorie de produit à partir du nom.
    *   Extraire les plats d'un menu hebdomadaire depuis une image.
4.  **Style :** Le style sera géré par Tailwind CSS et un thème vert et sobre défini dans `globals.css`. Le design doit être moderne, avec des cartes, des badges et des alertes visuellement cohérentes. La police principale sera "Inter".

**Pages et Fonctionnalités :**

**1. Navigation Principale (Layout `src/app/(app)/layout.tsx`)**
*   Une barre de navigation latérale (Sidebar) avec des icônes et des libellés pour les sections :
    *   Inventaire (icône `Home`)
    *   Menus (icône `UtensilsCrossed`)
    *   Recettes (icône `BookHeart`)
    *   Liste de courses (icône `ShoppingCart`)
*   La sidebar doit être responsive et se transformer en menu "off-canvas" sur mobile.

**2. Page Inventaire (`/inventory`)**
*   **Affichage :**
    *   Les produits sont groupés par catégories (`Frais`, `Surgelé`, `Épicerie`, `Boissons`, `Entretien`) dans des accordéons.
    *   Chaque catégorie affiche une icône distinctive et le nombre de produits.
    *   Les produits sont affichés sous forme de cartes (`ProductCard`).
*   **Carte Produit (`ProductCard`) :**
    *   Affiche une image, le nom, la quantité totale.
    *   Un badge d'alerte s'affiche en haut à droite de l'image si un lot expire dans 7 jours (orange) ou 3 jours (rouge).
    *   Liste les lots avec leur quantité et date de péremption.
    *   Boutons "Modifier" et "Supprimer".
*   **Actions :**
    *   Un bouton "Ajouter un produit" ouvre un dialogue (`AddProductDialog`).
    *   Le dialogue d'ajout permet de scanner un code-barres (UI seulement) et d'uploader une image. L'IA suggère une catégorie en fonction du nom du produit.
    *   Le dialogue de modification (`EditProductDialog`) permet de gérer les lots (ajouter, modifier, supprimer).
    *   La suppression d'un produit affiche un toast avec une option "Annuler".

**3. Page Recettes (`/recipes`)**
*   **Affichage :**
    *   Une grille de cartes de recettes (`RecipeCard`).
    *   La page est paginée (8 recettes par page) et dispose d'une barre de recherche qui filtre les recettes par nom.
*   **Carte Recette (`RecipeCard`) :**
    *   Affiche une image, le nom, une description courte, le nombre d'ingrédients, les temps de préparation/cuisson et la difficulté.
    *   Boutons "Modifier" et "Supprimer".
*   **Actions :**
    *   Un bouton "Ajouter une recette" ouvre un dialogue (`RecipeFormDialog`).
    *   Le dialogue permet de lier des ingrédients à des produits existants dans l'inventaire.

**4. Page Menus (`/menu`)**
*   **Fonctionnalités :**
    *   **Import par IA :** Un bouton permet à l'utilisateur de charger une image d'un menu. L'IA analyse l'image et crée une planification pour la semaine.
    *   **Création Manuelle :** Un bouton "Nouveau Menu" ouvre un dialogue (`CreateMenuDialog`) pour planifier les repas en choisissant parmi les recettes existantes.
*   **Affichage :**
    *   Les menus créés ou importés sont affichés dans une liste en accordéon.
    *   Chaque menu affiche les plats par jour (Midi, Soir).
    *   Si un plat correspond à une recette existante, une icône `BookHeart` apparaît avec un lien vers la recette.

**5. Page Liste de Courses (`/shopping-list`)**
*   **Logique :**
    *   Génère automatiquement une liste d'achats en se basant sur les recettes planifiées dans les menus et l'état actuel de l'inventaire.
    *   Calcule les quantités manquantes pour chaque ingrédient.
*   **Affichage :**
    *   Les produits à acheter sont groupés par catégorie.
    *   Chaque article a une case à cocher et affiche la quantité manquante.
    *   **Suggestions :** Une section distincte suggère des achats récurrents (ex: café, beurre, sel) s'ils sont absents de l'inventaire.

Le projet doit être initialisé avec des données de démonstration (`initial-data.ts`) pour l'inventaire et les recettes afin que l'application soit immédiatement fonctionnelle et peuplée.