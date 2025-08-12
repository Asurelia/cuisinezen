
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
import { ChefHat, Pencil, Trash2 } from 'lucide-react';
import type { Recipe } from '@/lib/types';
import { Separator } from './ui/separator';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="relative p-0">
        <Image
          src={recipe.imageUrl || 'https://placehold.co/400x300.png'}
          alt={recipe.name}
          width={400}
          height={300}
          className="aspect-[4/3] w-full object-cover"
          data-ai-hint={recipe.dataAiHint || "recipe food"}
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
         <div className="flex items-center text-sm text-muted-foreground mt-4">
            <ChefHat className="h-4 w-4 mr-2 text-primary" />
            <span>{recipe.ingredients.length} ingrédient(s)</span>
         </div>
      </CardContent>
       <CardFooter className="bg-muted/50 p-2 grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:bg-accent/80 hover:text-foreground"
          disabled
        >
          <Pencil className="mr-2 h-4 w-4" />
          Modifier
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
      </CardFooter>
    </Card>
  );
}
