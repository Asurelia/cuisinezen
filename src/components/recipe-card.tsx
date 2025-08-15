
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ChefHat, Clock, BarChart3 } from 'lucide-react';
import type { Recipe, Product } from '@/lib/types';
import { getBlurPlaceholder } from '@/lib/image-utils';
import { Separator } from './ui/separator';
import { RecipeCardActions } from './recipe-card-actions';

interface RecipeCardProps {
  recipe: Recipe;
  inventory: Product[];
}

const difficultyMap = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
};

export function RecipeCard({ recipe, inventory }: RecipeCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg animate-fade-in">
      <CardHeader className="relative p-0">
        <OptimizedImage
          src={recipe.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(recipe.name)}`}
          alt={recipe.name}
          width={400}
          height={300}
          className="aspect-[4/3] w-full object-cover"
          blurDataURL={getBlurPlaceholder('recipe')}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          fallbackSrc={`https://placehold.co/400x300/fef2f2/ef4444.png?text=${encodeURIComponent(recipe.name)}`}
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
       <RecipeCardActions recipe={recipe} inventory={inventory} />
    </Card>
  );
}
