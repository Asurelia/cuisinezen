import { ApolloServer } from 'apollo-server-functions';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';
import { PerformanceMonitoringPlugin } from './plugins/performance-monitoring';
import { CachePlugin } from './plugins/cache-plugin';
import { SecurityPlugin } from './plugins/security-plugin';
import { LoggingPlugin } from './plugins/logging-plugin';

// Configuration du serveur Apollo
export const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext,
  
  // Plugins pour l'optimisation et le monitoring
  plugins: [
    PerformanceMonitoringPlugin(),
    CachePlugin(),
    SecurityPlugin(),
    LoggingPlugin(),
  ],

  // Configuration du cache
  cache: 'bounded',
  
  // Configuration de production
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production',
  
  // Gestion des erreurs
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    
    // En production, ne pas exposer les détails des erreurs internes
    if (process.env.NODE_ENV === 'production') {
      if (error.message.startsWith('Database')) {
        return new Error('Erreur interne du serveur');
      }
    }
    
    return error;
  },

  // Configuration CORS
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://cuisinezen.app', 'https://www.cuisinezen.app']
      : true,
    credentials: true,
  },
});