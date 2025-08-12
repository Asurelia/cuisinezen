
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
import { Calendar as CalendarIcon, Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Product, Category } from '@/lib/types';
import { categories, categoryNames } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface EditProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEditProduct: (product: Product) => void;
  product: Product | null;
}

const batchSchema = z.object({
    id: z.string(),
    quantity: z.coerce.number().min(0, 'La quantité ne peut être négative.'),
    expiryDate: z.date().nullable(),
});

const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  category: z.enum(categories, { required_error: 'Veuillez sélectionner une catégorie.' }),
  batches: z.array(batchSchema),
});

export function EditProductDialog({ isOpen, onOpenChange, onEditProduct, product }: EditProductDialogProps) {
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "batches"
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        category: product.category,
        batches: product.batches,
      });
    }
  }, [product, form, isOpen]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!product) return;

    const updatedProduct: Product = {
      ...product,
      name: values.name,
      category: values.category,
      batches: values.batches.filter(b => b.quantity > 0), // Remove batches with 0 quantity
    };
    onEditProduct(updatedProduct);
    onOpenChange(false);
  }

  const handleAddNewBatch = () => {
    append({
        id: new Date().toISOString(),
        quantity: 1,
        expiryDate: null
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de "{product?.name}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-hidden flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nom du produit</Label>
                    <Input id="name" {...form.register('name')} />
                    {form.formState.errors.name && (
                    <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Controller
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
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
            </div>
            
            <Separator />

            <div className='flex-grow overflow-hidden flex flex-col gap-2'>
                <Label>Lots du produit</Label>
                 <ScrollArea className="flex-grow border rounded-lg p-1">
                    <div className='p-3 space-y-2'>
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-2 rounded-lg border">
                                 <div className="col-span-5 space-y-1">
                                    <Label>Quantité</Label>
                                    <Input type="number" {...form.register(`batches.${index}.quantity`)} />
                                 </div>
                                 <div className="col-span-6 space-y-1">
                                    <Label>Date de péremption</Label>
                                     <Controller
                                        control={form.control}
                                        name={`batches.${index}.expiryDate`}
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
                                                    {field.value ? format(field.value, "PPP", { locale: fr }) : <span>Aucune date</span>}
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
                                 <div className='col-span-1'>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                 </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
             <Button type="button" variant="outline" size="sm" onClick={handleAddNewBatch}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un nouveau lot
            </Button>
        </form>
        <DialogFooter className="mt-auto pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
            </Button>
            <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Sauvegarder
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
