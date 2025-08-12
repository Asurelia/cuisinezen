'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileText, FileCsv, FileImage } from "lucide-react";

export default function MenuPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Planification des Menus</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouveau Menu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu de la semaine</CardTitle>
          <CardDescription>
            Importez votre menu ou commencez à le composer pour la semaine à venir.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-medium">Importer un menu existant</h3>
            <div className="flex flex-col gap-4">
              <Button variant="outline" className="justify-start">
                <FileImage className="mr-2 h-4 w-4" />
                Importer une image
              </Button>
              <Button variant="outline" className="justify-start">
                <FileCsv className="mr-2 h-4 w-4" />
                Importer un fichier CSV
              </Button>
               <Button variant="outline" className="justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Importer un PDF ou autre
              </Button>
            </div>
          </div>
          <div className="space-y-4">
             <h3 className="font-medium">Ou commencez à planifier</h3>
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center h-full">
                <UtensilsCrossed className="h-12 w-12 text-muted-foreground"/>
                <p className="mt-4 text-sm text-muted-foreground">Bientôt disponible : planifiez vos repas jour par jour.</p>
             </div>
          </div>
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">
                L'IA vous aidera à extraire les recettes et les ingrédients de vos fichiers importés.
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

// Dummy icons for placeholders
function UtensilsCrossed(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z"/>
            <path d="M15 12 3.4 23.6a2 2 0 0 1-2.8 0l-1.8-1.8a2 2 0 0 1 0-2.8L12 15"/>
            <path d="m2.1 21.8 6.4-6.3"/>
            <path d="m19 5-7 7"/>
        </svg>
    )
}

function BookOpen(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
    )
}
