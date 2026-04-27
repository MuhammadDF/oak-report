import { describe, expect, it } from "vitest";
import { formatCurrency } from "./format";

describe("formatCurrency", () => {
  it("formats usd currency values", () => {
    expect(formatCurrency("USD", 12.5)).toBe("$12.50");
  });
});
