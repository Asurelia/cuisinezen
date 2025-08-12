
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
