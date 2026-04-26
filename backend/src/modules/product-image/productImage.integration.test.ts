import { afterAll, beforeAll, describe, expect, it } from "vitest";
import os from "node:os";
import path from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import jwt from "jsonwebtoken";
import request from "supertest";
import { prisma } from "../../database/prisma/client.js";

type ExpressApp = import("express").Express;

function asNumber(value: bigint | number): number {
  return typeof value === "bigint" ? Number(value) : value;
}

const runTag = Math.random().toString(36).slice(2, 10);
let app: ExpressApp;
let tokenAdmin: string;
let tokenUser: string;
let companyId = 0;
let productId = 0;
let uploadTempDir = "";
let imagePath = "";

describe.runIf(process.env.RUN_HTTP_INTEGRATION_TESTS === "true")("product-image HTTP integration", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "mysql://root:root@127.0.0.1:3306/integra360";
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "integration_access_secret_12345678901234567890";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "integration_refresh_secret_1234567890123456789";
    process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

    const appModule = await import("../../app.js");
    app = appModule.app;

    const regionCode = `RG_${runTag}`;
    const cityCode = `CT_${runTag}`;
    const communeCode = `CM_${runTag}`;
    const companyCode = `COMP_${runTag}`;
    const taxNumericPart = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-8);
    const taxId = `76${taxNumericPart}-1`;
    const adminEmail = `${runTag}.admin@integra360.local`;
    const userEmail = `${runTag}.user@integra360.local`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO regions (country_code, code, name) VALUES ('CL', '${regionCode}', 'Region ${runTag}')`
    );
    const regionRows = await prisma.$queryRawUnsafe<Array<{ id: bigint | number }>>(
      `SELECT id FROM regions WHERE country_code='CL' AND code='${regionCode}' LIMIT 1`
    );
    const regionId = asNumber(regionRows[0].id);

    await prisma.$executeRawUnsafe(
      `INSERT INTO cities (region_id, code, name) VALUES (${regionId}, '${cityCode}', 'City ${runTag}')`
    );
    const cityRows = await prisma.$queryRawUnsafe<Array<{ id: bigint | number }>>(
      `SELECT id FROM cities WHERE region_id=${regionId} AND code='${cityCode}' LIMIT 1`
    );
    const cityId = asNumber(cityRows[0].id);

    await prisma.$executeRawUnsafe(
      `INSERT INTO communes (city_id, code, name, postal_code) VALUES (${cityId}, '${communeCode}', 'Commune ${runTag}', '8320000')`
    );
    const communeRows = await prisma.$queryRawUnsafe<Array<{ id: bigint | number }>>(
      `SELECT id FROM communes WHERE city_id=${cityId} AND code='${communeCode}' LIMIT 1`
    );
    const communeId = asNumber(communeRows[0].id);

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO companies (code, legal_name, tax_id, timezone, currency_code, commune_id)
      VALUES ('${companyCode}', 'Company ${runTag}', '${taxId}', 'America/Santiago', 'CLP', ${communeId})
      `
    );
    const companyRows = await prisma.$queryRawUnsafe<Array<{ id: bigint | number }>>(
      `SELECT id FROM companies WHERE code='${companyCode}' LIMIT 1`
    );
    companyId = asNumber(companyRows[0].id);

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO users (company_id, full_name, email, password_hash)
      VALUES (${companyId}, 'Admin ${runTag}', '${adminEmail}', '$2a$10$seedhash')
      `
    );
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO users (company_id, full_name, email, password_hash)
      VALUES (${companyId}, 'User ${runTag}', '${userEmail}', '$2a$10$seedhash')
      `
    );

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO units_of_measure (company_id, code, name, symbol, unit_type, is_base_unit)
      VALUES (${companyId}, 'UN', 'Unidad', 'un', 'COUNT', 1)
      `
    );
    const uomRows = await prisma.$queryRawUnsafe<Array<{ id: bigint | number }>>(
      `SELECT id FROM units_of_measure WHERE company_id=${companyId} AND code='UN' LIMIT 1`
    );
    const baseUomId = asNumber(uomRows[0].id);

    const sku = `SKU_${runTag}`;
    const barcode = `780${String(Date.now()).slice(-10)}`;
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO products (company_id, sku, barcode, name, base_uom_id, tax_rate)
      VALUES (${companyId}, '${sku}', '${barcode}', 'Product ${runTag}', ${baseUomId}, 19.0000)
      `
    );
    const productRows = await prisma.$queryRawUnsafe<Array<{ id: bigint | number }>>(
      `SELECT id FROM products WHERE company_id=${companyId} AND sku='${sku}' LIMIT 1`
    );
    productId = asNumber(productRows[0].id);

    tokenAdmin = jwt.sign(
      { sub: 1, email: adminEmail, role: "ADMIN" },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: "15m" }
    );
    tokenUser = jwt.sign(
      { sub: 2, email: userEmail, role: "USER" },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: "15m" }
    );

    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlH0wAAAABJRU5ErkJggg==",
      "base64"
    );
    uploadTempDir = await mkdtemp(path.join(os.tmpdir(), "integra360-product-image-"));
    imagePath = path.join(uploadTempDir, "sample.png");
    await writeFile(imagePath, png1x1);
  });

  afterAll(async () => {
    if (companyId > 0) {
      await prisma.$executeRawUnsafe(`DELETE FROM product_images WHERE company_id=${companyId}`);
      await prisma.$executeRawUnsafe(`DELETE FROM digital_assets WHERE company_id=${companyId}`);
      await prisma.$executeRawUnsafe(`DELETE FROM products WHERE company_id=${companyId}`);
      await prisma.$executeRawUnsafe(`DELETE FROM units_of_measure WHERE company_id=${companyId}`);
      await prisma.$executeRawUnsafe(`DELETE FROM users WHERE company_id=${companyId}`);
      await prisma.$executeRawUnsafe(`DELETE FROM companies WHERE id=${companyId}`);
    }

    await prisma.$executeRawUnsafe(`DELETE FROM communes WHERE code='CM_${runTag}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM cities WHERE code='CT_${runTag}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM regions WHERE code='RG_${runTag}'`);

    await rm(path.join(process.cwd(), "uploads", "product-images", String(companyId)), {
      force: true,
      recursive: true
    }).catch(() => undefined);

    if (uploadTempDir) {
      await rm(uploadTempDir, { force: true, recursive: true }).catch(() => undefined);
    }

    await prisma.$disconnect();
  });

  it("runs full CRUD for product images and enforces role permissions", async () => {
    const listBefore = await request(app)
      .get(`/api/v1/products/${productId}/images`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .set("x-company-id", String(companyId));

    expect(listBefore.status).toBe(200);
    expect(listBefore.body).toEqual([]);

    const forbiddenPatch = await request(app)
      .patch(`/api/v1/products/${productId}/images/999999/primary`)
      .set("Authorization", `Bearer ${tokenUser}`)
      .set("x-company-id", String(companyId));

    expect(forbiddenPatch.status).toBe(403);
    expect(forbiddenPatch.body.message).toBe("Forbidden");

    const createResponse = await request(app)
      .post(`/api/v1/products/${productId}/images`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .set("x-company-id", String(companyId))
      .field("purpose", "GALLERY")
      .field("altText", "Vista frontal")
      .field("sortOrder", "1")
      .field("isPrimary", "true")
      .attach("image", imagePath);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.productId).toBe(productId);
    expect(createResponse.body.purpose).toBe("PRIMARY");
    expect(createResponse.body.isPrimary).toBe(true);
    expect(createResponse.body.asset.mimeType).toBe("image/png");

    const productStateAfterCreate = await prisma.$queryRawUnsafe<
      Array<{ thumbnailUrl: string | null; imageCount: number }>
    >(
      `
      SELECT thumbnail_url AS thumbnailUrl, image_count AS imageCount
      FROM products
      WHERE id = ${productId}
        AND company_id = ${companyId}
      LIMIT 1
      `
    );

    expect(productStateAfterCreate).toHaveLength(1);
    expect(productStateAfterCreate[0].imageCount).toBe(1);
    expect(productStateAfterCreate[0].thumbnailUrl).toContain(`/uploads/product-images/${companyId}/`);

    const imageId = createResponse.body.id as number;

    const patchResponse = await request(app)
      .patch(`/api/v1/products/${productId}/images/${imageId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .set("x-company-id", String(companyId))
      .send({ altText: "Portada actualizada", sortOrder: 2 });

    expect(patchResponse.status).toBe(204);

    const markPrimaryResponse = await request(app)
      .patch(`/api/v1/products/${productId}/images/${imageId}/primary`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .set("x-company-id", String(companyId));

    expect(markPrimaryResponse.status).toBe(204);

    const listAfterPatch = await request(app)
      .get(`/api/v1/products/${productId}/images`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .set("x-company-id", String(companyId));

    expect(listAfterPatch.status).toBe(200);
    expect(listAfterPatch.body).toHaveLength(1);
    expect(listAfterPatch.body[0].altText).toBe("Portada actualizada");
    expect(listAfterPatch.body[0].sortOrder).toBe(2);

    const deleteResponse = await request(app)
      .delete(`/api/v1/products/${productId}/images/${imageId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .set("x-company-id", String(companyId));

    expect(deleteResponse.status).toBe(204);

    const listAfterDelete = await request(app)
      .get(`/api/v1/products/${productId}/images`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .set("x-company-id", String(companyId));

    expect(listAfterDelete.status).toBe(200);
    expect(listAfterDelete.body).toEqual([]);

    const productStateAfterDelete = await prisma.$queryRawUnsafe<
      Array<{ thumbnailUrl: string | null; imageCount: number }>
    >(
      `
      SELECT thumbnail_url AS thumbnailUrl, image_count AS imageCount
      FROM products
      WHERE id = ${productId}
        AND company_id = ${companyId}
      LIMIT 1
      `
    );

    expect(productStateAfterDelete).toHaveLength(1);
    expect(productStateAfterDelete[0].imageCount).toBe(0);
    expect(productStateAfterDelete[0].thumbnailUrl).toBeNull();
  });
});
