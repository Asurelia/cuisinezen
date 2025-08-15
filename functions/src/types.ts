// Types partagés pour les Cloud Functions
export type Category = "frais" | "surgelé" | "épicerie" | "boisson" | "entretien";

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
  unitCost?: number; // Coût unitaire pour calculs
}

export interface Ingredient {
  productId: string;
  quantity: number;
  unit: "g" | "ml" | "piece";
}

export type Difficulty = "facile" | "moyen" | "difficile";

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  ingredients: Ingredient[];
  preparationTime?: number;
  cookingTime?: number;
  difficulty?: Difficulty;
  servings?: number; // Nombre de portions
}

export interface NotificationSettings {
  enabled: boolean;
  daysBeforeExpiry: number;
  email?: string;
  whatsapp?: string;
}

export interface ShoppingListItem {
  productName: string;
  quantity: number;
  unit: string;
  priority: "high" | "medium" | "low";
  estimatedCost?: number;
}

export interface CostAnalysis {
  recipeId: string;
  recipeName: string;
  totalCost: number;
  costPerServing: number;
  ingredients: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }>;
  calculatedAt: Date;
}

export interface BackupData {
  timestamp: Date;
  products: Product[];
  recipes: Recipe[];
  settings: any;
  version: string;
}

export interface PosTransaction {
  id: string;
  timestamp: Date;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
}