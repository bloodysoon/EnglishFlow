import { describe, expect, it } from "vitest";
import { getCallbackErrorMessage } from "./callback-error";

describe("getCallbackErrorMessage", () => {
  it("returns a message for known callback error codes", () => {
    expect(getCallbackErrorMessage("invalid_callback")).toMatch(/incomplete/);
    expect(getCallbackErrorMessage("confirmation_failed")).toMatch(/expired/);
  });

  it("returns null when there is no error param", () => {
    expect(getCallbackErrorMessage(undefined)).toBeNull();
  });

  it("ignores unknown codes instead of echoing them", () => {
    expect(getCallbackErrorMessage("Your account is locked, call us")).toBeNull();
  });

  it("ignores inherited object keys", () => {
    expect(getCallbackErrorMessage("toString")).toBeNull();
    expect(getCallbackErrorMessage("__proto__")).toBeNull();
  });

  it("ignores repeated params", () => {
    expect(
      getCallbackErrorMessage(["invalid_callback", "confirmation_failed"]),
    ).toBeNull();
  });
});
