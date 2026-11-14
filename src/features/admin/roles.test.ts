import { describe, expect, it } from "vitest";

import { isAdminUser } from "./roles";

describe("isAdminUser", () => {
  it("accepts only role admin in app_metadata", () => {
    expect(isAdminUser({ app_metadata: { role: "admin" } })).toBe(true);
    expect(isAdminUser({ app_metadata: { role: "Admin" } })).toBe(false);
    expect(isAdminUser({ app_metadata: { roles: ["admin"] } })).toBe(false);
    expect(isAdminUser({ app_metadata: {} })).toBe(false);
    expect(isAdminUser(null)).toBe(false);
  });
});
