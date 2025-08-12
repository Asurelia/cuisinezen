
'use server';

import { suggestFoodCategory } from '@/ai/flows/suggest-food-category';
import { extractMenuFromImage } from '@/ai/flows/extract-menu-from-image';
import type { ExtractMenuOutput } from '@/ai/schemas/menu-extraction';
import { categories, type Category } from '@/lib/types';

export async function getCategorySuggestion(foodItemName: string): Promise<Category | null> {
  if (!foodItemName || foodItemName.trim().length < 3) {
    return null;
  }
  try {
    const result = await suggestFoodCategory({ foodItemName });
    const suggestedCategory = result.category.toLowerCase() as Category;

    if (categories.includes(suggestedCategory)) {
      return suggestedCategory;
    }
    
    console.warn(`AI suggested an unknown category: "${result.category}"`);
    return null;

  } catch (error) {
    console.error('Error suggesting food category:', error);
    return null;
  }
}

export async function handleExtractMenu(photoDataUri: string): Promise<ExtractMenuOutput | null> {
  if (!photoDataUri) {
    return null;
  }
  try {
    const result = await extractMenuFromImage({ photoDataUri });
    return result;
  } catch (error) {
    console.error('Error extracting menu from image:', error);
    return null;
  }
}
