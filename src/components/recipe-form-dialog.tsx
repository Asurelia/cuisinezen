
'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle } from 'lucide-react';
import type { Recipe, Product, Ingredient } from '@/lib/types';
import { Separator } from './ui/separator';

interface RecipeFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (recipe: Recipe) => void;
  recipe: Recipe | null;
  inventory: Product[];
}

const ingredientSchema = z.object({
  productId: z.string().min(1, 'Veuillez sélectionner un produit.'),
  quantity: z.coerce.number().min(0.1, 'La quantité doit être positive.'),
  unit: z.enum(['g', 'ml', 'piece'], { required_error: 'Veuillez sélectionner une unité.' }),
});

const formSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Veuillez ajouter au moins un ingrédient.'),
});

export function RecipeFormDialog({ isOpen, onOpenChange, onSave, recipe, inventory }: RecipeFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      ingredients: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });
  
  useEffect(() => {
    if (recipe) {
      form.reset({
        name: recipe.name,
        description: recipe.description,
        ingredients: recipe.ingredients,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        ingredients: [{ productId: '', quantity: 1, unit: 'piece' }],
      });
    }
  }, [recipe, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const savedRecipe: Recipe = {
      id: recipe?.id || new Date().toISOString(),
      ...values,
      ingredients: values.ingredients as Ingredient[], // Cast is safe due to zod schema
    };
    onSave(savedRecipe);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{recipe ? 'Modifier la recette' : 'Ajouter une nouvelle recette'}</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-y-auto pr-6 pl-1 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la recette</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register('description')} />
          </div>

          <Separator />
          
          <div className="space-y-4">
             <h3 className="text-lg font-medium">Ingrédients</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-2 rounded-md border">
                 <div className="col-span-5 space-y-1">
                  {index === 0 && <Label>Produit</Label>}
                   <Controller
                      control={form.control}
                      name={`ingredients.${index}.productId`}
                      render={({ field }) => (
                         <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                           <SelectTrigger>
                             <SelectValue placeholder="Choisir un produit" />
                           </SelectTrigger>
                           <SelectContent>
                             {inventory.map((product) => (
                               <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                      )}
                    />
                     {form.formState.errors.ingredients?.[index]?.productId && <p className="text-xs text-red-600">{form.formState.errors.ingredients?.[index]?.productId?.message}</p>}
                 </div>

                 <div className="col-span-2 space-y-1">
                    {index === 0 && <Label>Qté</Label>}
                    <Input type="number" {...form.register(`ingredients.${index}.quantity`)} placeholder="1" />
                     {form.formState.errors.ingredients?.[index]?.quantity && <p className="text-xs text-red-600">{form.formState.errors.ingredients?.[index]?.quantity?.message}</p>}
                 </div>

                 <div className="col-span-3 space-y-1">
                   {index === 0 && <Label>Unité</Label>}
                   <Controller
                      control={form.control}
                      name={`ingredients.${index}.unit`}
                      render={({ field }) => (
                         <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                           <SelectTrigger>
                             <SelectValue placeholder="Unité" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="g">g</SelectItem>
                             <SelectItem value="ml">ml</SelectItem>
                             <SelectItem value="piece">pièce</SelectItem>
                           </SelectContent>
                         </Select>
                      )}
                    />
                     {form.formState.errors.ingredients?.[index]?.unit && <p className="text-xs text-red-600">{form.formState.errors.ingredients?.[index]?.unit?.message}</p>}
                 </div>
                 
                 <div className="col-span-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
            ))}
             {form.formState.errors.ingredients && typeof form.formState.errors.ingredients === 'object' && !Array.isArray(form.formState.errors.ingredients) && (
                <p className="text-xs text-red-600">{form.formState.errors.ingredients.message}</p>
             )}

            <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, unit: 'piece' })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un ingrédient
            </Button>
          </div>
        </form>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            {recipe ? 'Sauvegarder les changements' : 'Créer la recette'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
