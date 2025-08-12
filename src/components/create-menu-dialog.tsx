
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Recipe } from '@/lib/types';
import type { ExtractMenuOutput } from '@/ai/schemas/menu-extraction';
import { ScrollArea } from './ui/scroll-area';

interface CreateMenuDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recipes: Recipe[];
  onSave: (menu: ExtractMenuOutput & { id: string; name: string }) => void;
}

const weekDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

const dayMenuSchema = z.object({
  day: z.enum(weekDays),
  lunchId: z.string().optional(),
  dinnerId: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(3, 'Le nom du menu est requis.'),
  week: z.array(dayMenuSchema),
});

export function CreateMenuDialog({ isOpen, onOpenChange, recipes, onSave }: CreateMenuDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: `Menu du ${new Date().toLocaleDateString()}`,
      week: weekDays.map(day => ({ day, lunchId: '', dinnerId: '' })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "week"
  });

  const recipeMap = new Map(recipes.map(r => [r.id, r]));

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newMenu: ExtractMenuOutput & { id: string; name: string } = {
      id: new Date().toISOString(),
      name: values.name,
      week: values.week.map(dayMenu => ({
        day: dayMenu.day,
        lunch: dayMenu.lunchId ? { name: recipeMap.get(dayMenu.lunchId)?.name || '' } : undefined,
        dinner: dayMenu.dinnerId ? { name: recipeMap.get(dayMenu.dinnerId)?.name || '' } : undefined,
      })).filter(d => d.lunch || d.dinner), // Only keep days with at least one meal
    };
    onSave(newMenu);
    onOpenChange(false);
    form.reset();
  }
  
  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Créer un nouveau menu</DialogTitle>
          <DialogDescription>
            Planifiez vos repas pour la semaine en choisissant des recettes dans votre livre.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-hidden flex flex-col gap-4">
            <div>
                <Label htmlFor="name">Nom du menu</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
            </div>

            <ScrollArea className="flex-grow border rounded-lg p-1">
                <div className='p-3 space-y-4'>
                    {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-2 rounded-lg border">
                        <h4 className="font-semibold text-primary col-span-12 md:col-span-2">{field.day}</h4>
                        <div className="col-span-12 md:col-span-5">
                             <Label>Midi</Label>
                             <Select
                                onValueChange={(value) => form.setValue(`week.${index}.lunchId`, value)}
                                defaultValue={field.lunchId}
                             >
                                <SelectTrigger>
                                <SelectValue placeholder="Choisir une recette" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Aucun</SelectItem>
                                    {recipes.map(recipe => (
                                        <SelectItem key={recipe.id} value={recipe.id}>{recipe.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="col-span-12 md:col-span-5">
                             <Label>Soir</Label>
                              <Select
                                onValueChange={(value) => form.setValue(`week.${index}.dinnerId`, value)}
                                defaultValue={field.dinnerId}
                              >
                                <SelectTrigger>
                                <SelectValue placeholder="Choisir une recette" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Aucun</SelectItem>
                                    {recipes.map(recipe => (
                                        <SelectItem key={recipe.id} value={recipe.id}>{recipe.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    ))}
                </div>
            </ScrollArea>
        </form>
         <DialogFooter className="mt-auto pt-4 border-t">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Sauvegarder le menu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
