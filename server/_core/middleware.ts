import { Request, Response, NextFunction } from "express";

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 * Limits requests to 100 per minute per IP
 */
export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const limit = 100;
  const windowMs = 60 * 1000; // 1 minute

  const record = rateLimitStore.get(ip);

  if (record && record.resetTime > now) {
    if (record.count >= limit) {
      res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }
    record.count++;
  } else {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
  }

  // Clean up old entries
  if (rateLimitStore.size > 10000) {
    const entries = Array.from(rateLimitStore.entries());
    entries.forEach(([key, value]) => {
      if (value.resetTime <= now) {
        rateLimitStore.delete(key);
      }
    });
  }

  next();
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  );

  // HSTS (HTTP Strict Transport Security)
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  next();
}

/**
 * CORS middleware
 */
export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "3600");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (duration > 1000) {
      console.warn("[Slow Request]", log);
    } else if (res.statusCode >= 400) {
      console.error("[Error Request]", log);
    } else {
      console.log("[Request]", log);
    }
  });

  next();
}

/**
 * Error handling middleware
 */
export function errorHandlingMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("[Error]", {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  // Don't expose internal error details to client
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? "Internal server error" : err.message;

  res.status(statusCode).json({
    error: message,
    code: err.code || "INTERNAL_ERROR",
  });
}

/**
 * Input validation middleware
 */
export function inputValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Sanitize request body
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }

  next();
}

/**
 * Recursively sanitize object to prevent XSS
 */
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      // Remove potentially dangerous characters
      obj[key] = obj[key]
        .replace(/[<>]/g, "")
        .substring(0, 10000); // Limit string length
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}
