'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarClock, Trash2, Tag, AlertCircle } from 'lucide-react';
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

interface ProductCardProps {
  product: Product;
  onDelete: (productId: string) => void;
}

function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ batch }: { batch: Batch }) {
  if (!batch.expiryDate) {
    return <Badge variant="secondary">Sans DLC</Badge>;
  }

  const daysUntil = getDaysUntilExpiry(batch.expiryDate);

  if (daysUntil < 0) {
    return <Badge variant="destructive">Expiré</Badge>;
  }
  if (daysUntil <= 3) {
    return (
      <Badge variant="destructive" className="bg-red-500/80 text-white">
        <AlertCircle className="mr-1.5 h-3 w-3" />
        Expire dans {daysUntil}j
      </Badge>
    );
  }
  if (daysUntil <= 7) {
    return (
      <Badge variant="secondary" className="bg-amber-500/80 text-white">
        <AlertCircle className="mr-1.5 h-3 w-3" />
        Expire dans {daysUntil}j
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      <CalendarClock className="mr-1.5 h-3 w-3" />
      {format(batch.expiryDate, 'dd MMM yyyy', { locale: fr })}
    </Badge>
  );
}

export function ProductCard({ product, onDelete }: ProductCardProps) {
  const totalQuantity = product.batches.reduce((sum, batch) => sum + batch.quantity, 0);
  
  const sortedBatches = [...product.batches]
    .filter(b => b.quantity > 0)
    .sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return a.expiryDate.getTime() - b.expiryDate.getTime();
    });

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="relative p-0">
        <Image
          src={product.imageUrl || 'https://placehold.co/400x300.png'}
          alt={product.name}
          width={400}
          height={300}
          className="aspect-[4/3] w-full object-cover"
          data-ai-hint="food item"
        />
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
                    <ExpiryBadge batch={batch} />
                    </div>
                ))}
                </div>
            ) : (
                <p className="text-sm text-center text-muted-foreground py-4">Pas de stock</p>
            )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(product.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
      </CardFooter>
    </Card>
  );
}
