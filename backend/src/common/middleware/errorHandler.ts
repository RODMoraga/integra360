import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { MulterError } from "multer";
import { AppError } from "../errors/AppError.js";
import { logger } from "../logger/logger.js";

/**
 * Central Express error-handling middleware.
 *
 * Intercepts all errors forwarded via `next(error)` and maps them to
 * appropriate HTTP responses:
 *
 * | Error type   | Status | Notes                         |
 * |--------------|--------|-------------------------------|
 * | `ZodError`   | 400    | Validation failure with details |
 * | `AppError`   | varies | Uses `error.statusCode`       |
 * | `MulterError`| 400    | File upload error             |
 * | Unknown      | 500    | Logs the error via Pino       |
 *
 * @param error - The error thrown or passed to `next()`.
 * @param _req  - Express request (unused).
 * @param res   - Express response used to send the JSON body.
 * @param _next - Next function (required by Express for 4-argument signature).
 */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation error",
      details: error.flatten()
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  if (error instanceof MulterError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message
    });
    return;
  }

  logger.error({ err: error }, "Unexpected server error");

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error"
  });
}
