
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Recipe } from '@/lib/types';
import { mockRecipes } from '@/lib/mock-data';
import { RecipeCard } from '@/components/recipe-card';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 -mx-4 md:-mx-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Mes Recettes
          </h1>
        </div>
        <div className="ml-auto">
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une recette
          </Button>
        </div>
      </header>
      <main className="flex-1 pt-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </main>
    </div>
  );
}
