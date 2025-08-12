'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Recipe } from '@/lib/types';
import { mockRecipes, mockInventory } from '@/lib/mock-data';
import { RecipeCard } from '@/components/recipe-card';
import { RecipeFormDialog } from '@/components/recipe-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [inventory, setInventory] = useState(mockInventory);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Recipe | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (recipe?: Recipe) => {
    setEditingRecipe(recipe || null);
    setIsDialogOpen(true);
  };

  const handleSaveRecipe = (savedRecipe: Recipe) => {
    if (editingRecipe) {
      setRecipes(recipes.map(r => (r.id === savedRecipe.id ? savedRecipe : r)));
      toast({ title: 'Recette modifiée', description: `${savedRecipe.name} a été mise à jour.` });
    } else {
      setRecipes([savedRecipe, ...recipes]);
      toast({ title: 'Recette ajoutée', description: `${savedRecipe.name} a été créée.` });
    }
    setEditingRecipe(null);
  };

  const handleUndoDelete = () => {
    if (lastDeleted) {
      setRecipes(prev => [lastDeleted, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
      setLastDeleted(null);
    }
  };

  const handleDeleteRecipe = (recipeId: string) => {
    const recipeToDelete = recipes.find(r => r.id === recipeId);
    if (!recipeToDelete) return;

    setLastDeleted(recipeToDelete);
    setRecipes(recipes.filter(r => r.id !== recipeId));

    toast({
      title: 'Recette supprimée',
      description: `${recipeToDelete.name} a été supprimée.`,
      action: <ToastAction altText="Annuler" onClick={handleUndoDelete}>Annuler</ToastAction>,
    });
  };


  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 -mx-4 md:-mx-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Mes Recettes
          </h1>
        </div>
        <div className="ml-auto">
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une recette
          </Button>
        </div>
      </header>
      <main className="flex-1 pt-6">
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map(recipe => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe}
                onEdit={() => handleOpenDialog(recipe)}
                onDelete={() => handleDeleteRecipe(recipe.id)}
              />
            ))}
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-[calc(100vh-12rem)]">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <PlusCircle className="h-12 w-12 text-primary"/>
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">Aucune recette pour l'instant</h3>
              <p className="text-muted-foreground">Commencez par créer votre première recette.</p>
          </div>
        )}
      </main>
       <RecipeFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveRecipe}
        recipe={editingRecipe}
        inventory={inventory}
      />
    </div>
  );
}
