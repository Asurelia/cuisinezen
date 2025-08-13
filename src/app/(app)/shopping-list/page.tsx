
'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Recipe, Product, Ingredient } from '@/lib/types';
import { initialRecipes, initialInventory } from '@/lib/initial-data';
import type { ExtractMenuOutput } from '@/ai/schemas/menu-extraction';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FileDown, ListTodo, ShoppingCart, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { categoryNames } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SuggestedItems } from '@/components/suggested-items';

type ExtractedMenuWithId = ExtractMenuOutput & { id: string; name: string };

interface RequiredIngredient {
  product: Product;
  requiredQuantity: number;
  unit: Ingredient['unit'];
  availableQuantity: number;
  missingQuantity: number;
}

export default function ShoppingListPage() {
  const [recipes] = useLocalStorage<Recipe[]>('recipes', initialRecipes);
  const [inventory] = useLocalStorage<Product[]>('inventory', initialInventory);
  const [extractedMenus] = useLocalStorage<ExtractedMenuWithId[]>('extractedMenus', []);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const shoppingList = useMemo(() => {
    if (extractedMenus.length === 0) {
      return { toBuy: {}, sufficient: [] };
    }

    const requiredIngredients: Record<string, Omit<RequiredIngredient, 'product'>> = {};

    // 1. Aggregate all ingredients from all menus
    extractedMenus.forEach(menu => {
      menu.week.forEach(dayMenu => {
        const processMeal = (meal: { name: string; } | undefined) => {
          if (!meal?.name) return;
          const recipe = recipes.find(r => r.name.toLowerCase() === meal.name.toLowerCase());
          if (recipe) {
            recipe.ingredients.forEach(ingredient => {
              if (requiredIngredients[ingredient.productId]) {
                // Note: This assumes units are compatible. A more robust solution would handle unit conversion.
                requiredIngredients[ingredient.productId].requiredQuantity += ingredient.quantity;
              } else {
                requiredIngredients[ingredient.productId] = {
                  requiredQuantity: ingredient.quantity,
                  unit: ingredient.unit,
                  availableQuantity: 0,
                  missingQuantity: 0,
                };
              }
            });
          }
        };
        processMeal(dayMenu.lunch);
        processMeal(dayMenu.dinner);
      });
    });

    // 2. Check against inventory
    const productMap = new Map(inventory.map(p => [p.id, p]));
    Object.keys(requiredIngredients).forEach(productId => {
      const product = productMap.get(productId);
      if (product) {
        const totalQuantity = product.batches.reduce((sum, batch) => sum + batch.quantity, 0);
        requiredIngredients[productId].availableQuantity = totalQuantity;
      }
    });
    
    // 3. Calculate missing quantities
    const finalShoppingList: RequiredIngredient[] = Object.keys(requiredIngredients).map(productId => {
      const product = productMap.get(productId)!;
      const req = requiredIngredients[productId];
      const missingQuantity = Math.max(0, req.requiredQuantity - req.availableQuantity);
      
      return {
        product,
        ...req,
        missingQuantity,
      };
    }).filter(item => item !== null) as RequiredIngredient[];
    
    const toBuy = finalShoppingList.filter(item => item.missingQuantity > 0);
    const sufficient = finalShoppingList.filter(item => item.missingQuantity <= 0);

    // Group by category
    const grouped = toBuy.reduce((acc, item) => {
        const category = item.product.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, RequiredIngredient[]>);

    return { toBuy: grouped, sufficient };

  }, [recipes, inventory, extractedMenus]);

  const handleToggleItem = (productId: string) => {
    setCheckedItems(prev => ({ ...prev, [productId]: !prev[productId] }));
  };
  
  const allCategories = Object.keys(shoppingList.toBuy);

  const hasNothingToBuy = allCategories.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Liste de Courses</h1>
        <Button variant="outline" disabled>
          <FileDown className="mr-2 h-4 w-4" />
          Exporter la liste
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className='lg:col-span-2'>
            <Card>
                <CardHeader>
                    <CardTitle>Vos Besoins</CardTitle>
                    <CardDescription>
                        Voici la liste des produits à acheter, calculée à partir de vos menus planifiés et de votre inventaire actuel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {extractedMenus.length === 0 ? (
                        <Alert>
                        <ListTodo className="h-4 w-4" />
                        <AlertTitle>Aucun menu planifié</AlertTitle>
                        <AlertDescription>
                            Importez un menu sur la page "Menus" pour commencer à générer votre liste de courses.
                        </AlertDescription>
                        </Alert>
                    ) : hasNothingToBuy ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-full">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground"/>
                        <p className="mt-4 font-semibold text-lg">Tout est en stock !</p>
                        <p className="text-sm text-muted-foreground">Vous avez tous les ingrédients nécessaires pour les recettes de vos menus.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {allCategories.map(category => (
                                <div key={category}>
                                    <h3 className="text-lg font-semibold mb-2 text-primary">{categoryNames[category as keyof typeof categoryNames]}</h3>
                                    <div className="space-y-2 rounded-lg border p-4">
                                        {shoppingList.toBuy[category].map(item => (
                                            <div key={item.product.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox 
                                                        id={item.product.id}
                                                        checked={!!checkedItems[item.product.id]}
                                                        onCheckedChange={() => handleToggleItem(item.product.id)}
                                                    />
                                                    <label htmlFor={item.product.id} className={`text-sm ${checkedItems[item.product.id] ? 'line-through text-muted-foreground' : ''}`}>
                                                        {item.product.name}
                                                    </label>
                                                </div>
                                                <Badge variant={checkedItems[item.product.id] ? "secondary" : "default"}>
                                                {item.missingQuantity} {item.unit}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card className="sticky top-20">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-6 w-6 text-amber-500" />
                        Suggestions
                    </CardTitle>
                    <CardDescription>
                        Quelques articles que vous pourriez avoir besoin d'acheter régulièrement.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <SuggestedItems inventory={inventory} />
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
