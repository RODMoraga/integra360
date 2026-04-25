import { z } from "zod";

export const listProductsQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  categoryId: z.coerce.number().int().positive().optional(),
  brandId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(60).optional().default(9),
  sortBy: z.enum(["name", "price", "stock"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc")
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
