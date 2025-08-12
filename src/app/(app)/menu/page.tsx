'use client';

import { useState, useRef, useTransition, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileText, Files, FileImage, UtensilsCrossed, BookOpen, Loader2, Salad, Soup, Info } from "lucide-react";
import { handleExtractMenu } from '@/lib/actions';
import type { ExtractMenuOutput } from '@/ai/schemas/menu-extraction';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function MenuPage() {
  const [isExtracting, startExtractionTransition] = useTransition();
  const [extractedMenu, setExtractedMenu] = useState<ExtractMenuOutput | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setExtractedMenu(null);

    startExtractionTransition(async () => {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64Image = reader.result as string;
          const result = await handleExtractMenu(base64Image);
          if (result && result.week.length > 0) {
            setExtractedMenu(result);
             toast({
              title: 'Extraction réussie !',
              description: 'Le menu de la semaine a été importé.',
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

  const weekDaysOrder = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  const sortedWeek = extractedMenu?.week.sort((a, b) => {
    return weekDaysOrder.indexOf(a.day) - weekDaysOrder.indexOf(b.day);
  });


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
            Importez votre menu en image ou planifiez-le manuellement.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-medium">Importer un menu existant</h3>
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
             <h3 className="font-medium">Menu extrait</h3>
              {isExtracting ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-full">
                    <Loader2 className="h-12 w-12 text-muted-foreground animate-spin"/>
                    <p className="mt-4 text-sm text-muted-foreground">L'IA analyse votre image...</p>
                 </div>
              ) : !extractedMenu ? (
                 <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-full">
                    <UtensilsCrossed className="h-12 w-12 text-muted-foreground"/>
                    <p className="mt-4 text-sm text-muted-foreground">Importez une image pour voir le menu ici.</p>
                 </div>
              ) : (
                <div className="h-full max-h-[300px] overflow-y-auto rounded-lg border p-4 space-y-4 bg-muted/20">
                    {sortedWeek && sortedWeek.length > 0 ? (
                        sortedWeek.map(dayMenu => (
                            <div key={dayMenu.day}>
                                <h4 className="font-semibold text-primary">{dayMenu.day}</h4>
                                <div className="pl-4 mt-1 space-y-1 text-sm">
                                    {dayMenu.lunch && (
                                        <div className="flex items-center gap-2">
                                            <Salad className="h-4 w-4 text-amber-600" />
                                            <div>
                                                <span className="font-medium">Midi :</span> {dayMenu.lunch.name}
                                            </div>
                                        </div>
                                    )}
                                    {dayMenu.dinner && (
                                        <div className="flex items-center gap-2">
                                            <Soup className="h-4 w-4 text-indigo-600" />
                                            <div>
                                                <span className="font-medium">Soir :</span> {dayMenu.dinner.name}
                                            </div>
                                        </div>
                                    )}
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
              )}
          </div>
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">
                L'IA vous aide à extraire les plats de vos menus. La gestion des ingrédients sera bientôt disponible.
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
