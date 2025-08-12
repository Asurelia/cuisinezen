import type { Product, Recipe } from './types';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const today = new Date();

export const mockInventory: Product[] = [
  {
    id: '1',
    name: 'Yaourts Nature',
    category: 'frais',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "yogurt nature",
    batches: [
      { id: '1a', quantity: 4, expiryDate: addDays(today, 7) },
      { id: '1b', quantity: 2, expiryDate: addDays(today, 14) },
    ],
  },
  {
    id: '2',
    name: 'Pommes Golden',
    category: 'frais',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "golden apples",
    batches: [{ id: '2a', quantity: 6, expiryDate: addDays(today, 10) }],
  },
    {
    id: '11',
    name: 'Lait demi-écrémé',
    category: 'frais',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "milk bottle",
    batches: [{ id: '11a', quantity: 1, expiryDate: addDays(today, 2) }],
  },
  {
    id: '3',
    name: 'Épinards hachés',
    category: 'surgelé',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "frozen spinach",
    batches: [{ id: '3a', quantity: 1, expiryDate: addDays(today, 180) }],
  },
  {
    id: '4',
    name: 'Pizza 4 Fromages',
    category: 'surgelé',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "frozen pizza",
    batches: [{ id: '4a', quantity: 2, expiryDate: addDays(today, 90) }],
  },
  {
    id: '5',
    name: 'Pâtes Penne',
    category: 'épicerie',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "penne pasta",
    batches: [{ id: '5a', quantity: 1, expiryDate: addDays(today, 365) }],
  },
  {
    id: '6',
    name: 'Sauce Tomate Basilic',
    category: 'épicerie',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "tomato sauce",
    batches: [{ id: '6a', quantity: 3, expiryDate: addDays(today, 250) }],
  },
  {
    id: '7',
    name: 'Eau Minérale',
    category: 'boisson',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "water bottle",
    batches: [{ id: '7a', quantity: 6, expiryDate: null }],
  },
  {
    id: '8',
    name: 'Jus d\'Orange',
    category: 'boisson',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "orange juice",
    batches: [{ id: '8a', quantity: 1, expiryDate: addDays(today, 20) }],
  },
  {
    id: '9',
    name: 'Liquide Vaisselle',
    category: 'entretien',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "dish soap",
    batches: [{ id: '9a', quantity: 1, expiryDate: null }],
  },
  {
    id: '10',
    name: 'Éponges',
    category: 'entretien',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: "cleaning sponges",
    batches: [{ id: '10a', quantity: 3, expiryDate: null }],
  },
];

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Pâtes à la sauce tomate',
    description: 'Un classique rapide et délicieux pour toute la famille.',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'pasta tomato sauce',
    ingredients: [
      { productId: '5', quantity: 400, unit: 'g' },
      { productId: '6', quantity: 1, unit: 'piece' },
    ],
    preparationTime: 5,
    cookingTime: 15,
    difficulty: 'facile',
  },
  {
    id: '2',
    name: 'Pizza rapide',
    description: 'Une pizza simple et efficace pour les soirs de flemme.',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'pizza slice',
    ingredients: [{ productId: '4', quantity: 1, unit: 'piece' }],
    preparationTime: 2,
    cookingTime: 12,
    difficulty: 'facile',
  },
];
