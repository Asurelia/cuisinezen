'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
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
import { Calendar as CalendarIcon, Loader2, ScanBarcode, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Product, Category } from '@/lib/types';
import { categories, categoryNames } from '@/lib/types';
import { getCategorySuggestion } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
    },
  });
  
  const productName = form.watch('name');

  useEffect(() => {
    if (isOpen && isScannerOpen) {
      const getCameraPermission = async () => {
        try {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Accès caméra refusé',
            description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
          });
        }
      };
      getCameraPermission();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if(videoRef.current){
        videoRef.current.srcObject = null;
      }
    }
    
    return () => {
       if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isOpen, isScannerOpen, toast]);

  const closeDialog = () => {
    setIsScannerOpen(false);
    onOpenChange(false);
    form.reset();
  }

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
    closeDialog();
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isScannerOpen ? 'Scanner un code-barres' : 'Ajouter un nouveau produit'}</DialogTitle>
          <DialogDescription>
            {isScannerOpen 
              ? 'Le scan de code-barres n\'est pas encore fonctionnel, mais la caméra est prête !' 
              : 'Remplissez les informations ci-dessous pour ajouter un article à votre inventaire.'}
          </DialogDescription>
        </DialogHeader>

        {isScannerOpen ? (
          <div className="py-4 space-y-4">
              <div className='relative w-full aspect-video bg-black rounded-md overflow-hidden'>
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-full h-1/2 border-y-2 border-dashed border-white/50" />
                </div>
              </div>

              {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <VideoOff className="h-4 w-4" />
                  <AlertTitle>Accès à la caméra requis</AlertTitle>
                  <AlertDescription>
                    Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.
                  </AlertDescription>
                </Alert>
              )}
               <Button type="button" variant="outline" className="w-full" onClick={() => setIsScannerOpen(false)}>
                 Saisir manuellement
               </Button>
          </div>
        ) : (
          <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                 <Button type="button" variant="outline" className="col-span-1 h-24 flex-col" onClick={() => setIsScannerOpen(true)}>
                  <ScanBarcode className="h-6 w-6 mb-1"/>
                  <span>Scanner</span>
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
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Annuler
              </Button>
              <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
                Ajouter le produit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
