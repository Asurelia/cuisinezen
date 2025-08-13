
'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChefHat, Pencil, Trash2, Clock, BarChart3, CheckCircle2 } from 'lucide-react';
import type { Recipe, Product } from '@/lib/types';
import { Separator } from './ui/separator';
import { useMemo } from 'react';

interface RecipeCardProps {
  recipe: Recipe;
  inventory: Product[];
  onEdit: () => void;
  onDelete: () => void;
}

const difficultyMap = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
};

export function RecipeCard({ recipe, inventory, onEdit, onDelete }: RecipeCardProps) {

  const availableIngredientsCount = useMemo(() => {
    const inventoryProductIds = new Set(inventory.filter(p => p.batches.reduce((sum, b) => sum + b.quantity, 0) > 0).map(p => p.id));
    return recipe.ingredients.filter(ingredient => inventoryProductIds.has(ingredient.productId)).length;
  }, [recipe, inventory]);

  const allIngredientsAvailable = availableIngredientsCount === recipe.ingredients.length;


  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg animate-fade-in">
      <CardHeader className="relative p-0">
        <Image
          src={recipe.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(recipe.name)}`}
          alt={recipe.name}
          width={400}
          height={300}
          className="aspect-[4/3] w-full object-cover"
        />
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
           <CardTitle className="text-xl font-bold text-white">{recipe.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <p className="text-sm text-muted-foreground mb-4 h-10 overflow-hidden">
            {recipe.description}
        </p>
         <Separator className="my-2"/>
         <div className="space-y-2 text-sm text-muted-foreground mt-4">
             <div className="flex items-center">
                <ChefHat className="h-4 w-4 mr-2 text-primary" />
                <span>{recipe.ingredients.length} ingrédient(s)</span>
            </div>
            <div className={`flex items-center ${allIngredientsAvailable ? 'text-green-600' : ''}`}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>{availableIngredientsCount} / {recipe.ingredients.length} ingrédient(s) en stock</span>
            </div>
             {(recipe.preparationTime || recipe.cookingTime) && (
                <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span>
                        {recipe.preparationTime && `Préparation: ${recipe.preparationTime}min`}
                        {recipe.preparationTime && recipe.cookingTime && ' - '}
                        {recipe.cookingTime && `Cuisson: ${recipe.cookingTime}min`}
                    </span>
                </div>
            )}
            {recipe.difficulty && (
                <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                    <span>Difficulté: {difficultyMap[recipe.difficulty]}</span>
                </div>
            )}
         </div>
      </CardContent>
       <CardFooter className="bg-muted/50 p-2 grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:bg-accent/80 hover:text-foreground"
          onClick={onEdit}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Modifier
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
      </CardFooter>
    </Card>
  );
}
