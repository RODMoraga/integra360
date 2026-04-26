import { Router } from "express";
import { asyncHandler } from "../../../common/middleware/asyncHandler.js";
import { getProductFilters, getProducts } from "../controllers/product.controller.js";

export const productRoutes = Router();

/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: List products with filters, sorting and pagination
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, stock]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product list
 */
productRoutes.get("/", asyncHandler(getProducts));

/**
 * @openapi
 * /api/v1/products/filters:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get categories and brands for catalog filtering
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Available filter values
 */
productRoutes.get("/filters", asyncHandler(getProductFilters));
