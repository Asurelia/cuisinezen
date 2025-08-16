import { ProductResolvers } from './product.resolvers';
import { RecipeResolvers } from './recipe.resolvers';
import { ShoppingResolvers } from './shopping.resolvers';
import { MenuResolvers } from './menu.resolvers';
import { AnalyticsResolvers } from './analytics.resolvers';
import { SearchResolvers } from './search.resolvers';
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

// Scalars personnalisés
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return new Date(value).toISOString();
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value;
  },
  parseValue(value: any) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value);
    }
    return null;
  },
});

export const resolvers = {
  // Scalars
  Date: DateScalar,
  JSON: JSONScalar,

  // Queries
  Query: {
    ...ProductResolvers.Query,
    ...RecipeResolvers.Query,
    ...ShoppingResolvers.Query,
    ...MenuResolvers.Query,
    ...AnalyticsResolvers.Query,
    ...SearchResolvers.Query,
  },

  // Mutations
  Mutation: {
    ...ProductResolvers.Mutation,
    ...RecipeResolvers.Mutation,
    ...ShoppingResolvers.Mutation,
    ...MenuResolvers.Mutation,
    ...AnalyticsResolvers.Mutation,
  },

  // Subscriptions
  Subscription: {
    ...ProductResolvers.Subscription,
    ...RecipeResolvers.Subscription,
    ...ShoppingResolvers.Subscription,
    ...AnalyticsResolvers.Subscription,
  },

  // Types avec relations
  Product: ProductResolvers.Product,
  Recipe: RecipeResolvers.Recipe,
  Menu: MenuResolvers.Menu,
  Analytics: AnalyticsResolvers.Analytics,
};