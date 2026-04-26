import { describe, expect, it, vi } from "vitest";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/AppError.js";
import { requireRoles } from "./requireRole.js";

describe("requireRoles", () => {
  it("allows request when user role is in allowed list", () => {
    const middleware = requireRoles("ADMIN");
    const req = { auth: { role: "admin" } } as any;
    const next = vi.fn();

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("throws unauthorized when auth role is missing", () => {
    const middleware = requireRoles("ADMIN");
    const req = {} as any;

    const act = () => middleware(req, {} as any, vi.fn());

    expect(act).toThrow(AppError);
    expect(act).toThrow("Unauthorized");

    try {
      act();
    } catch (error) {
      expect((error as AppError).statusCode).toBe(StatusCodes.UNAUTHORIZED);
    }
  });

  it("throws forbidden when role is not allowed", () => {
    const middleware = requireRoles("ADMIN");
    const req = { auth: { role: "USER" } } as any;

    const act = () => middleware(req, {} as any, vi.fn());

    expect(act).toThrow(AppError);
    expect(act).toThrow("Forbidden");

    try {
      act();
    } catch (error) {
      expect((error as AppError).statusCode).toBe(StatusCodes.FORBIDDEN);
    }
  });

  it("allows SUPERADMIN even when route requires ADMIN", () => {
    const middleware = requireRoles("ADMIN");
    const req = { auth: { role: "SUPERADMIN" } } as any;
    const next = vi.fn();

    middleware(req, {} as any, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
