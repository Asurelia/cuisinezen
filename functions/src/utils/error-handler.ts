import * as functions from "firebase-functions";

/**
 * Gestionnaire d'erreurs centralisé pour optimiser le debugging et les coûts
 */

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Gestionnaire d'erreurs pour les fonctions HTTP
 */
export function handleHttpError(error: Error, req?: any) {
  console.error("Erreur HTTP:", {
    message: error.message,
    stack: error.stack,
    url: req?.url,
    method: req?.method,
    headers: req?.headers,
  });

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: true,
        code: error.code,
        message: error.message,
        ...(error.context && { context: error.context }),
      },
    };
  }

  // Erreur inconnue
  return {
    statusCode: 500,
    body: {
      error: true,
      code: ErrorCode.INTERNAL_ERROR,
      message: "Erreur interne du serveur",
    },
  };
}

/**
 * Gestionnaire d'erreurs pour les fonctions callable
 */
export function handleCallableError(error: Error, data?: any, context?: any) {
  console.error("Erreur Callable:", {
    message: error.message,
    stack: error.stack,
    data,
    userId: context?.auth?.uid,
  });

  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCode.VALIDATION_ERROR:
        throw new functions.https.HttpsError("invalid-argument", error.message);
      case ErrorCode.NOT_FOUND:
        throw new functions.https.HttpsError("not-found", error.message);
      case ErrorCode.PERMISSION_DENIED:
        throw new functions.https.HttpsError("permission-denied", error.message);
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        throw new functions.https.HttpsError("resource-exhausted", error.message);
      case ErrorCode.EXTERNAL_SERVICE_ERROR:
        throw new functions.https.HttpsError("unavailable", error.message);
      default:
        throw new functions.https.HttpsError("internal", error.message);
    }
  }

  // Erreur inconnue
  throw new functions.https.HttpsError("internal", "Erreur interne du serveur");
}

/**
 * Wrapper pour les fonctions HTTP avec gestion d'erreurs
 */
export function withErrorHandling(
  handler: (req: any, res: any) => Promise<void>
) {
  return async (req: any, res: any) => {
    try {
      await handler(req, res);
    } catch (error) {
      const { statusCode, body } = handleHttpError(error as Error, req);
      res.status(statusCode).json(body);
    }
  };
}

/**
 * Wrapper pour les fonctions callable avec gestion d'erreurs
 */
export function withCallableErrorHandling<T, R>(
  handler: (data: T, context: functions.https.CallableContext) => Promise<R>
) {
  return async (data: T, context: functions.https.CallableContext): Promise<R> => {
    try {
      return await handler(data, context);
    } catch (error) {
      handleCallableError(error as Error, data, context);
      throw error; // Ne devrait jamais être atteint
    }
  };
}

/**
 * Validation des données d'entrée
 */
export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length > 0) {
    throw new AppError(
      `Champs requis manquants: ${missing.join(", ")}`,
      ErrorCode.VALIDATION_ERROR,
      400,
      true,
      { missingFields: missing }
    );
  }
}

/**
 * Validation de l'authentification
 */
export function requireAuth(context: functions.https.CallableContext): void {
  if (!context.auth) {
    throw new AppError(
      "Authentification requise",
      ErrorCode.PERMISSION_DENIED,
      401
    );
  }
}

/**
 * Validation des permissions
 */
export function requirePermission(
  context: functions.https.CallableContext,
  requiredRole: string
): void {
  requireAuth(context);
  
  const userRole = context.auth?.token?.role;
  if (userRole !== requiredRole && userRole !== "admin") {
    throw new AppError(
      `Permission insuffisante. Rôle requis: ${requiredRole}`,
      ErrorCode.PERMISSION_DENIED,
      403,
      true,
      { requiredRole, userRole }
    );
  }
}

/**
 * Logger d'erreurs avec contexte
 */
export function logError(error: Error, context?: Record<string, any>): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context,
  };
  
  console.error("Application Error:", errorInfo);
  
  // En production, on pourrait envoyer vers un service de monitoring
  // comme Sentry, LogRocket, etc.
}

/**
 * Créer des erreurs spécifiques courantes
 */
export const createError = {
  notFound: (resource: string, id?: string) =>
    new AppError(
      `${resource} ${id ? `avec l'ID ${id}` : ""} non trouvé(e)`,
      ErrorCode.NOT_FOUND,
      404
    ),
    
  validation: (message: string, details?: Record<string, any>) =>
    new AppError(
      message,
      ErrorCode.VALIDATION_ERROR,
      400,
      true,
      details
    ),
    
  permission: (action: string) =>
    new AppError(
      `Permission refusée pour l'action: ${action}`,
      ErrorCode.PERMISSION_DENIED,
      403
    ),
    
  rateLimit: (retryAfter?: number) =>
    new AppError(
      "Limite de taux dépassée",
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      true,
      { retryAfter }
    ),
    
  external: (service: string, details?: string) =>
    new AppError(
      `Erreur du service externe: ${service}${details ? ` - ${details}` : ""}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      502
    ),
    
  database: (operation: string, details?: string) =>
    new AppError(
      `Erreur base de données lors de: ${operation}${details ? ` - ${details}` : ""}`,
      ErrorCode.DATABASE_ERROR,
      500
    ),
};

/**
 * Utilitaire pour retry automatique
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      console.warn(`Tentative ${attempt}/${maxRetries} échouée:`, error);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Attendre avant de réessayer (backoff exponentiel)
      await new Promise(resolve => 
        setTimeout(resolve, delayMs * Math.pow(2, attempt - 1))
      );
    }
  }
  
  throw lastError!;
}