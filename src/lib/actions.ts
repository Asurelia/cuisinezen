'use server';

import { suggestFoodCategory } from '@/ai/flows/suggest-food-category';
import { categories, type Category } from '@/lib/types';

export async function getCategorySuggestion(foodItemName: string): Promise<Category | null> {
  if (!foodItemName || foodItemName.trim().length < 3) {
    return null;
  }
  try {
    const result = await suggestFoodCategory({ foodItemName });
    const suggestedCategory = result.category.toLowerCase() as Category;

    // Check if the suggested category is one of our valid categories
    if (categories.includes(suggestedCategory)) {
      return suggestedCategory;
    }
    
    // Fallback or simple mapping for close matches if needed, but for now we'll be strict.
    console.warn(`AI suggested an unknown category: "${result.category}"`);
    return null;

  } catch (error) {
    console.error('Error suggesting food category:', error);
    return null;
  }
}
