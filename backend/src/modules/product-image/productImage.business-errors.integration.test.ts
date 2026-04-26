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
let companyId = 0;
let productId = 0;
let uploadTempDir = "";
let imagePath = "";
let textPath = "";

describe.runIf(process.env.RUN_HTTP_INTEGRATION_TESTS === "true")(
  "product-image HTTP integration business errors",
  () => {
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

      const png1x1 = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlH0wAAAABJRU5ErkJggg==",
        "base64"
      );
      uploadTempDir = await mkdtemp(path.join(os.tmpdir(), "integra360-product-image-errors-"));
      imagePath = path.join(uploadTempDir, "sample.png");
      textPath = path.join(uploadTempDir, "sample.txt");
      await writeFile(imagePath, png1x1);
      await writeFile(textPath, "not-an-image");
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

    it("rejects product inexistente, archivo no imagen y sortOrder duplicado", async () => {
      const notFoundListResponse = await request(app)
        .get(`/api/v1/products/${productId + 99999}/images`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .set("x-company-id", String(companyId));

      expect(notFoundListResponse.status).toBe(404);
      expect(notFoundListResponse.body.message).toBe("Product not found");

      const nonImageUploadResponse = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .set("x-company-id", String(companyId))
        .field("purpose", "GALLERY")
        .attach("image", textPath);

      expect(nonImageUploadResponse.status).toBe(400);
      expect(nonImageUploadResponse.body.message).toBe("Only image files are allowed");

      const firstCreateResponse = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .set("x-company-id", String(companyId))
        .field("purpose", "GALLERY")
        .field("sortOrder", "1")
        .attach("image", imagePath);

      expect(firstCreateResponse.status).toBe(201);

      const secondCreateResponse = await request(app)
        .post(`/api/v1/products/${productId}/images`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .set("x-company-id", String(companyId))
        .field("purpose", "DETAIL")
        .field("sortOrder", "1")
        .attach("image", imagePath);

      expect(secondCreateResponse.status).toBe(409);
      expect(secondCreateResponse.body.message).toBe("sortOrder already in use for this product");
    }, 15000);
  }
);
