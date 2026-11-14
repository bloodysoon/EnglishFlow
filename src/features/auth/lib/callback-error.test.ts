import { describe, expect, it } from "vitest";
import { parseCallbackError } from "./callback-error";

describe("parseCallbackError", () => {
  it("accepts known callback error codes", () => {
    expect(parseCallbackError("invalid_callback")).toBe("invalid_callback");
    expect(parseCallbackError("confirmation_failed")).toBe("confirmation_failed");
  });

  it("returns null when there is no error param", () => {
    expect(parseCallbackError(undefined)).toBeNull();
  });

  it("ignores unknown codes instead of echoing them", () => {
    expect(parseCallbackError("Your account is locked, call us")).toBeNull();
  });

  it("ignores inherited object keys", () => {
    expect(parseCallbackError("toString")).toBeNull();
    expect(parseCallbackError("__proto__")).toBeNull();
  });

  it("ignores repeated params", () => {
    expect(parseCallbackError(["invalid_callback", "confirmation_failed"])).toBeNull();
  });
});
