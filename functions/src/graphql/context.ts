import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { RateLimiterService } from '../services/rate-limiter.service';

export interface Context {
  req: Request;
  userId: string;
  user: any;
  dataSources: any;
  rateLimiter: RateLimiterService;
}

export const createContext = async ({ req }: { req: Request }): Promise<Context> => {
  // Extraction du token d'authentification
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Token d\'authentification requis');
  }

  try {
    // Vérification du token Firebase
    const decodedToken = await AuthService.verifyToken(token);
    const user = await AuthService.getUser(decodedToken.uid);
    
    // Vérification du rate limiting
    const rateLimiter = new RateLimiterService();
    await rateLimiter.checkLimit(decodedToken.uid, req.ip);

    return {
      req,
      userId: decodedToken.uid,
      user,
      dataSources: {
        // Ici on peut ajouter des data sources personnalisées
      },
      rateLimiter,
    };
  } catch (error) {
    throw new Error('Token d\'authentification invalide');
  }
};