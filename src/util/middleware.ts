import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { createRequestLogger } from "./logging";

// Extend Express Request to include requestId and logger
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      logger?: ReturnType<typeof createRequestLogger>;
    }
  }
}

// Simple request ID generator using crypto (built-in Node.js)
const generateRequestId = (): string => {
  return `${Date.now()}-${randomBytes(4).toString('hex')}`;
};

/**
 * Middleware to generate and attach a request ID to each request
 * Also attaches a child logger with the request ID for easy tracking
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate or use existing request ID from headers (for tracing across services)
  const requestId = (req.headers["x-request-id"] as string) || generateRequestId();
  req.requestId = requestId;
  
  // Attach child logger with request ID
  req.logger = createRequestLogger(requestId, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Add request ID to response headers for client tracking
  res.setHeader("X-Request-Id", requestId);

  next();
};

/**
 * Error logging middleware - should be used after routes
 */
export const errorLoggingMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger = req.logger || createRequestLogger(req.requestId || "unknown");
  
  logger.error({
    message: "Unhandled error in request",
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  next(err);
};

