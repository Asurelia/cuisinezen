'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddProductDialog } from '@/components/add-product-dialog';
import { InventoryList } from '@/components/inventory-list';
import type { Product } from '@/lib/types';
import { mockInventory } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

export function InventoryPage() {
  const [inventory, setInventory] = useState<Product[]>(mockInventory);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<{ product: Product; index: number } | null>(null);
  const { toast } = useToast();

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

  const handleUndoDelete = () => {
    if (lastDeleted) {
      const { product, index } = lastDeleted;
      const newInventory = [...inventory];
      newInventory.splice(index, 0, product);
      setInventory(newInventory);
      setLastDeleted(null);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const productIndex = inventory.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const productToDelete = inventory[productIndex];
    setLastDeleted({ product: productToDelete, index: productIndex });

    const newInventory = inventory.filter(p => p.id !== productId);
    setInventory(newInventory);

    toast({
      title: 'Produit supprimé',
      description: `${productToDelete.name} a été retiré.`,
      action: <ToastAction altText="Annuler" onClick={handleUndoDelete}>Annuler</ToastAction>,
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-2">
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
        <div className="ml-auto">
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <InventoryList
          inventory={inventory}
          onDeleteProduct={handleDeleteProduct}
        />
      </main>
      <AddProductDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
}
