import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { listProductsQuerySchema } from "../dto/product.schema.js";
import { listProductFilters, listProducts } from "../services/product.service.js";

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

export async function getProducts(req: Request, res: Response): Promise<void> {
  const companyId = resolveCompanyId(req);
  const query = listProductsQuerySchema.parse(req.query);
  const payload = await listProducts(companyId, query);

  res.status(StatusCodes.OK).json(payload);
}

export async function getProductFilters(req: Request, res: Response): Promise<void> {
  const companyId = resolveCompanyId(req);
  const payload = await listProductFilters(companyId);

  res.status(StatusCodes.OK).json(payload);
}
