
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Recipe, Product } from '@/lib/types';
import { RecipeFormDialog } from '@/components/recipe-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function AddRecipeButton({ inventory }: { inventory: Product[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // This would ideally be a server action
  const handleSaveRecipe = (savedRecipe: Recipe) => {
    // In a real app, you'd call a server action here to save the recipe.
    // For now, we'll just show a toast and refresh the page to show the (mock) new recipe.
    // This is a simplified example.
    console.log('Recipe saved (client-side)', savedRecipe);
    toast({ title: 'Recette sauvegardée', description: "La recette a été ajoutée. (Simulation)" });
    router.refresh(); // Refresh the page to see changes from the server
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Ajouter une recette
      </Button>
      <RecipeFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveRecipe}
        recipe={null}
        inventory={inventory}
      />
    </>
  );
}
