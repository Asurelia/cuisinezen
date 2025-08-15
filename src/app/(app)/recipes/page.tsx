
import { use } from 'react';
import type { Metadata } from 'next';
import { PlusCircle, Search } from 'lucide-react';
import type { Recipe, Product } from '@/lib/types';
import { RecipeCard } from '@/components/recipe-card';
import { getRecipes, getInventory } from '@/lib/data';
import { RecipePagination } from '@/components/recipe-pagination';
import { RecipeSearch } from '@/components/recipe-search';
import { AddRecipeButton } from '@/components/add-recipe-button';
import { RecipesImagePreloader } from '@/components/image-preloader';

export const metadata: Metadata = {
  title: 'Mes Recettes',
};

const RECIPES_PER_PAGE = 8;

export default function RecipesPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const allRecipes = use(getRecipes());
  const inventory = use(getInventory());

  const filteredRecipes = allRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE);

  const paginatedRecipes = filteredRecipes.slice(
    (currentPage - 1) * RECIPES_PER_PAGE,
    currentPage * RECIPES_PER_PAGE
  );

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Préchargement des images critiques */}
      <RecipesImagePreloader recipes={filteredRecipes} />
      
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 -mx-4 md:-mx-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Mes Recettes
        </h1>
        <div className="ml-auto flex items-center gap-4">
          <RecipeSearch placeholder="Rechercher une recette..." />
          <AddRecipeButton inventory={inventory} />
        </div>
      </header>
      <main className="flex-1 pt-6">
        {paginatedRecipes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedRecipes.map(recipe => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                  inventory={inventory}
                />
              ))}
            </div>
            <RecipePagination totalPages={totalPages} />
          </>
        ) : (
           <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-[calc(100vh-12rem)]">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <Search className="h-12 w-12 text-primary"/>
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">Aucune recette trouvée</h3>
              <p className="text-muted-foreground">Essayez d'ajuster votre recherche ou créez une nouvelle recette.</p>
          </div>
        )}
      </main>
    </div>
  );
}
