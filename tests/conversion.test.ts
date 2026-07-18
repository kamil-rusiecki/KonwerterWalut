import { describe, expect, it } from "vitest";
import { convertToPln } from "../src/core/conversion";

describe("convertToPln", () => {
  it("converts without rounding the stored value", () => {
    const conversion = convertToPln(
      { amount: 19.99, sourceCurrency: "USD" },
      { USD: 3.9876 }
    );

    expect(conversion.amountPln).toBeCloseTo(79.712124);
    expect(conversion.formatted).toMatch(/79,71\s*zł/u);
  });

  it("formats negative values in PLN", () => {
    const conversion = convertToPln(
      { amount: -2.5, sourceCurrency: "EUR" },
      { EUR: 4.3 }
    );

    expect(conversion.amountPln).toBe(-10.75);
    expect(conversion.formatted).toMatch(/-10,75\s*zł/u);
  });

  it("rejects a missing or invalid rate", () => {
    expect(() =>
      convertToPln({ amount: 10, sourceCurrency: "USD" }, {})
    ).toThrow(/Brak prawidłowego kursu/u);
  });
});
