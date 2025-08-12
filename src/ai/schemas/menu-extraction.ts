import {z} from 'genkit';

const MealSchema = z.object({
  name: z.string().describe("The name of the dish."),
  description: z.string().optional().describe("A brief description of the dish."),
});

const DayMenuSchema = z.object({
  day: z.string().describe("The day of the week (e.g., Lundi, Mardi)."),
  lunch: MealSchema.optional().describe("The dish for lunch."),
  dinner: MealSchema.optional().describe("The dish for dinner."),
});

export const ExtractMenuInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a menu, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractMenuInput = z.infer<typeof ExtractMenuInputSchema>;

export const ExtractMenuOutputSchema = z.object({
  week: z.array(DayMenuSchema).describe("The menu for the entire week."),
});
export type ExtractMenuOutput = z.infer<typeof ExtractMenuOutputSchema>;
