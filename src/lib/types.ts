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
  dataAiHint?: string;
  batches: Batch[];
}

export interface Ingredient {
  productId: string;
  quantity: number;
  unit: 'g' | 'ml' | 'piece';
}

export type Difficulty = 'facile' | 'moyen' | 'difficile';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  dataAiHint?: string;
  ingredients: Ingredient[];
  preparationTime?: number; // in minutes
  cookingTime?: number; // in minutes
  difficulty?: Difficulty;
}
