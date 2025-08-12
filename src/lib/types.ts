export type Category = 'frais' | 'surgelé' | 'épicerie' | 'boisson' | 'entretien';

export const categories: Category[] = ['frais', 'surgelé', 'épicerie', 'boisson', 'entretien'];

export const categoryNames: Record<Category, string> = {
  frais: 'Frais',
  surgelé: 'Surgelé',
  épicerie: 'Épicerie',
  boisson: 'Boissons',
  entretien: 'Entretien',
};

export interface Batch {
  id: string;
  quantity: number;
  expiryDate: Date | null;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  imageUrl?: string;
  batches: Batch[];
}
