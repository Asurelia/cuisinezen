'use server';

/**
 * @fileOverview Extracts menu information from an image.
 *
 * - extractMenuFromImage - A function that handles the menu extraction process.
 */

import {ai} from '@/ai/genkit';
import {
    ExtractMenuInput,
    ExtractMenuInputSchema,
    ExtractMenuOutput,
    ExtractMenuOutputSchema
} from '@/ai/schemas/menu-extraction';

export async function extractMenuFromImage(input: ExtractMenuInput): Promise<ExtractMenuOutput> {
  return extractMenuFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractMenuPrompt',
  input: {schema: ExtractMenuInputSchema},
  output: {schema: ExtractMenuOutputSchema},
  prompt: `You are an expert at analyzing images of weekly menus and extracting the dishes for each day.
Analyze the provided image and extract the menu for the week.
The menu image may be handwritten or typed. Identify the dishes for lunch (midi) and dinner (soir) for each day from Monday (Lundi) to Sunday (Dimanche).
If a meal is not specified for a given day, you can leave it empty.

Menu Photo: {{media url=photoDataUri}}`,
});

const extractMenuFlow = ai.defineFlow(
  {
    name: 'extractMenuFlow',
    inputSchema: ExtractMenuInputSchema,
    outputSchema: ExtractMenuOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
