import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.schema";

describe("registerSchema", () => {
  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "SecurePass123!",
    });

    expect(result.success).toBe(true);
  });

  it("should reject a short password", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "123",
    });

    expect(result.success).toBe(false);
  });

  it("should reject an invalid email", () => {
    const result = registerSchema.safeParse({
      email: "invalid-email",
      password: "SecurePass123!",
    });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "MyPassword123",
    });

    expect(result.success).toBe(true);
  });

  it("should reject an empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("should reject an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "MyPassword123",
    });

    expect(result.success).toBe(false);
  });
});
