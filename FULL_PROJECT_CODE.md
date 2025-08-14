---
path: .env
---

```

```

---
path: README.md
---

```md
git init -b main
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
```

---
path: apphosting.yaml
---

```yaml
# Settings to manage and configure a Firebase App Hosting backend.
# https://firebase.google.com/docs/app-hosting/configure

runConfig:
  # Increase this value if you'd like to automatically spin up
  # more instances in response to increased traffic.
  maxInstances: 1

```

---
path: components.json
---

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

---
path: next.config.ts
---

```ts
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

```

---
path: package.json
---

```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@genkit-ai/googleai": "^1.14.1",
    "@genkit-ai/next": "^1.14.1",
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@zxing/library": "^0.21.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "dotenv": "^16.5.0",
    "firebase": "^11.9.1",
    "genkit": "^1.14.1",
    "lucide-react": "^0.475.0",
    "next": "15.3.3",
    "patch-package": "^8.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "react-zxing": "^2.0.0",
    "recharts": "^2.15.1",
    "server-only": "^0.0.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "use-debounce": "^10.0.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "genkit-cli": "^1.14.1",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

---
path: src/ai/dev.ts
---

```ts
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-food-category.ts';
import '@/ai/flows/extract-menu-from-image.ts';

```

---
path: src/ai/flows/extract-menu-from-image.ts
---

```ts
'use server';

/**
 * @fileOverview Extracts menu information from an image.
 *
 * - extractMenuFromImage - A function that handles the menu extraction process.
 */

import {ai} from '@/ai/genkit';
import {
    ExtractMenuInput,
    ExtractMenuInputSchema,
    ExtractMenuOutput,
    ExtractMenuOutputSchema
} from '@/ai/schemas/menu-extraction';

export async function extractMenuFromImage(input: ExtractMenuInput): Promise<ExtractMenuOutput> {
  return extractMenuFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractMenuPrompt',
  input: {schema: ExtractMenuInputSchema},
  output: {schema: ExtractMenuOutputSchema},
  prompt: `You are an expert at analyzing images of weekly menus and extracting the dishes for each day.
Analyze the provided image and extract the menu for the week.
The menu image may be handwritten or typed. Identify the dishes for lunch (midi) and dinner (soir) for each day from Monday (Lundi) to Sunday (Dimanche).
If a meal is not specified for a given day, you can leave it empty.

Menu Photo: {{media url=photoDataUri}}`,
});

const extractMenuFlow = ai.defineFlow(
  {
    name: 'extractMenuFlow',
    inputSchema: ExtractMenuInputSchema,
    outputSchema: ExtractMenuOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
```

---
path: src/ai/flows/suggest-food-category.ts
---

```ts
'use server';

/**
 * @fileOverview A food category suggestion AI agent.
 *
 * - suggestFoodCategory - A function that suggests a food category based on the food item name.
 * - SuggestFoodCategoryInput - The input type for the suggestFoodCategory function.
 * - SuggestFoodCategoryOutput - The return type for the suggestFoodCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFoodCategoryInputSchema = z.object({
  foodItemName: z
    .string()
    .describe('The name of the food item to categorize.'),
});
export type SuggestFoodCategoryInput = z.infer<typeof SuggestFoodCategoryInputSchema>;

const SuggestFoodCategoryOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The suggested category for the food item (e.g., surgelé, frais, épicerie, boisson, entretien).'
    ),
});
export type SuggestFoodCategoryOutput = z.infer<typeof SuggestFoodCategoryOutputSchema>;

export async function suggestFoodCategory(input: SuggestFoodCategoryInput): Promise<SuggestFoodCategoryOutput> {
  return suggestFoodCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFoodCategoryPrompt',
  input: {schema: SuggestFoodCategoryInputSchema},
  output: {schema: SuggestFoodCategoryOutputSchema},
  prompt: `You are a helpful assistant that suggests the most appropriate food category for a given food item name.

  The possible categories are: surgelé, frais, épicerie, boisson, entretien.

  Food Item Name: {{{foodItemName}}}
  Category:`,
});

const suggestFoodCategoryFlow = ai.defineFlow(
  {
    name: 'suggestFoodCategoryFlow',
    inputSchema: SuggestFoodCategoryInputSchema,
    outputSchema: SuggestFoodCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
```

---
path: src/ai/genkit.ts
---

```ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
```

---
path: src/ai/schemas/menu-extraction.ts
---

```ts
import {z} from 'genkit';

const MealSchema = z.object({
  name: z.string().describe("The name of the dish."),
  description: z.string().optional().describe("A brief description of the dish."),
});

const DayMenuSchema = z.object({
  day: z.string().describe("The day of the week (e.g., Lundi, Mardi)."),
  lunch: MealSchema.optional().describe("The dish for lunch."),
  dinner: MealSchema.optional().describe("The dish for dinner."),
});

export const ExtractMenuInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a menu, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractMenuInput = z.infer<typeof ExtractMenuInputSchema>;

export const ExtractMenuOutputSchema = z.object({
  week: z.array(DayMenuSchema).describe("The menu for the entire week."),
});
export type ExtractMenuOutput = z.infer<typeof ExtractMenuOutputSchema>;
```

---
path: src/app/(app)/inventory/page.tsx
---

```tsx
'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddProductDialog } from '@/components/add-product-dialog';
import { EditProductDialog } from '@/components/edit-product-dialog';
import { InventoryList } from '@/components/inventory-list';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { initialInventory } from '@/lib/initial-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function InventoryPage() {
  const [inventory, setInventory] = useLocalStorage<Product[]>('inventory', initialInventory);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const { toast, dismiss } = useToast();

  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const productWithId: Product = {
      ...newProduct,
      id: new Date().toISOString(),
    };
    setInventory(prev => [productWithId, ...prev]);
    toast({
      title: 'Produit ajouté',
      description: `${productWithId.name} a été ajouté à votre inventaire.`,
    });
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setInventory(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    toast({
      title: 'Produit modifié',
      description: `${updatedProduct.name} a été mis à jour.`,
    });
    setProductToEdit(null);
  };

  const openEditDialog = (product: Product) => {
    setProductToEdit(product);
    setIsEditDialogOpen(true);
  };


  const handleUndoDelete = (product: Product, index: number) => {
    const newInventory = [...inventory];
    newInventory.splice(index, 0, product);
    setInventory(newInventory);
    dismiss();
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) return;

    const productIndex = inventory.findIndex(p => p.id === productToDelete.id);
    if (productIndex === -1) return;

    const newInventory = inventory.filter(p => p.id !== productToDelete.id);
    setInventory(newInventory);

    toast({
      title: 'Produit supprimé',
      description: `${productToDelete.name} a été retiré.`,
      action: <ToastAction altText="Annuler" onClick={() => handleUndoDelete(productToDelete, productIndex)}>Annuler</ToastAction>,
    });

    setProductToDelete(null); // Close the dialog
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 -mx-4 md:-mx-6">
        <div className="flex items-center gap-2">
         
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Inventaire
          </h1>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
        </div>
      </header>
      <main className="flex-1 pt-6">
        <InventoryList
          inventory={inventory}
          onEditProduct={openEditDialog}
          onDeleteProduct={(product) => setProductToDelete(product)}
        />
      </main>
      <AddProductDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddProduct={handleAddProduct}
      />
       <EditProductDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onEditProduct={handleEditProduct}
        product={productToEdit}
      />
       <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit "{productToDelete?.name}" sera définitivement supprimé de votre inventaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProduct}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

---
path: src/app/(app)/layout.tsx
---

```tsx
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, UtensilsCrossed, BookHeart, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <div className="p-4 flex items-center gap-2">
          <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
          >
              <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8c0 2.3.9 4.4 2.5 5.9.3.3.5.7.5 1.1v2c0 .6.4 1 1 1h8c.6 0 1-.4 1-1v-2c0-.4.2-.8.5-1.1C19.1 14.4 20 12.3 20 10z" />
              <path d="M12 2v2" />
              <path d="M12 19v3" />
              <path d="M4 12H2" />
              <path d="M6.3 6.3l-1.4-1.4" />
          </svg>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
              CuisineZen
          </h1>
        </div>
        <SidebarMenu className="flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Inventaire">
              <Link href="/inventory">
                <Home />
                <span>Inventaire</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Menus">
              <Link href="/menu">
                <UtensilsCrossed />
                <span>Menus</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Recettes">
              <Link href="/recipes">
                <BookHeart />
                <span>Recettes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Liste de courses">
              <Link href="/shopping-list">
                <ShoppingCart />
                <span>Liste de courses</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---
path: src/app/(app)/menu/page.tsx
---

```tsx
'use client';

import { useState, useRef, useTransition, ChangeEvent, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileText, Files, FileImage, UtensilsCrossed, BookOpen, Loader2, Info, BookHeart, ExternalLink, Trash2 } from "lucide-react";
import { handleExtractMenu } from '@/lib/actions';
import type { ExtractMenuOutput } from '@/ai/schemas/menu-extraction';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Recipe } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { initialRecipes } from '@/lib/initial-data';
import { CreateMenuDialog } from '@/components/create-menu-dialog';


type ExtractedMenuWithId = ExtractMenuOutput & { id: string; name: string };

export default function MenuPage() {
  const [isExtracting, startExtractionTransition] = useTransition();
  const [extractedMenus, setExtractedMenus] = useLocalStorage<ExtractedMenuWithId[]>('extractedMenus', []);
  const [recipes] = useLocalStorage<Recipe[]>('recipes', initialRecipes);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const findRecipeForDish = (dishName: string): Recipe | undefined => {
    if (!dishName) return undefined;
    return recipes.find(recipe => recipe.name.toLowerCase() === dishName.toLowerCase());
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
            variant: 'destructive',
            title: 'Fichier non valide',
            description: 'Veuillez sélectionner un fichier image.',
        });
        return;
    }

    startExtractionTransition(async () => {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64Image = reader.result as string;
          const result = await handleExtractMenu(base64Image);
          if (result && result.week.length > 0) {
            const newMenu: ExtractedMenuWithId = {
              ...result,
              id: new Date().toISOString(),
              name: `Menu importé le ${new Date().toLocaleDateString()}`,
            };
            setExtractedMenus(prev => [newMenu, ...prev]);
             toast({
              title: 'Extraction réussie !',
              description: 'Le nouveau menu a été ajouté à la liste.',
            });
          } else {
             toast({
              variant: 'destructive',
              title: 'Extraction échouée',
              description: "L'IA n'a pas pu extraire de menu de cette image. Essayez-en une autre.",
            });
          }
        };
      } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Une erreur est survenue',
            description: "Impossible de traiter l'image. Veuillez réessayer.",
        });
      }
    });

     // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDeleteMenu = (menuId: string) => {
    setExtractedMenus(menus => menus.filter(m => m.id !== menuId));
    toast({
      title: 'Menu supprimé',
      description: 'Le menu sélectionné a été retiré de la liste.',
    });
  };

  const handleSaveMenu = (newMenu: ExtractedMenuWithId) => {
    setExtractedMenus(prev => [newMenu, ...prev]);
    toast({
      title: 'Menu sauvegardé !',
      description: `${newMenu.name} a été ajouté à votre planification.`
    });
  };

  const weekDaysOrder = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  const renderDish = (meal: {name: string} | undefined, mealType: string) => {
    if (!meal?.name) return null;

    const recipe = findRecipeForDish(meal.name);
    return (
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-2">
            {recipe ? <BookHeart className="h-4 w-4 text-green-600" /> : <Info className="h-4 w-4 text-amber-600" />}
            <div>
                <span className="font-medium">{mealType} :</span> {meal.name}
            </div>
        </div>
        {recipe && (
             <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/recipes?recipeId=${recipe.id}`}>
                    Voir
                    <ExternalLink className="h-3 w-3 ml-1.5"/>
                </Link>
            </Button>
        )}
      </div>
    );
  }


  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Planification des Menus</h1>
          <Button onClick={() => setIsCreateMenuOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouveau Menu
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Menu de la semaine</CardTitle>
            <CardDescription>
              Importez vos menus en image ou planifiez-les manuellement. Chaque menu importé sera ajouté à la liste ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-medium">Importer un menu</h3>
              <div className="flex flex-col gap-4">
                 <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  disabled={isExtracting}
                />
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                >
                  {isExtracting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileImage className="mr-2 h-4 w-4" />
                  )}
                  <span>
                    {isExtracting ? 'Analyse en cours...' : 'Importer une image'}
                  </span>
                </Button>

                <Button variant="outline" className="justify-start" disabled>
                  <Files className="mr-2 h-4 w-4" />
                  Importer un fichier CSV
                </Button>
                 <Button variant="outline" className="justify-start" disabled>
                  <FileText className="mr-2 h-4 w-4" />
                  Importer un PDF ou autre
                </Button>
              </div>
            </div>
            <div className="space-y-4">
               <h3 className="font-medium">Menus importés & planifiés</h3>
                {isExtracting && (
                   <div className="flex items-center space-x-2 text-sm text-muted-foreground p-4 border rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin"/>
                      <span>L'IA analyse votre image, veuillez patienter...</span>
                   </div>
                )}
                
                {extractedMenus.length === 0 && !isExtracting ? (
                   <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-full">
                      <UtensilsCrossed className="h-12 w-12 text-muted-foreground"/>
                      <p className="mt-4 text-sm text-muted-foreground">Créez ou importez un menu pour le voir ici.</p>
                   </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {extractedMenus.map((menu, index) => {
                      const sortedWeek = menu.week.sort((a, b) => weekDaysOrder.indexOf(a.day) - weekDaysOrder.indexOf(b.day));
                      return (
                         <AccordionItem key={menu.id} value={menu.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <AccordionTrigger className="px-4 py-3 text-base font-medium hover:no-underline">
                              <div className='flex justify-between items-center w-full'>
                                  <span>{menu.name}</span>
                                  <Button variant="ghost" size="icon" className="mr-2 h-7 w-7 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteMenu(menu.id)}}>
                                      <Trash2 className="h-4 w-4"/>
                                  </Button>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                 <div className="p-4 space-y-4">
                                  {sortedWeek && sortedWeek.length > 0 ? (
                                      sortedWeek.map(dayMenu => (
                                          <div key={dayMenu.day}>
                                              <h4 className="font-semibold text-primary">{dayMenu.day}</h4>
                                              <div className="pl-4 mt-1 space-y-1 text-sm">
                                                {renderDish(dayMenu.lunch, 'Midi')}
                                                {renderDish(dayMenu.dinner, 'Soir')}
                                                {!dayMenu.lunch && !dayMenu.dinner && (
                                                      <p className="text-muted-foreground italic">Aucun plat pour ce jour.</p>
                                                  )}
                                              </div>
                                          </div>
                                      ))
                                  ) : (
                                      <Alert variant="default" className="bg-background">
                                          <Info className="h-4 w-4" />
                                          <AlertTitle>Menu vide</AlertTitle>
                                          <AlertDescription>
                                              Aucun plat n'a été planifié pour cette semaine.
                                          </AlertDescription>
                                      </Alert>
                                  )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                      )
                    })}
                  </Accordion>
                )}
            </div>
          </CardContent>
           <CardFooter>
              <p className="text-xs text-muted-foreground">
                  L'icône <BookHeart className="inline-block h-3 w-3 text-green-600" /> indique une recette existante. Passez la souris pour voir le lien.
              </p>
          </CardFooter>
        </Card>
      </div>
      <CreateMenuDialog
        isOpen={isCreateMenuOpen}
        onOpenChange={setIsCreateMenuOpen}
        recipes={recipes}
        onSave={handleSaveMenu}
      />
    </>
  );
}
```

---
path: src/app/(app)/recipes/page.tsx
---

```tsx
import { use } from 'react';
import type { Metadata } from 'next';
import { PlusCircle, Search } from 'lucide-react';
import type { Recipe, Product } from '@/lib/types';
import { RecipeCard } from '@/components/recipe-card';
import { getRecipes, getInventory } from '@/lib/data';
import { RecipePagination } from '@/components/recipe-pagination';
import { RecipeSearch } from '@/components/recipe-search';
import { AddRecipeButton } from '@/components/add-recipe-button';

export const metadata: Metadata = {
  title: 'Mes Recettes',
};

const RECIPES_PER_PAGE = 8;

export default function RecipesPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const allRecipes = use(getRecipes());
  const inventory = use(getInventory());

  const filteredRecipes = allRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE);

  const paginatedRecipes = filteredRecipes.slice(
    (currentPage - 1) * RECIPES_PER_PAGE,
    currentPage * RECIPES_PER_PAGE
  );

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 -mx-4 md:-mx-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Mes Recettes
        </h1>
        <div className="ml-auto flex items-center gap-4">
          <RecipeSearch placeholder="Rechercher une recette..." />
          <AddRecipeButton inventory={inventory} />
        </div>
      </header>
      <main className="flex-1 pt-6">
        {paginatedRecipes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedRecipes.map(recipe => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                  inventory={inventory}
                />
              ))}
            </div>
            <RecipePagination totalPages={totalPages} />
          </>
        ) : (
           <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-[calc(100vh-12rem)]">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <Search className="h-12 w-12 text-primary"/>
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">Aucune recette trouvée</h3>
              <p className="text-muted-foreground">Essayez d'ajuster votre recherche ou créez une nouvelle recette.</p>
          </div>
        )}
      </main>
    </div>
  );
}
```

---
path: src/app/(app)/shopping-list/page.tsx
---

```tsx
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
```

---
path: src/app/globals.css
---

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer base {
  :root {
    --background: 125 43% 94%;
    --foreground: 224 71% 4%;
    --card: 0 0% 100%;
    --card-foreground: 224 71% 4%;
    --popover: 0 0% 100%;
    --popover-foreground: 224 71% 4%;
    --primary: 122 48% 38%;
    --primary-foreground: 0 0% 98%;
    --secondary: 125 30% 90%;
    --secondary-foreground: 122 48% 28%;
    --muted: 125 30% 90%;
    --muted-foreground: 224 71% 25%;
    --accent: 36 100% 50%;
    --accent-foreground: 24 9.8% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 125 20% 85%;
    --input: 125 20% 85%;
    --ring: 36 100% 50%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
  .dark {
    --background: 224 71% 4%;
    --foreground: 0 0% 98%;
    --card: 224 71% 4%;
    --card-foreground: 0 0% 98%;
    --popover: 224 71% 4%;
    --popover-foreground: 0 0% 98%;
    --primary: 122 48% 48%;
    --primary-foreground: 0 0% 98%;
    --secondary: 224 71% 10%;
    --secondary-foreground: 0 0% 98%;
    --muted: 224 71% 10%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 36 100% 60%;
    --accent-foreground: 24 9.8% 10%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 224 71% 10%;
    --input: 224 71% 10%;
    --ring: 36 100% 60%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---
path: src/app/layout.tsx
---

```tsx
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'CuisineZen',
  description: 'Gérez vos stocks de cuisine avec simplicité.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

---
path: src/app/page.tsx
---

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/inventory');
}
```

---
path: src/components/add-product-dialog.tsx
---

```tsx
'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Calendar as CalendarIcon, Loader2, ImagePlus, Barcode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Product, Category } from '@/lib/types';
import { categories, categoryNames } from '@/lib/types';
import { getCategorySuggestion } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { BarcodeScannerDialog } from './barcode-scanner-dialog';

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
  imageUrl: z.string().optional(),
});

export function AddProductDialog({ isOpen, onOpenChange, onAddProduct }: AddProductDialogProps) {
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
    },
  });
  
  const productName = form.watch('name');

  const closeDialog = () => {
    onOpenChange(false);
    form.reset();
    setImagePreview(null);
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


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const newProduct: Omit<Product, 'id'> = {
      name: values.name,
      category: values.category,
      imageUrl: values.imageUrl,
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

  const handleBarcodeScanned = (result: string) => {
    toast({
        title: "Code-barres scanné !",
        description: `Code détecté : ${result}. La recherche de produit n'est pas encore implémentée.`
    })
    setIsScannerOpen(false);
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau produit</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour ajouter un article à votre inventaire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        type="button"
                        className="relative w-full h-24 flex-col rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imagePreview ? (
                        <Image src={imagePreview} alt="Aperçu du produit" fill className="object-cover rounded-md" />
                        ) : (
                        <>
                            <ImagePlus className="h-6 w-6 mb-1"/>
                            <span>Photo</span>
                        </>
                        )}
                    </button>
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nom du produit</Label>
                    <div className="flex gap-2">
                        <Input id="name" {...form.register('name')} placeholder="ex: Lait, Tomates..." className="flex-grow" />
                        <Button type="button" variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}>
                            <Barcode className="h-4 w-4" />
                        </Button>
                    </div>
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
      </DialogContent>
    </Dialog>
    <BarcodeScannerDialog 
        isOpen={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleBarcodeScanned}
    />
    </>
  );
}
```

---
path: src/components/add-recipe-button.tsx
---

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Recipe, Product } from '@/lib/types';
import { RecipeFormDialog } from '@/components/recipe-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function AddRecipeButton({ inventory }: { inventory: Product[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // This would ideally be a server action
  const handleSaveRecipe = (savedRecipe: Recipe) => {
    // In a real app, you'd call a server action here to save the recipe.
    // For now, we'll just show a toast and refresh the page to show the (mock) new recipe.
    // This is a simplified example.
    console.log('Recipe saved (client-side)', savedRecipe);
    toast({ title: 'Recette sauvegardée', description: "La recette a été ajoutée. (Simulation)" });
    router.refresh(); // Refresh the page to see changes from the server
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Ajouter une recette
      </Button>
      <RecipeFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveRecipe}
        recipe={null}
        inventory={inventory}
      />
    </>
  );
}
```

---
path: src/components/barcode-scanner-dialog.tsx
---

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useZxing } from 'react-zxing';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { VideoOff } from 'lucide-react';

interface BarcodeScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScan: (result: string) => void;
}

export function BarcodeScannerDialog({ isOpen, onOpenChange, onScan }: BarcodeScannerDialogProps) {
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText());
    },
    onError(error) {
        console.error(error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setHasPermission(false);
        } else {
            toast({
                variant: 'destructive',
                title: 'Erreur du scanner',
                description: error.message || 'Une erreur inconnue est survenue.',
            });
        }
    },
    onMediaStream(stream) {
        setHasPermission(!!stream);
    },
    paused: !isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scanner un code-barres</DialogTitle>
          <DialogDescription>
            Placez le code-barres du produit devant la caméra.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 rounded-lg overflow-hidden aspect-video">
            {hasPermission === false ? (
                 <div className="h-full w-full bg-muted flex flex-col items-center justify-center text-center">
                    <Alert variant="destructive">
                        <VideoOff className="h-4 w-4" />
                        <AlertTitle>Accès à la caméra refusé</AlertTitle>
                        <AlertDescription>
                            Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser cette fonctionnalité.
                        </AlertDescription>
                    </Alert>
                </div>
            ) : (
                <video ref={ref} className="w-full h-full object-cover" />
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---
path: src/components/create-menu-dialog.tsx
---

```tsx
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
```

---
path: src/components/edit-product-dialog.tsx
---

```tsx
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
```

---
path: src/components/inventory-list.tsx
---

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Product, Category } from '@/lib/types';
import { categories } from '@/lib/types';
import { ProductCard } from './product-card';
import { Leaf, Snowflake, ShoppingCart, GlassWater, SprayCan } from 'lucide-react';

const categoryIcons: Record<Category, React.ReactNode> = {
  frais: <Leaf className="h-5 w-5 text-green-600" />,
  surgelé: <Snowflake className="h-5 w-5 text-blue-400" />,
  épicerie: <ShoppingCart className="h-5 w-5 text-orange-500" />,
  boisson: <GlassWater className="h-5 w-5 text-sky-500" />,
  entretien: <SprayCan className="h-5 w-5 text-gray-500" />,
};

const categoryNames: Record<Category, string> = {
  frais: 'Frais',
  surgelé: 'Surgelé',
  épicerie: 'Épicerie',
  boisson: 'Boissons',
  entretien: 'Entretien',
};

interface InventoryListProps {
  inventory: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export function InventoryList({ inventory, onEditProduct, onDeleteProduct }: InventoryListProps) {
  const groupedInventory = inventory.reduce((acc, product) => {
    (acc[product.category] = acc[product.category] || []).push(product);
    return acc;
  }, {} as Record<Category, Product[]>);

  if (inventory.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-[calc(100vh-12rem)]">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
                <ShoppingCart className="h-12 w-12 text-primary"/>
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">Votre inventaire est vide</h3>
            <p className="text-muted-foreground">Commencez par ajouter votre premier produit.</p>
        </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={categories.filter(cat => groupedInventory[cat])}
      className="w-full space-y-4"
    >
      {categories.map((category) => {
        const products = groupedInventory[category];
        if (!products || products.length === 0) return null;

        return (
          <AccordionItem key={category} value={category} className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-lg font-medium">
              <div className="flex items-center gap-3">
                {categoryIcons[category]}
                <span>{categoryNames[category]}</span>
                <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {products.length}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => onEditProduct(product)}
                    onDelete={() => onDeleteProduct(product)}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
```

---
path: src/components/product-card-actions.tsx
---

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';

interface ProductCardActionsProps {
    onEdit: () => void;
    onDelete: () => void;
}

export function ProductCardActions({ onEdit, onDelete }: ProductCardActionsProps) {
    return (
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
    );
}
```

---
path: src/components/product-card.tsx
---

```tsx
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarClock, Tag, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product, Batch } from '@/lib/types';
import { Separator } from './ui/separator';
import { ProductCardActions } from './product-card-actions';

function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function ExpiryAlertBadge({ batch }: { batch: Batch }) {
    if (!batch.expiryDate) {
        return null;
    }

    const daysUntil = getDaysUntilExpiry(batch.expiryDate);

    if (daysUntil < 0) {
        return <Badge variant="destructive" className="absolute top-2 right-2">Expiré</Badge>;
    }
    if (daysUntil <= 3) {
        return (
        <Badge variant="destructive" className="bg-red-500/90 text-white absolute top-2 right-2">
            <AlertCircle className="mr-1.5 h-3 w-3" />
            Expire dans {daysUntil}j
        </Badge>
        );
    }
    if (daysUntil <= 7) {
        return (
        <Badge variant="secondary" className="bg-amber-500/90 text-white absolute top-2 right-2">
            <AlertCircle className="mr-1.5 h-3 w-3" />
            Expire dans {daysUntil}j
        </Badge>
        );
    }

    return null;
}


interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}


export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const totalQuantity = product.batches.reduce((sum, batch) => sum + batch.quantity, 0);
  
  const sortedBatches = [...product.batches]
    .filter(b => b.quantity > 0)
    .sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return a.expiryDate.getTime() - b.expiryDate.getTime();
    });

  const mostUrgentBatch = sortedBatches.length > 0 ? sortedBatches[0] : null;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg animate-fade-in">
      <CardHeader className="relative p-0">
        <Image
          src={product.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          width={400}
          height={300}
          className="aspect-[4/3] w-full object-cover"
        />
        {mostUrgentBatch && <ExpiryAlertBadge batch={mostUrgentBatch} />}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
           <CardTitle className="text-xl font-bold text-white">{product.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="mb-4 flex items-center justify-between">
            <CardDescription>Quantité totale</CardDescription>
            <p className="text-2xl font-bold text-primary">{totalQuantity}</p>
        </div>
        <Separator className="my-2"/>
        <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Lots en stock :</p>
            {sortedBatches.length > 0 ? (
                <div className="space-y-2">
                {sortedBatches.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span>Quantité: {batch.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarClock className="h-4 w-4" />
                            <span>
                                {batch.expiryDate ? format(batch.expiryDate, 'dd MMM yyyy', { locale: fr }) : 'Sans DLC'}
                            </span>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <p className="text-sm text-center text-muted-foreground py-4">Pas de stock</p>
            )}
        </div>
      </CardContent>
      <ProductCardActions onEdit={onEdit} onDelete={onDelete} />
    </Card>
  );
}
```

---
path: src/components/recipe-card-actions.tsx
---

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { RecipeFormDialog } from './recipe-form-dialog';
import type { Recipe, Product } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface RecipeCardActionsProps {
    recipe: Recipe;
    inventory: Product[];
}

export function RecipeCardActions({ recipe, inventory }: RecipeCardActionsProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    
    // In a real app, this would be a server action
    const handleSave = (savedRecipe: Recipe) => {
        console.log('Editing recipe (client-side simulation)', savedRecipe);
        toast({ title: 'Recette modifiée', description: `${savedRecipe.name} a été mise à jour. (Simulation)` });
        setIsEditDialogOpen(false);
        router.refresh();
    };

    // In a real app, this would be a server action
    const handleDelete = () => {
        console.log('Deleting recipe (client-side simulation)', recipe.id);
        toast({ title: 'Recette supprimée', description: `${recipe.name} a été supprimée. (Simulation)` });
        setIsDeleteDialogOpen(false);
        router.refresh();
    };


    return (
        <>
        <CardFooter className="bg-muted/50 p-2 grid grid-cols-2 gap-2">
            <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                onClick={() => setIsEditDialogOpen(true)}
            >
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
            </Button>
        </CardFooter>

        <RecipeFormDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSave={handleSave}
            recipe={recipe}
            inventory={inventory}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette recette ?</AlertDialogTitle>
                <AlertDialogDescription>
                Cette action est irréversible. La recette "{recipe.name}" sera définitivement supprimée.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Confirmer</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
```

---
path: src/components/recipe-card.tsx
---

```tsx
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChefHat, Clock, BarChart3 } from 'lucide-react';
import type { Recipe, Product } from '@/lib/types';
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
```

---
path: src/components/recipe-form-dialog.tsx
---

```tsx
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, isOpen]);

  useEffect(() => {
      if(!isOpen) {
        setImagePreview(null);
        form.reset();
      }
  }, [isOpen, form]);


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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-1">
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
             <div className="md:col-span-2 space-y-4">
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

          <Separator />
            <h3 className="text-lg font-medium">Détails de la recette</h3>
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
```

---
path: src/components/recipe-pagination.tsx
---

```tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function RecipePagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams.get('page')) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      router.push(createPageURL(currentPage - 1));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      router.push(createPageURL(currentPage + 1));
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Page précédente</span>
      </Button>
      <span className="text-sm font-medium">
        Page {currentPage} sur {totalPages}
      </span>
      <Button variant="outline" size="icon" onClick={handleNextPage} disabled={currentPage === totalPages}>
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Page suivante</span>
      </Button>
    </div>
  );
}
```

---
path: src/components/recipe-search.tsx
---

```tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function RecipeSearch({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
      />
    </div>
  );
}
```

---
path: src/components/suggested-items.tsx
---

```tsx
'use client';

import type { Product, Category } from '@/lib/types';
import { categoryNames } from '@/lib/types';
import { Button } from './ui/button';
import { PlusCircle, Info } from 'lucide-react';

interface SuggestedItem {
    name: string;
    category: Category;
}

const recurringItems: SuggestedItem[] = [
    { name: 'Café', category: 'épicerie' },
    { name: 'Thé', category: 'épicerie' },
    { name: 'Sucre', category: 'épicerie' },
    { name: 'Beurre', category: 'frais' },
    { name: 'Confiture', category: 'épicerie' },
    { name: 'Madeleines', category: 'épicerie' },
    { name: 'Jus de fruits', category: 'boisson' },
    { name: 'Huile d\'olive', category: 'épicerie' },
    { name: 'Vinaigre', category: 'épicerie' },
    { name: 'Sel', category: 'épicerie' },
    { name: 'Poivre', category: 'épicerie' },
    { name: 'Essuie-tout', category: 'entretien' },
    { name: 'Papier toilette', category: 'entretien' },
];

interface SuggestedItemsProps {
    inventory: Product[];
}

export function SuggestedItems({ inventory }: SuggestedItemsProps) {
    const inventoryNames = new Set(inventory.map(p => p.name.toLowerCase()));

    const suggestions = recurringItems.filter(item => !inventoryNames.has(item.name.toLowerCase()));

    if (suggestions.length === 0) {
        return (
            <div className="text-center text-sm text-muted-foreground p-4">
                <Info className="mx-auto h-6 w-6 mb-2" />
                Vous semblez avoir tous les produits récurrents en stock.
            </div>
        )
    }

    const groupedSuggestions = suggestions.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {} as Record<Category, SuggestedItem[]>);
    
    const orderedCategories = Object.keys(groupedSuggestions).sort() as Category[];


    return (
        <div className="space-y-4">
            {orderedCategories.map(category => (
                <div key={category}>
                    <h4 className="font-semibold text-sm text-primary mb-2">{categoryNames[category]}</h4>
                    <div className="space-y-2">
                        {groupedSuggestions[category].map(item => (
                            <div key={item.name} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                                <span>{item.name}</span>
                                <Button size="sm" variant="ghost" className="h-7 text-primary hover:bg-primary/10">
                                    <PlusCircle className="h-4 w-4 mr-1.5" />
                                    Ajouter
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
```

---
path: src/components/ui/accordion.tsx
---

```tsx
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```

---
path: src/components/ui/alert-dialog.tsx
---

```tsx
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

---
path: src/components/ui/alert.tsx
---

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
```

---
path: src/components/ui/avatar.tsx
---

```tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
```

---
path: src/components/ui/badge.tsx
---

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

---
path: src/components/ui/button.tsx
---

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---
path: src/components/ui/calendar.tsx
---

```tsx
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
```

---
path: src/components/ui/card.tsx
---

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

---
path: src/components/ui/carousel.tsx
---

```tsx
"use client"

import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
```

---
path: src/components/ui/chart.tsx
---

```tsx
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
```

---
path: src/components/ui/checkbox.tsx
---

```tsx
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
```

---
path: src/components/ui/collapsible.tsx
---

```tsx
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
```

---
path: src/components/ui/dialog.tsx
---

```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

---
path: src/components/ui/dropdown-menu.tsx
---

```tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
```

---
path: src/components/ui/form.tsx
---

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
```

---
path: src/components/ui/input.tsx
---

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

---
path: src/components/ui/label.tsx
---

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

---
path: src/components/ui/menubar.tsx
---

```tsx
"use client"

import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
```

---
path: src/components/ui/popover.tsx
---

```tsx
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
```

---
path: src/components/ui/progress.tsx
---

```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

---
path: src/components/ui/radio-group.tsx
---

```tsx
"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
```

---
path: src/components/ui/scroll-area.tsx
---

```tsx
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
```

---
path: src/components/ui/select.tsx
---

```tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
```

---
path: src/components/ui/separator.tsx
---

```tsx
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
```

---
path: src/components/ui/sheet.tsx
---

```tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
```

---
path: src/components/ui/sidebar.tsx
---

```tsx
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
```

---
path: src/components/ui/skeleton.tsx
---

```tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

---
path: src/components/ui/slider.tsx
---

```tsx
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
```

---
path: src/components/ui/switch.tsx
---

```tsx
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

---
path: src/components/ui/table.tsx
---

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

---
path: src/components/ui/tabs.tsx
---

```tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

---
path: src/components/ui/textarea.tsx
---

```tsx
import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
```

---
path: src/components/ui/toast.tsx
---

```tsx
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

---
path: src/components/ui/toaster.tsx
---

```tsx
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

---
path: src/components/ui/tooltip.tsx
---

```tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

---
path: src/hooks/use-local-storage.ts
---

```ts
'use client';

import { useState, useEffect, useCallback } from 'react';

function tryParse<T>(value: string | null): T | null {
    if (value === null) return null;
    try {
        return JSON.parse(value, (key, value) => {
            // Check if the value is a string and looks like a date
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            return value;
        });
    } catch (e) {
        console.error("Failed to parse JSON from localStorage", e);
        return null;
    }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          setStoredValue(tryParse<T>(item) ?? initialValue);
        }
      } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
      }
    }
  }, [isMounted, key, initialValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (!isMounted) {
      return;
    }
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [isMounted, key, storedValue]);
  
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key && e.newValue) {
            const parsedItem = tryParse<T>(e.newValue);
            if (parsedItem !== null) {
                setStoredValue(parsedItem);
            }
        }
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  // Return initialValue on the server and during the first client render
  if (!isMounted) {
    return [initialValue, setValue] as const;
  }

  return [storedValue, setValue] as const;
}
```

---
path: src/hooks/use-mobile.tsx
---

```tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

---
path: src/hooks/use-toast.ts
---

```ts
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

---
path: src/lib/actions.ts
---

```ts
'use server';

import { suggestFoodCategory } from '@/ai/flows/suggest-food-category';
import { extractMenuFromImage } from '@/ai/flows/extract-menu-from-image';
import type { ExtractMenuOutput } from '@/ai/schemas/menu-extraction';
import { categories, type Category } from '@/lib/types';

export async function getCategorySuggestion(foodItemName: string): Promise<Category | null> {
  if (!foodItemName || foodItemName.trim().length < 3) {
    return null;
  }
  try {
    const result = await suggestFoodCategory({ foodItemName });
    const suggestedCategory = result.category.toLowerCase() as Category;

    if (categories.includes(suggestedCategory)) {
      return suggestedCategory;
    }
    
    console.warn(`AI suggested an unknown category: "${result.category}"`);
    return null;

  } catch (error) {
    console.error('Error suggesting food category:', error);
    return null;
  }
}

export async function handleExtractMenu(photoDataUri: string): Promise<ExtractMenuOutput | null> {
  if (!photoDataUri) {
    return null;
  }
  try {
    const result = await extractMenuFromImage({ photoDataUri });
    return result;
  } catch (error) {
    console.error('Error extracting menu from image:', error);
    return null;
  }
}
```

---
path: src/lib/data.ts
---

```ts
import 'server-only';
import { initialInventory, initialRecipes } from './initial-data';
import type { Product, Recipe } from './types';

// In a real application, these functions would fetch data from a database.
// For this prototype, we're returning the initial mock data.
// The `noStore` function from Next.js would typically be used here to prevent caching
// if the data were dynamic, but for static mock data, it's not necessary.

export async function getInventory(): Promise<Product[]> {
  // Simulate a network delay
  // await new Promise(resolve => setTimeout(resolve, 100));
  return initialInventory;
}

export async function getRecipes(): Promise<Recipe[]> {
  // Simulate a network delay
  // await new Promise(resolve => setTimeout(resolve, 100));
  return initialRecipes;
}
```

---
path: src/lib/initial-data.ts
---

```ts
import type { Product, Recipe } from './types';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const today = new Date();

export const initialInventory: Product[] = [
  {
    id: '1',
    name: 'Yaourts Nature',
    category: 'frais',
    batches: [
      { id: '1a', quantity: 4, expiryDate: addDays(today, 7) },
      { id: '1b', quantity: 2, expiryDate: addDays(today, 14) },
    ],
  },
  {
    id: '2',
    name: 'Pommes Golden',
    category: 'frais',
    batches: [{ id: '2a', quantity: 6, expiryDate: addDays(today, 10) }],
  },
    {
    id: '11',
    name: 'Lait demi-écrémé',
    category: 'frais',
    batches: [{ id: '11a', quantity: 1, expiryDate: addDays(today, 2) }],
  },
  {
    id: '3',
    name: 'Épinards hachés',
    category: 'surgelé',
    batches: [{ id: '3a', quantity: 1, expiryDate: addDays(today, 180) }],
  },
  {
    id: '4',
    name: 'Pizza 4 Fromages',
    category: 'surgelé',
    batches: [{ id: '4a', quantity: 2, expiryDate: addDays(today, 90) }],
  },
  {
    id: '5',
    name: 'Pâtes Penne',
    category: 'épicerie',
    batches: [{ id: '5a', quantity: 1, expiryDate: addDays(today, 365) }],
  },
  {
    id: '6',
    name: 'Sauce Tomate Basilic',
    category: 'épicerie',
    batches: [{ id: '6a', quantity: 3, expiryDate: addDays(today, 250) }],
  },
  {
    id: '7',
    name: 'Eau Minérale',
    category: 'boisson',
    batches: [{ id: '7a', quantity: 6, expiryDate: null }],
  },
  {
    id: '8',
    name: 'Jus d\'Orange',
    category: 'boisson',
    batches: [{ id: '8a', quantity: 1, expiryDate: addDays(today, 20) }],
  },
  {
    id: '9',
    name: 'Liquide Vaisselle',
    category: 'entretien',
    batches: [{ id: '9a', quantity: 1, expiryDate: null }],
  },
  {
    id: '10',
    name: 'Éponges',
    category: 'entretien',
    batches: [{ id: '10a', quantity: 3, expiryDate: null }],
  },
];

export const initialRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Pâtes à la sauce tomate',
    description: 'Un classique rapide et délicieux pour toute la famille.',
    ingredients: [
      { productId: '5', quantity: 400, unit: 'g' },
      { productId: '6', quantity: 1, unit: 'piece' },
    ],
    preparationTime: 5,
    cookingTime: 15,
    difficulty: 'facile',
  },
  {
    id: '2',
    name: 'Pizza rapide',
    description: 'Une pizza simple et efficace pour les soirs de flemme.',
    ingredients: [{ productId: '4', quantity: 1, unit: 'piece' }],
    preparationTime: 2,
    cookingTime: 12,
    difficulty: 'facile',
  },
];
```

---
path: src/lib/types.ts
---

```ts
export type Category = 'frais' | 'surgelé' | 'épicerie' | 'boisson' | 'entretien';

export const categories: Category[] = ['frais', 'surgelé', 'épicerie', 'boisson', 'entretien'];

export const categoryNames: Record<Category, string> = {
  frais: 'Frais',
  surgelé: 'Surgelé',
  épicerie: 'Épicerie',
  boisson: 'Boissons',
  entretien: 'Entretien',
};

export interface Batch {
  id: string;
  quantity: number;
  expiryDate: Date | null;
}

export interface Product {
  id:string;
  name: string;
  category: Category;
  imageUrl?: string;
  batches: Batch[];
}

export interface Ingredient {
  productId: string;
  quantity: number;
  unit: 'g' | 'ml' | 'piece';
}

export type Difficulty = 'facile' | 'moyen' | 'difficile';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  ingredients: Ingredient[];
  preparationTime?: number; // in minutes
  cookingTime?: number; // in minutes
  difficulty?: Difficulty;
}
```

---
path: src/lib/utils.ts
---

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---
path: tailwind.config.ts
---

```ts
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

---
path: tsconfig.json
---

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```
