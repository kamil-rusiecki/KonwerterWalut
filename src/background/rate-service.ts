import type { SourceCurrency } from "../shared/types";

export const FRESH_CACHE_MS = 12 * 60 * 60 * 1000;
export const MAX_STALE_CACHE_MS = 7 * 24 * 60 * 60 * 1000;
export const NBP_TABLE_URL =
  "https://api.nbp.pl/api/exchangerates/tables/a/?format=json";

const CACHE_KEY = "nbpRateCache";

export interface RateCache {
  effectiveDate: string;
  fetchedAt: number;
  rates: Record<string, number>;
}

interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

interface NbpRate {
  code?: unknown;
  mid?: unknown;
}

interface NbpTable {
  effectiveDate?: unknown;
  rates?: unknown;
}

export class RateUnavailableError extends Error {
  constructor() {
    super("Nie udało się pobrać aktualnego kursu.");
    this.name = "RateUnavailableError";
  }
}

export interface RateServiceDependencies {
  storage: StorageArea;
  fetcher?: typeof fetch;
  now?: () => number;
}

export class RateService {
  private readonly storage: StorageArea;
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private refreshPromise: Promise<RateCache> | null = null;

  constructor({
    storage,
    fetcher,
    now = Date.now
  }: RateServiceDependencies) {
    this.storage = storage;
    this.fetcher = fetcher ?? globalThis.fetch.bind(globalThis);
    this.now = now;
  }

  async getRate(
    currency: SourceCurrency
  ): Promise<{ rate: number; effectiveDate: string }> {
    const cache = await this.readCache();
    if (cache && this.isUsable(cache, FRESH_CACHE_MS, currency)) {
      return this.fromCache(cache, currency);
    }

    try {
      const refreshed = await this.refresh();
      return this.fromCache(refreshed, currency);
    } catch (error) {
      if (
        cache &&
        this.isUsable(cache, MAX_STALE_CACHE_MS, currency)
      ) {
        return this.fromCache(cache, currency);
      }
      throw error instanceof Error ? error : new RateUnavailableError();
    }
  }

  private async readCache(): Promise<RateCache | null> {
    try {
      const stored = await this.storage.get(CACHE_KEY);
      const candidate = stored[CACHE_KEY];
      return isRateCache(candidate) ? candidate : null;
    } catch {
      return null;
    }
  }

  private isUsable(
    cache: RateCache,
    maxAge: number,
    currency: SourceCurrency
  ): boolean {
    const age = this.now() - cache.fetchedAt;
    const rate = cache.rates[currency];
    return age >= 0 && age <= maxAge && isPositiveNumber(rate);
  }

  private fromCache(
    cache: RateCache,
    currency: SourceCurrency
  ): { rate: number; effectiveDate: string } {
    const rate = cache.rates[currency];
    if (!isPositiveNumber(rate)) {
      throw new RateUnavailableError();
    }
    return { rate, effectiveDate: cache.effectiveDate };
  }

  private refresh(): Promise<RateCache> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.fetchTable().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async fetchTable(): Promise<RateCache> {
    const response = await this.fetcher(NBP_TABLE_URL, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new RateUnavailableError();
    }

    const payload: unknown = await response.json();
    const table = parseNbpTable(payload, this.now());
    await this.storage.set({ [CACHE_KEY]: table });
    return table;
  }
}

function parseNbpTable(payload: unknown, fetchedAt: number): RateCache {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new RateUnavailableError();
  }

  const table = payload[0] as NbpTable;
  if (
    typeof table.effectiveDate !== "string" ||
    !Array.isArray(table.rates)
  ) {
    throw new RateUnavailableError();
  }

  const rates: Record<string, number> = {};
  for (const entry of table.rates as NbpRate[]) {
    if (
      typeof entry.code === "string" &&
      isPositiveNumber(entry.mid)
    ) {
      rates[entry.code.toUpperCase()] = entry.mid;
    }
  }

  if (!isPositiveNumber(rates.USD) || !isPositiveNumber(rates.EUR)) {
    throw new RateUnavailableError();
  }

  return { effectiveDate: table.effectiveDate, fetchedAt, rates };
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isRateCache(value: unknown): value is RateCache {
  if (!value || typeof value !== "object") {
    return false;
  }

  const cache = value as Partial<RateCache>;
  return (
    typeof cache.effectiveDate === "string" &&
    typeof cache.fetchedAt === "number" &&
    !!cache.rates &&
    typeof cache.rates === "object"
  );
}
