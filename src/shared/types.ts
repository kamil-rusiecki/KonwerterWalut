export type SourceCurrency = "USD" | "EUR";

export interface ParsedPrice {
  amount: number;
  sourceCurrency: SourceCurrency;
}

export type RateTable = Partial<Record<SourceCurrency, number>>;

export interface Conversion {
  originalAmount: number;
  sourceCurrency: SourceCurrency;
  rate: number;
  amountPln: number;
  formatted: string;
}

export interface GetRateRequest {
  type: "GET_RATE";
  currency: SourceCurrency;
}

export type GetRateResponse =
  | {
      ok: true;
      rate: number;
      effectiveDate: string;
    }
  | {
      ok: false;
      reason: "rate-unavailable" | "invalid-request";
      detail?: string;
    };
