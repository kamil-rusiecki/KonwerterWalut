import type { SourceCurrency } from "./types";

export interface CurrencyDefinition {
  code: SourceCurrency;
  markers: readonly string[];
}

export const CURRENCIES: readonly CurrencyDefinition[] = [
  { code: "USD", markers: ["US$", "USD", "$"] },
  { code: "EUR", markers: ["EUR", "€"] }
];

const MARKERS = CURRENCIES.flatMap((currency) =>
  currency.markers.map((marker) => [marker.toUpperCase(), currency.code] as const)
);

export const CURRENCY_BY_MARKER = new Map<string, SourceCurrency>(MARKERS);
