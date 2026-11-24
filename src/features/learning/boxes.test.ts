import { describe, expect, it } from "vitest";

import { timeUntilDue } from "./boxes";

describe("timeUntilDue", () => {
  it("counts to 00:00 UTC of the due day", () => {
    expect(timeUntilDue("2026-11-23", new Date("2026-11-22T18:28:00Z"))).toEqual({ days: 0, hours: 5, minutes: 32 });
  });

  it("includes whole days", () => {
    expect(timeUntilDue("2026-11-25", new Date("2026-11-22T00:00:00Z"))).toEqual({ days: 3, hours: 0, minutes: 0 });
  });

  it("rounds a part minute up", () => {
    expect(timeUntilDue("2026-11-23", new Date("2026-11-22T23:59:30Z"))).toEqual({ days: 0, hours: 0, minutes: 1 });
  });

  it("is null once the word is due", () => {
    expect(timeUntilDue("2026-11-22", new Date("2026-11-22T00:00:00Z"))).toBeNull();
    expect(timeUntilDue("2026-11-20", new Date("2026-11-22T10:00:00Z"))).toBeNull();
  });
});
