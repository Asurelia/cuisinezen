
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


type ExtractedMenuWithId = ExtractMenuOutput & { id: string; name: string };

export default function MenuPage() {
  const [isExtracting, startExtractionTransition] = useTransition();
  const [extractedMenus, setExtractedMenus] = useLocalStorage<ExtractedMenuWithId[]>('extractedMenus', []);
  const [recipes] = useLocalStorage<Recipe[]>('recipes', initialRecipes);
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
             <Link href={`/recipes?recipeId=${recipe.id}`} passHref>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    Voir
                    <ExternalLink className="h-3 w-3 ml-1.5"/>
                </Button>
            </Link>
        )}
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Planification des Menus</h1>
        <Button disabled>
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
             <h3 className="font-medium">Menus importés</h3>
              {isExtracting && (
                 <div className="flex items-center space-x-2 text-sm text-muted-foreground p-4 border rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span>L'IA analyse votre image, veuillez patienter...</span>
                 </div>
              )}
              
              {extractedMenus.length === 0 && !isExtracting ? (
                 <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-full">
                    <UtensilsCrossed className="h-12 w-12 text-muted-foreground"/>
                    <p className="mt-4 text-sm text-muted-foreground">Importez une image pour voir vos menus ici.</p>
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
                                        <AlertTitle>Extraction incomplète</AlertTitle>
                                        <AlertDescription>
                                            L'IA n'a pas pu identifier de structure de menu hebdomadaire dans l'image.
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
      
       <Card>
        <CardHeader>
          <CardTitle>Gestion des recettes</CardTitle>
          <CardDescription>
            Gérez les ingrédients pour chaque recette et recevez des alertes en cas de stock manquant.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-full">
                <BookOpen className="h-12 w-12 text-muted-foreground"/>
                <p className="mt-4 text-sm text-muted-foreground">
                    La gestion des recettes et les alertes de stock seront bientôt disponibles ici.
                </p>
             </div>
        </CardContent>
      </Card>

    </div>
  );
}
