import type { Request, Response } from "express";
import path from "node:path";
import { unlink } from "node:fs/promises";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../../common/errors/AppError.js";
import {
  createProductImageBodySchema,
  productImageParamsSchema,
  productParamsSchema,
  updateProductImageBodySchema
} from "../dto/productImage.schema.js";
import {
  createProductImage,
  deleteProductImage,
  listProductImages,
  setPrimaryProductImage,
  updateProductImage
} from "../services/productImage.service.js";

/**
 * Extracts and validates the `x-company-id` header from the request.
 *
 * @param req - Express request.
 * @returns The company ID as a positive integer.
 * @throws {AppError} 400 Bad Request if the header is absent or not a valid integer.
 */
function getCompanyId(req: Request): number {
  const raw = req.header("x-company-id");
  const companyId = Number(raw);

  if (!raw || Number.isNaN(companyId) || !Number.isInteger(companyId) || companyId <= 0) {
    throw new AppError("x-company-id header is required", StatusCodes.BAD_REQUEST);
  }

  return companyId;
}

/**
 * Coerces a boolean-like value to a native `boolean`.
 * Accepts actual booleans, `"true"` / `"1"` / `"yes"` / `"si"` as truthy,
 * and `"false"` / `"0"` / `"no"` as falsy.
 *
 * @param value    - The value to coerce.
 * @param fallback - Default value when the input is undefined or unrecognised.
 */
function toBoolean(value: boolean | string | undefined, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "si"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

/**
 * POST /api/v1/products/:productId/images
 *
 * Handles multipart image uploads. Validates the uploaded file and request
 * body, persists the image record via {@link createProductImage}, and
 * responds with **201 Created**.
 * If the database write fails the uploaded file is removed from disk.
 *
 * @param req - Express request with a Multer-processed file at `req.file`.
 * @param res - Express response.
 * @throws {AppError} 400 if no file was attached to the `"image"` field.
 */
export async function uploadProductImage(req: Request, res: Response): Promise<void> {
  const companyId = getCompanyId(req);
  const { productId } = productParamsSchema.parse(req.params);
  const body = createProductImageBodySchema.parse(req.body);

  if (!req.file) {
    throw new AppError("Image file is required in field 'image'", StatusCodes.BAD_REQUEST);
  }

  const extension = path.extname(req.file.originalname).replace(".", "").toLowerCase() || undefined;
  const storageKey = path.posix.join("product-images", String(companyId), req.file.filename);
  const publicUrl = `/uploads/${storageKey}`;

  const uploadedPath = req.file.path;

  try {
    const created = await createProductImage({
      companyId,
      productId,
      purpose: body.purpose ?? "GALLERY",
      altText: body.altText,
      sortOrder: body.sortOrder,
      isPrimary: toBoolean(body.isPrimary, false),
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      extension,
      sizeBytes: req.file.size,
      storageDisk: "local",
      storageKey,
      publicUrl
    });

    res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    await unlink(uploadedPath).catch(() => undefined);
    throw error;
  }
}

/**
 * GET /api/v1/products/:productId/images
 *
 * Lists all active images for a product. Delegates to
 * {@link listProductImages} and responds with **200 OK**.
 *
 * @param req - Express request.
 * @param res - Express response.
 */
export async function getProductImages(req: Request, res: Response): Promise<void> {
  const companyId = getCompanyId(req);
  const { productId } = productParamsSchema.parse(req.params);

  const images = await listProductImages(companyId, productId);
  res.status(StatusCodes.OK).json(images);
}

/**
 * PATCH /api/v1/products/:productId/images/:imageId
 *
 * Updates image metadata fields. Delegates to {@link updateProductImage}
 * and responds with **204 No Content**.
 *
 * @param req - Express request.
 * @param res - Express response.
 */
export async function patchProductImage(req: Request, res: Response): Promise<void> {
  const companyId = getCompanyId(req);
  const { productId, imageId } = productImageParamsSchema.parse(req.params);
  const payload = updateProductImageBodySchema.parse(req.body);

  await updateProductImage({
    companyId,
    productId,
    imageId,
    purpose: payload.purpose,
    altText: payload.altText,
    sortOrder: payload.sortOrder,
    isActive: payload.isActive !== undefined ? toBoolean(payload.isActive) : undefined
  });

  res.status(StatusCodes.NO_CONTENT).send();
}

/**
 * PATCH /api/v1/products/:productId/images/:imageId/primary
 *
 * Promotes the specified image to be the primary image for the product.
 * Delegates to {@link setPrimaryProductImage} and responds with
 * **204 No Content**.
 *
 * @param req - Express request.
 * @param res - Express response.
 */
export async function markPrimaryProductImage(req: Request, res: Response): Promise<void> {
  const companyId = getCompanyId(req);
  const { productId, imageId } = productImageParamsSchema.parse(req.params);

  await setPrimaryProductImage(companyId, productId, imageId);
  res.status(StatusCodes.NO_CONTENT).send();
}

/**
 * DELETE /api/v1/products/:productId/images/:imageId
 *
 * Removes the product image record from the database and, when it is the
 * last reference to the underlying digital asset, deletes the file from
 * local disk storage. Responds with **204 No Content**.
 *
 * @param req - Express request.
 * @param res - Express response.
 */
export async function removeProductImage(req: Request, res: Response): Promise<void> {
  const companyId = getCompanyId(req);
  const { productId, imageId } = productImageParamsSchema.parse(req.params);

  const removed = await deleteProductImage(companyId, productId, imageId);

  if (removed.deleteLocalFile && removed.storageKey) {
    const localPath = path.join(process.cwd(), "uploads", ...removed.storageKey.split("/"));
    await unlink(localPath).catch(() => undefined);
  }

  res.status(StatusCodes.NO_CONTENT).send();
}
