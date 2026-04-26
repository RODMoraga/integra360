import type { NextFunction, Request, RequestHandler, Response } from "express";

/** An Express route handler that returns a Promise. */
type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async Express route handler so that any rejected promise is
 * forwarded to the next error-handling middleware instead of causing an
 * unhandled rejection.
 *
 * @param handler - The async route handler to wrap.
 * @returns A standard synchronous `RequestHandler` safe for Express routing.
 *
 * @example
 * router.get("/", asyncHandler(async (req, res) => {
 *   const data = await someService.fetch();
 *   res.json(data);
 * }));
 */
export function asyncHandler(handler: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}