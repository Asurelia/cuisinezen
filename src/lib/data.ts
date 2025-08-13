
import 'server-only';
import { initialInventory, initialRecipes } from './initial-data';
import type { Product, Recipe } from './types';

// In a real application, these functions would fetch data from a database.
// For this prototype, we're returning the initial mock data.
// The `noStore` function from Next.js would typically be used here to prevent caching
// if the data were dynamic, but for static mock data, it's not necessary.

export async function getInventory(): Promise<Product[]> {
  // Simulate a network delay
  // await new Promise(resolve => setTimeout(resolve, 100));
  return initialInventory;
}

export async function getRecipes(): Promise<Recipe[]> {
  // Simulate a network delay
  // await new Promise(resolve => setTimeout(resolve, 100));
  return initialRecipes;
}
