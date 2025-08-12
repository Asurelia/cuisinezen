
'use client';

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
