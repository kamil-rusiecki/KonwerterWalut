import { describe, expect, it } from "vitest";
import { parsePrice } from "../src/core/parse-price";

describe("parsePrice", () => {
  it.each([
    ["$19.99", { amount: 19.99, sourceCurrency: "USD" }],
    ["19,99 USD", { amount: 19.99, sourceCurrency: "USD" }],
    ["US$ 1,200.50", { amount: 1200.5, sourceCurrency: "USD" }],
    ["EUR 1.234,56", { amount: 1234.56, sourceCurrency: "EUR" }],
    ["25 €", { amount: 25, sourceCurrency: "EUR" }],
    ["1\u00a0234,50 EUR", { amount: 1234.5, sourceCurrency: "EUR" }],
    ["1\u202f234.50 USD", { amount: 1234.5, sourceCurrency: "USD" }],
    ["USD 1'234.50", { amount: 1234.5, sourceCurrency: "USD" }],
    ["-$5.25", { amount: -5.25, sourceCurrency: "USD" }],
    ["EUR -2,50", { amount: -2.5, sourceCurrency: "EUR" }],
    ["$1,234", { amount: 1234, sourceCurrency: "USD" }],
    ["1.234 EUR", { amount: 1234, sourceCurrency: "EUR" }]
  ])("parses %s", (selection, expected) => {
    expect(parsePrice(selection)).toEqual(expected);
  });

  it.each([
    "19.99",
    "Cena: $19.99",
    "$10–$20",
    "$10 $20",
    "USD $10",
    "12 34 EUR",
    "1,23,4 USD",
    "1.234,567 EUR",
    "--$5",
    "",
    "PLN 20"
  ])("rejects %s", (selection) => {
    expect(parsePrice(selection)).toBeNull();
  });
});
