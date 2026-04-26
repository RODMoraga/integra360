import { z } from "zod";

/** Path params schema that requires only a product ID. */
export const productParamsSchema = z.object({
  productId: z.coerce.number().int().positive()
});

/** Path params schema that requires both a product ID and an image ID. */
export const productImageParamsSchema = z.object({
  productId: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive()
});

/** Request body schema for uploading a new product image. */
export const createProductImageBodySchema = z.object({
  purpose: z.enum(["PRIMARY", "GALLERY", "THUMBNAIL", "DETAIL", "PACKAGING"]).optional(),
  altText: z.string().max(255).optional(),
  sortOrder: z.coerce.number().int().positive().optional(),
  isPrimary: z.union([z.boolean(), z.string()]).optional()
});

/**
 * Request body schema for patching product image metadata.
 * At least one field must be provided.
 */
export const updateProductImageBodySchema = z
  .object({
    purpose: z.enum(["PRIMARY", "GALLERY", "THUMBNAIL", "DETAIL", "PACKAGING"]).optional(),
    altText: z.string().max(255).nullable().optional(),
    sortOrder: z.coerce.number().int().positive().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

/** TypeScript type inferred from {@link createProductImageBodySchema}. */
export type CreateProductImageBody = z.infer<typeof createProductImageBodySchema>;
/** TypeScript type inferred from {@link updateProductImageBodySchema}. */
export type UpdateProductImageBody = z.infer<typeof updateProductImageBodySchema>;
