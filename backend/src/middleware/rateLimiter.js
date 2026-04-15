import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authenticated (write) actions.
 * Applied to POST / PUT / DELETE routes that require a valid JWT.
 *
 * Limits: 60 requests per 15-minute window per IP.
 * Exceeding the limit returns 429 Too Many Requests.
 */
export const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,  // Return rate-limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* legacy headers
  message: { error: 'Too many requests. Please try again later.' },
});

/**
 * Stricter rate limiter for read-only authenticated routes.
 * Limits: 120 requests per 15-minute window per IP.
 */
export const authenticatedReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
