import { z } from "zod";

export const productParamsSchema = z.object({
  productId: z.coerce.number().int().positive()
});

export const productImageParamsSchema = z.object({
  productId: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive()
});

export const createProductImageBodySchema = z.object({
  purpose: z.enum(["PRIMARY", "GALLERY", "THUMBNAIL", "DETAIL", "PACKAGING"]).optional(),
  altText: z.string().max(255).optional(),
  sortOrder: z.coerce.number().int().positive().optional(),
  isPrimary: z.union([z.boolean(), z.string()]).optional()
});

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

export type CreateProductImageBody = z.infer<typeof createProductImageBodySchema>;
export type UpdateProductImageBody = z.infer<typeof updateProductImageBodySchema>;
