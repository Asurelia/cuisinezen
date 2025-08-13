
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

