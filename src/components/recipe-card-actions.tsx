
'use client';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';

interface RecipeCardActionsProps {
    onEdit: () => void;
    onDelete: () => void;
}

export function RecipeCardActions({ onEdit, onDelete }: RecipeCardActionsProps) {
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
