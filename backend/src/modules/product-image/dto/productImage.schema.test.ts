import { describe, expect, it } from "vitest";
import {
  createProductImageBodySchema,
  productImageParamsSchema,
  productParamsSchema,
  updateProductImageBodySchema
} from "./productImage.schema.js";

describe("productImage schemas", () => {
  it("parses valid product and image params", () => {
    const productParams = productParamsSchema.parse({ productId: "10" });
    const imageParams = productImageParamsSchema.parse({ productId: "10", imageId: "7" });

    expect(productParams.productId).toBe(10);
    expect(imageParams.productId).toBe(10);
    expect(imageParams.imageId).toBe(7);
  });

  it("rejects invalid params", () => {
    expect(() => productParamsSchema.parse({ productId: "0" })).toThrow();
    expect(() => productImageParamsSchema.parse({ productId: "1", imageId: "-2" })).toThrow();
  });

  it("parses create payload and coercions", () => {
    const payload = createProductImageBodySchema.parse({
      purpose: "GALLERY",
      altText: "Vista frontal",
      sortOrder: "3",
      isPrimary: "true"
    });

    expect(payload.purpose).toBe("GALLERY");
    expect(payload.altText).toBe("Vista frontal");
    expect(payload.sortOrder).toBe(3);
    expect(payload.isPrimary).toBe("true");
  });

  it("rejects create payload with invalid enum or sortOrder", () => {
    expect(() => createProductImageBodySchema.parse({ purpose: "ICON" })).toThrow();
    expect(() => createProductImageBodySchema.parse({ sortOrder: 0 })).toThrow();
  });

  it("parses update payload with nullable altText", () => {
    const payload = updateProductImageBodySchema.parse({
      altText: null,
      sortOrder: "4",
      isActive: "false"
    });

    expect(payload.altText).toBeNull();
    expect(payload.sortOrder).toBe(4);
    expect(payload.isActive).toBe("false");
  });

  it("rejects empty update payload", () => {
    expect(() => updateProductImageBodySchema.parse({})).toThrow("At least one field is required");
  });
});
