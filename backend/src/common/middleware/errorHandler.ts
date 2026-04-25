import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/AppError.js";
import { logger } from "../logger/logger.js";

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

  logger.error({ err: error }, "Unexpected server error");

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error"
  });
}
