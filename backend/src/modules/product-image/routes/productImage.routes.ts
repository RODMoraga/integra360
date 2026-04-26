import { Router } from "express";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { StatusCodes } from "http-status-codes";
import multer from "multer";
import { AppError } from "../../../common/errors/AppError.js";
import { asyncHandler } from "../../../common/middleware/asyncHandler.js";
import { authGuard } from "../../../common/middleware/authGuard.js";
import { requireRoles } from "../../../common/middleware/requireRole.js";
import {
  getProductImages,
  markPrimaryProductImage,
  patchProductImage,
  removeProductImage,
  uploadProductImage
} from "../controllers/productImage.controller.js";

const uploadRoot = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const companyId = Number(req.header("x-company-id"));
    if (!Number.isInteger(companyId) || companyId <= 0) {
      cb(new AppError("x-company-id header is required", StatusCodes.BAD_REQUEST), "");
      return;
    }

    const destination = path.join(uploadRoot, "product-images", String(companyId));

    mkdirSync(destination, { recursive: true });
    cb(null, destination);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new AppError("Only image files are allowed", StatusCodes.BAD_REQUEST));
      return;
    }

    cb(null, true);
  }
});

export const productImageRoutes = Router();

/**
 * @openapi
 * /api/v1/products/{productId}/images:
 *   get:
 *     tags:
 *       - Product Images
 *     summary: List product images
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: header
 *         name: x-company-id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product images
 */
productImageRoutes.get("/:productId/images", authGuard, asyncHandler(getProductImages));

/**
 * @openapi
 * /api/v1/products/{productId}/images:
 *   post:
 *     tags:
 *       - Product Images
 *     summary: Upload image for product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: header
 *         name: x-company-id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               purpose:
 *                 type: string
 *                 enum: [PRIMARY, GALLERY, THUMBNAIL, DETAIL, PACKAGING]
 *               altText:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Product image created
 */
productImageRoutes.post(
  "/:productId/images",
  authGuard,
  requireRoles("ADMIN"),
  upload.single("image"),
  asyncHandler(uploadProductImage)
);

/**
 * @openapi
 * /api/v1/products/{productId}/images/{imageId}:
 *   patch:
 *     tags:
 *       - Product Images
 *     summary: Update product image metadata
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Updated
 */
productImageRoutes.patch(
  "/:productId/images/:imageId",
  authGuard,
  requireRoles("ADMIN"),
  asyncHandler(patchProductImage)
);

/**
 * @openapi
 * /api/v1/products/{productId}/images/{imageId}/primary:
 *   patch:
 *     tags:
 *       - Product Images
 *     summary: Mark image as primary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Primary updated
 */
productImageRoutes.patch(
  "/:productId/images/:imageId/primary",
  authGuard,
  requireRoles("ADMIN"),
  asyncHandler(markPrimaryProductImage)
);

/**
 * @openapi
 * /api/v1/products/{productId}/images/{imageId}:
 *   delete:
 *     tags:
 *       - Product Images
 *     summary: Delete product image
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Deleted
 */
productImageRoutes.delete(
  "/:productId/images/:imageId",
  authGuard,
  requireRoles("ADMIN"),
  asyncHandler(removeProductImage)
);
