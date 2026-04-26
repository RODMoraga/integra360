import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { listProductsQuerySchema } from "../dto/product.schema.js";
import { listProductFilters, listProducts } from "../services/product.service.js";

/**
 * Resolves the tenant company ID from the request.
 * Priority: `x-company-id` header > `companyId` query parameter > `1` (default).
 *
 * @param req - Express request.
 * @returns A positive integer company ID.
 */
function resolveCompanyId(req: Request): number {
  const fromHeader = Number(req.header("x-company-id"));
  const fromQuery = Number(req.query.companyId);

  if (Number.isInteger(fromHeader) && fromHeader > 0) {
    return fromHeader;
  }

  if (Number.isInteger(fromQuery) && fromQuery > 0) {
    return fromQuery;
  }

  return 1;
}

/**
 * GET /api/v1/products
 *
 * Parses and validates query parameters, then delegates to
 * {@link listProducts} and responds with **200 OK**.
 *
 * @param req - Express request.
 * @param res - Express response.
 */
export async function getProducts(req: Request, res: Response): Promise<void> {
  const companyId = resolveCompanyId(req);
  const query = listProductsQuerySchema.parse(req.query);
  const payload = await listProducts(companyId, query);

  res.status(StatusCodes.OK).json(payload);
}

/**
 * GET /api/v1/products/filters
 *
 * Returns available filter values (categories, brands) for the product
 * catalog of the resolved company.
 *
 * @param req - Express request.
 * @param res - Express response.
 */
export async function getProductFilters(req: Request, res: Response): Promise<void> {
  const companyId = resolveCompanyId(req);
  const payload = await listProductFilters(companyId);

  res.status(StatusCodes.OK).json(payload);
}
