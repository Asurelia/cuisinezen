'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Loader2, Camera, ScanBarcode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Product, Category } from '@/lib/types';
import { categories, categoryNames } from '@/lib/types';
import { getCategorySuggestion } from '@/lib/actions';

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
}

const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  category: z.enum(categories, { required_error: 'Veuillez sélectionner une catégorie.' }),
  quantity: z.coerce.number().min(1, { message: 'La quantité doit être au moins de 1.' }),
  expiryDate: z.date().optional(),
});

export function AddProductDialog({ isOpen, onOpenChange, onAddProduct }: AddProductDialogProps) {
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
    },
  });
  
  const productName = form.watch('name');

  const debouncedSuggestCategory = useCallback(
    (name: string) => {
      startSuggestionTransition(async () => {
        if (name.length > 2) {
          const suggestion = await getCategorySuggestion(name);
          if (suggestion && !form.formState.dirtyFields.category) {
            form.setValue('category', suggestion, { shouldValidate: true });
          }
        }
      });
    },
    [form]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
        debouncedSuggestCategory(productName);
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [productName, debouncedSuggestCategory]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newProduct: Omit<Product, 'id'> = {
      name: values.name,
      category: values.category,
      batches: [
        {
          id: new Date().toISOString(),
          quantity: values.quantity,
          expiryDate: values.expiryDate || null,
        },
      ],
    };
    onAddProduct(newProduct);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau produit</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour ajouter un article à votre inventaire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <Button type="button" variant="outline" className="col-span-1 h-24 flex-col">
              <Camera className="h-6 w-6 mb-1"/>
              <span>Photo</span>
            </Button>
            <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nom du produit</Label>
                <Input id="name" {...form.register('name')} placeholder="ex: Lait, Tomates..." />
                {form.formState.errors.name && (
                <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <SelectTrigger className="w-full">
                    {isSuggesting ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Suggestion...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryNames[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.category && (
              <p className="text-xs text-red-600">{form.formState.errors.category.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input id="quantity" type="number" {...form.register('quantity')} />
              {form.formState.errors.quantity && (
                <p className="text-xs text-red-600">{form.formState.errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Date de péremption (DLC)</Label>
               <Controller
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={fr}
                        />
                        </PopoverContent>
                    </Popover>
                )}
                />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Ajouter le produit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
