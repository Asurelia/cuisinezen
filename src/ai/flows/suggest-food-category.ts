'use server';

/**
 * @fileOverview A food category suggestion AI agent.
 *
 * - suggestFoodCategory - A function that suggests a food category based on the food item name.
 * - SuggestFoodCategoryInput - The input type for the suggestFoodCategory function.
 * - SuggestFoodCategoryOutput - The return type for the suggestFoodCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFoodCategoryInputSchema = z.object({
  foodItemName: z
    .string()
    .describe('The name of the food item to categorize.'),
});
export type SuggestFoodCategoryInput = z.infer<typeof SuggestFoodCategoryInputSchema>;

const SuggestFoodCategoryOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The suggested category for the food item (e.g., surgelé, frais, épicerie, boisson, entretien).'
    ),
});
export type SuggestFoodCategoryOutput = z.infer<typeof SuggestFoodCategoryOutputSchema>;

export async function suggestFoodCategory(input: SuggestFoodCategoryInput): Promise<SuggestFoodCategoryOutput> {
  return suggestFoodCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFoodCategoryPrompt',
  input: {schema: SuggestFoodCategoryInputSchema},
  output: {schema: SuggestFoodCategoryOutputSchema},
  prompt: `You are a helpful assistant that suggests the most appropriate food category for a given food item name.

  The possible categories are: surgelé, frais, épicerie, boisson, entretien.

  Food Item Name: {{{foodItemName}}}
  Category:`,
});

const suggestFoodCategoryFlow = ai.defineFlow(
  {
    name: 'suggestFoodCategoryFlow',
    inputSchema: SuggestFoodCategoryInputSchema,
    outputSchema: SuggestFoodCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
