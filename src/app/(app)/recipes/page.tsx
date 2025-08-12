'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Recipe } from '@/lib/types';
import { mockRecipes, mockInventory } from '@/lib/mock-data';
import { RecipeCard } from '@/components/recipe-card';
import { RecipeFormDialog } from '@/components/recipe-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

const RECIPES_PER_PAGE = 25;

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [inventory, setInventory] = useState(mockInventory);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Recipe | null>(null);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  const totalPages = Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE);

  const paginatedRecipes = useMemo(() => {
    const startIndex = (currentPage - 1) * RECIPES_PER_PAGE;
    const endIndex = startIndex + RECIPES_PER_PAGE;
    return filteredRecipes.slice(startIndex, endIndex);
  }, [filteredRecipes, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 -mx-4 md:-mx-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Mes Recettes
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher une recette..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on new search
                }}
              />
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter une recette
            </Button>
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
                  onEdit={() => handleOpenDialog(recipe)}
                  onDelete={() => handleDeleteRecipe(recipe.id)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Page précédente</span>
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button variant="outline" size="icon" onClick={handleNextPage} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                   <span className="sr-only">Page suivante</span>
                </Button>
              </div>
            )}
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
