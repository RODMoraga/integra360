import type { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { StatusCodes } from "http-status-codes";

const limiter = new RateLimiterMemory({
  points: 120,
  duration: 60
});

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
