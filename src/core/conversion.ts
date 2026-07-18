import type {
  Conversion,
  ParsedPrice,
  RateTable
} from "../shared/types";

const plnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function convertToPln(
  price: ParsedPrice,
  rates: RateTable
): Conversion {
  const rate = rates[price.sourceCurrency];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Brak prawidłowego kursu dla ${price.sourceCurrency}`);
  }

  const amountPln = price.amount * rate;
  return {
    originalAmount: price.amount,
    sourceCurrency: price.sourceCurrency,
    rate,
    amountPln,
    formatted: plnFormatter.format(amountPln)
  };
}
