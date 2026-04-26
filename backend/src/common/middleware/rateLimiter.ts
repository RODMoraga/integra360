import type { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { StatusCodes } from "http-status-codes";

// Allow up to 120 requests per IP within a 60-second sliding window.
const limiter = new RateLimiterMemory({
  points: 120,
  duration: 60
});

/**
 * Express middleware that enforces a per-IP rate limit using an
 * in-memory token bucket (120 requests / 60 s).
 *
 * Responds with **429 Too Many Requests** when the limit is exceeded.
 *
 * @param req  - Express request; `req.ip` is used as the rate-limit key.
 * @param res  - Express response.
 * @param next - Forwards execution to the next middleware on success.
 */
export async function apiRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await limiter.consume(req.ip ?? "unknown");
    next();
  } catch {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      message: "Too many requests"
    });
  }
}
