
'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
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
import { Trash2, PlusCircle, ImagePlus } from 'lucide-react';
import type { Recipe, Product, Ingredient, Difficulty } from '@/lib/types';
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
  imageUrl: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Veuillez ajouter au moins un ingrédient.'),
  preparationTime: z.coerce.number().min(0).optional(),
  cookingTime: z.coerce.number().min(0).optional(),
  difficulty: z.enum(['facile', 'moyen', 'difficile']).optional(),
});

export function RecipeFormDialog({ isOpen, onOpenChange, onSave, recipe, inventory }: RecipeFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      ingredients: [],
      preparationTime: 0,
      cookingTime: 0,
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
        imageUrl: recipe.imageUrl,
        ingredients: recipe.ingredients,
        preparationTime: recipe.preparationTime,
        cookingTime: recipe.cookingTime,
        difficulty: recipe.difficulty,
      });
      if(recipe.imageUrl) {
        setImagePreview(recipe.imageUrl);
      }
    } else {
      form.reset({
        name: '',
        description: '',
        ingredients: [{ productId: '', quantity: 1, unit: 'piece' }],
        preparationTime: 0,
        cookingTime: 0,
        difficulty: 'facile',
      });
    }
  }, [recipe, form, isOpen]);

  useEffect(() => {
      if(!isOpen) {
        setImagePreview(null);
      }
  }, [isOpen])


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        form.setValue('imageUrl', result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const savedRecipe: Recipe = {
        id: recipe?.id || new Date().toISOString(),
        name: values.name,
        description: values.description || '',
        imageUrl: values.imageUrl,
        ingredients: values.ingredients as Ingredient[], // Cast is safe due to zod schema
        preparationTime: values.preparationTime,
        cookingTime: values.cookingTime,
        difficulty: values.difficulty as Difficulty,
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
          <div className="flex gap-4">
             <div className="w-1/3">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                />
                 <button
                    type="button"
                    className="relative w-full aspect-square flex-col rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {imagePreview ? (
                    <Image src={imagePreview} alt="Aperçu de la recette" fill className="object-cover rounded-md" />
                    ) : (
                    <>
                        <ImagePlus className="h-8 w-8 mb-1"/>
                        <span>Photo du plat</span>
                    </>
                    )}
                </button>
             </div>
             <div className="w-2/3 space-y-2">
                <div>
                    <Label htmlFor="name">Nom de la recette</Label>
                    <Input id="name" {...form.register('name')} />
                    {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...form.register('description')} rows={5} />
                </div>
             </div>
          </div>


           <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preparationTime">Temps de préparation (min)</Label>
                <Input id="preparationTime" type="number" {...form.register('preparationTime')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cookingTime">Temps de cuisson (min)</Label>
                <Input id="cookingTime" type="number" {...form.register('cookingTime')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulté</Label>
                 <Controller
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                         <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                           <SelectTrigger>
                             <SelectValue placeholder="Choisir une difficulté" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="facile">Facile</SelectItem>
                             <SelectItem value="moyen">Moyen</SelectItem>
                             <SelectItem value="difficile">Difficile</SelectItem>
                           </SelectContent>
                         </Select>
                      )}
                    />
              </div>
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
                    <Input type="number" step="any" {...form.register(`ingredients.${index}.quantity`)} placeholder="1" />
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
