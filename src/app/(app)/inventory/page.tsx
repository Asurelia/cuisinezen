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

export default function InventoryPage() {
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
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 -mx-4 md:-mx-6">
        <div className="flex items-center gap-2">
         
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Inventaire
          </h1>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
        </div>
      </header>
      <main className="flex-1 pt-6">
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
