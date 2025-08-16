import { gql } from 'apollo-server-functions';

export const typeDefs = gql`
  # Types de base
  scalar Date
  scalar JSON

  # Enums
  enum ProductCategory {
    FRUITS_VEGETABLES
    MEAT_FISH
    DAIRY
    GRAINS_CEREALS
    BEVERAGES
    CONDIMENTS
    FROZEN
    CANNED
    SNACKS
    OTHER
  }

  enum ExpirationStatus {
    FRESH
    EXPIRING_SOON
    EXPIRED
  }

  enum MealType {
    BREAKFAST
    LUNCH
    DINNER
    SNACK
    DESSERT
  }

  # Types principaux
  type Product {
    id: ID!
    name: String!
    category: ProductCategory!
    quantity: Int!
    unit: String!
    expirationDate: Date
    purchaseDate: Date!
    price: Float
    barcode: String
    imageUrl: String
    location: String
    expirationStatus: ExpirationStatus!
    nutrition: NutritionInfo
    tags: [String!]!
    createdAt: Date!
    updatedAt: Date!
  }

  type NutritionInfo {
    calories: Float
    protein: Float
    carbs: Float
    fat: Float
    fiber: Float
    sugar: Float
  }

  type Recipe {
    id: ID!
    title: String!
    description: String
    imageUrl: String
    prepTime: Int!
    cookTime: Int!
    servings: Int!
    difficulty: String!
    mealType: MealType!
    ingredients: [RecipeIngredient!]!
    instructions: [String!]!
    nutrition: NutritionInfo
    tags: [String!]!
    rating: Float
    reviews: [Review!]!
    createdAt: Date!
    updatedAt: Date!
  }

  type RecipeIngredient {
    id: ID!
    name: String!
    quantity: Float!
    unit: String!
    notes: String
  }

  type Review {
    id: ID!
    userId: String!
    rating: Int!
    comment: String
    createdAt: Date!
  }

  type ShoppingItem {
    id: ID!
    name: String!
    category: ProductCategory!
    quantity: Int!
    unit: String!
    priority: String!
    purchased: Boolean!
    price: Float
    notes: String
    createdAt: Date!
  }

  type Menu {
    id: ID!
    name: String!
    description: String
    startDate: Date!
    endDate: Date!
    meals: [MenuMeal!]!
    totalCost: Float
    createdAt: Date!
    updatedAt: Date!
  }

  type MenuMeal {
    date: Date!
    mealType: MealType!
    recipeId: String!
    recipe: Recipe!
    servings: Int!
  }

  type Analytics {
    totalProducts: Int!
    expiringProducts: Int!
    expiredProducts: Int!
    totalValue: Float!
    wasteAmount: Float!
    categoryDistribution: [CategoryStat!]!
    expirationTrends: [ExpirationTrend!]!
    costAnalysis: CostAnalysis!
    recommendations: [String!]!
  }

  type CategoryStat {
    category: ProductCategory!
    count: Int!
    value: Float!
    percentage: Float!
  }

  type ExpirationTrend {
    date: Date!
    expiringCount: Int!
    expiredCount: Int!
    wasteValue: Float!
  }

  type CostAnalysis {
    monthlySpending: Float!
    averageItemCost: Float!
    wastePercentage: Float!
    savings: Float!
    trends: [CostTrend!]!
  }

  type CostTrend {
    month: String!
    spending: Float!
    waste: Float!
    savings: Float!
  }

  # Input types
  input ProductInput {
    name: String!
    category: ProductCategory!
    quantity: Int!
    unit: String!
    expirationDate: Date
    price: Float
    barcode: String
    imageUrl: String
    location: String
    nutrition: NutritionInput
    tags: [String!]
  }

  input NutritionInput {
    calories: Float
    protein: Float
    carbs: Float
    fat: Float
    fiber: Float
    sugar: Float
  }

  input RecipeInput {
    title: String!
    description: String
    imageUrl: String
    prepTime: Int!
    cookTime: Int!
    servings: Int!
    difficulty: String!
    mealType: MealType!
    ingredients: [RecipeIngredientInput!]!
    instructions: [String!]!
    nutrition: NutritionInput
    tags: [String!]
  }

  input RecipeIngredientInput {
    name: String!
    quantity: Float!
    unit: String!
    notes: String
  }

  input ShoppingItemInput {
    name: String!
    category: ProductCategory!
    quantity: Int!
    unit: String!
    priority: String!
    price: Float
    notes: String
  }

  input MenuInput {
    name: String!
    description: String
    startDate: Date!
    endDate: Date!
    meals: [MenuMealInput!]!
  }

  input MenuMealInput {
    date: Date!
    mealType: MealType!
    recipeId: String!
    servings: Int!
  }

  # Filtres et tri
  input ProductFilter {
    category: ProductCategory
    expirationStatus: ExpirationStatus
    search: String
    tags: [String!]
    minPrice: Float
    maxPrice: Float
    location: String
  }

  input RecipeFilter {
    mealType: MealType
    difficulty: String
    maxPrepTime: Int
    maxCookTime: Int
    search: String
    tags: [String!]
    minRating: Float
    ingredients: [String!]
  }

  enum SortOrder {
    ASC
    DESC
  }

  input ProductSort {
    field: String!
    order: SortOrder!
  }

  input RecipeSort {
    field: String!
    order: SortOrder!
  }

  # Pagination
  input PaginationInput {
    page: Int = 1
    limit: Int = 20
  }

  type PaginatedProducts {
    products: [Product!]!
    pagination: PaginationInfo!
  }

  type PaginatedRecipes {
    recipes: [Recipe!]!
    pagination: PaginationInfo!
  }

  type PaginationInfo {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
    hasNext: Boolean!
    hasPrev: Boolean!
  }

  # Queries
  type Query {
    # Produits
    products(
      filter: ProductFilter
      sort: ProductSort
      pagination: PaginationInput
    ): PaginatedProducts!
    
    product(id: ID!): Product
    
    productsByBarcode(barcode: String!): [Product!]!
    
    expiringProducts(days: Int = 7): [Product!]!
    
    # Recettes
    recipes(
      filter: RecipeFilter
      sort: RecipeSort
      pagination: PaginationInput
    ): PaginatedRecipes!
    
    recipe(id: ID!): Recipe
    
    suggestedRecipes(productIds: [ID!]!): [Recipe!]!
    
    # Shopping
    shoppingList: [ShoppingItem!]!
    
    # Menus
    menus: [Menu!]!
    menu(id: ID!): Menu
    currentMenu: Menu
    
    # Analytics
    analytics(
      startDate: Date
      endDate: Date
    ): Analytics!
    
    # Suggestions intelligentes
    smartSuggestions: JSON!
    
    # Recherche globale
    search(query: String!, limit: Int = 10): JSON!
  }

  # Mutations
  type Mutation {
    # Produits
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    bulkDeleteProducts(ids: [ID!]!): Boolean!
    
    # Recettes
    createRecipe(input: RecipeInput!): Recipe!
    updateRecipe(id: ID!, input: RecipeInput!): Recipe!
    deleteRecipe(id: ID!): Boolean!
    rateRecipe(id: ID!, rating: Int!, comment: String): Review!
    
    # Shopping
    addShoppingItem(input: ShoppingItemInput!): ShoppingItem!
    updateShoppingItem(id: ID!, input: ShoppingItemInput!): ShoppingItem!
    deleteShoppingItem(id: ID!): Boolean!
    markShoppingItemPurchased(id: ID!, purchased: Boolean!): ShoppingItem!
    clearShoppingList: Boolean!
    generateShoppingList(recipeIds: [ID!]!): [ShoppingItem!]!
    
    # Menus
    createMenu(input: MenuInput!): Menu!
    updateMenu(id: ID!, input: MenuInput!): Menu!
    deleteMenu(id: ID!): Boolean!
    
    # Actions intelligentes
    optimizeInventory: JSON!
    analyzeWaste: JSON!
    generateRecommendations: [String!]!
  }

  # Subscriptions
  type Subscription {
    productAdded: Product!
    productUpdated: Product!
    productDeleted: ID!
    
    recipeAdded: Recipe!
    recipeUpdated: Recipe!
    
    shoppingListUpdated: [ShoppingItem!]!
    
    expirationAlert: Product!
    
    analyticsUpdated: Analytics!
  }
`;