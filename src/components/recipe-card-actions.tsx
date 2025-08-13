
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { RecipeFormDialog } from './recipe-form-dialog';
import type { Recipe, Product } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface RecipeCardActionsProps {
    recipe: Recipe;
    inventory: Product[];
}

export function RecipeCardActions({ recipe, inventory }: RecipeCardActionsProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    
    // In a real app, this would be a server action
    const handleSave = (savedRecipe: Recipe) => {
        console.log('Editing recipe (client-side simulation)', savedRecipe);
        toast({ title: 'Recette modifiée', description: `${savedRecipe.name} a été mise à jour. (Simulation)` });
        setIsEditDialogOpen(false);
        router.refresh();
    };

    // In a real app, this would be a server action
    const handleDelete = () => {
        console.log('Deleting recipe (client-side simulation)', recipe.id);
        toast({ title: 'Recette supprimée', description: `${recipe.name} a été supprimée. (Simulation)` });
        setIsDeleteDialogOpen(false);
        router.refresh();
    };


    return (
        <>
        <CardFooter className="bg-muted/50 p-2 grid grid-cols-2 gap-2">
            <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                onClick={() => setIsEditDialogOpen(true)}
            >
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
            </Button>
        </CardFooter>

        <RecipeFormDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSave={handleSave}
            recipe={recipe}
            inventory={inventory}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette recette ?</AlertDialogTitle>
                <AlertDialogDescription>
                Cette action est irréversible. La recette "{recipe.name}" sera définitivement supprimée.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Confirmer</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
