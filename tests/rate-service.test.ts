// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  FRESH_CACHE_MS,
  MAX_STALE_CACHE_MS,
  RateService
} from "../src/background/rate-service";

const NOW = Date.UTC(2026, 6, 17, 10);

function createStorage(initial?: unknown) {
  const data: Record<string, unknown> = {};
  if (initial !== undefined) {
    data.nbpRateCache = initial;
  }
  return {
    data,
    get: vi.fn(async () => ({ ...data })),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(data, items);
    })
  };
}

function cache(age: number) {
  return {
    effectiveDate: "2026-07-16",
    fetchedAt: NOW - age,
    rates: { USD: 3.7, EUR: 4.2 }
  };
}

function nbpResponse() {
  return new Response(
    JSON.stringify([
      {
        effectiveDate: "2026-07-17",
        rates: [
          { code: "USD", mid: 3.75 },
          { code: "EUR", mid: 4.25 }
        ]
      }
    ]),
    { status: 200 }
  );
}

describe("RateService", () => {
  it("uses fresh cached data without a request", async () => {
    const storage = createStorage(cache(FRESH_CACHE_MS - 1));
    const fetcher = vi.fn();
    const service = new RateService({
      storage,
      fetcher,
      now: () => NOW
    });

    await expect(service.getRate("USD")).resolves.toEqual({
      rate: 3.7,
      effectiveDate: "2026-07-16"
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refreshes expired data and persists the full table", async () => {
    const storage = createStorage(cache(FRESH_CACHE_MS + 1));
    const fetcher = vi.fn(async () => nbpResponse());
    const service = new RateService({
      storage,
      fetcher,
      now: () => NOW
    });

    await expect(service.getRate("EUR")).resolves.toEqual({
      rate: 4.25,
      effectiveDate: "2026-07-17"
    });
    expect(storage.set).toHaveBeenCalledOnce();
    expect(storage.data.nbpRateCache).toMatchObject({
      fetchedAt: NOW,
      rates: { USD: 3.75, EUR: 4.25 }
    });
  });

  it("falls back to stale data when refreshing fails", async () => {
    const storage = createStorage(cache(MAX_STALE_CACHE_MS - 1));
    const service = new RateService({
      storage,
      fetcher: vi.fn(async () => {
        throw new Error("offline");
      }),
      now: () => NOW
    });

    await expect(service.getRate("USD")).resolves.toEqual({
      rate: 3.7,
      effectiveDate: "2026-07-16"
    });
  });

  it("fails when neither the network nor an acceptable cache is available", async () => {
    const storage = createStorage(cache(MAX_STALE_CACHE_MS + 1));
    const service = new RateService({
      storage,
      fetcher: vi.fn(async () => {
        throw new Error("offline");
      }),
      now: () => NOW
    });

    await expect(service.getRate("USD")).rejects.toThrow("offline");
  });

  it("deduplicates simultaneous refreshes", async () => {
    const storage = createStorage();
    const fetcher = vi.fn(async () => nbpResponse());
    const service = new RateService({
      storage,
      fetcher,
      now: () => NOW
    });

    await Promise.all([service.getRate("USD"), service.getRate("EUR")]);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("binds the browser fetch implementation to its global object", async () => {
    const originalFetch = globalThis.fetch;
    const browserLikeFetch = vi.fn(function (this: unknown) {
      if (this !== globalThis) {
        throw new TypeError(
          "'fetch' called on an object that does not implement interface Window."
        );
      }
      return Promise.resolve(nbpResponse());
    }) as unknown as typeof fetch;
    globalThis.fetch = browserLikeFetch;

    try {
      const service = new RateService({
        storage: createStorage(),
        now: () => NOW
      });

      await expect(service.getRate("USD")).resolves.toEqual({
        rate: 3.75,
        effectiveDate: "2026-07-17"
      });
      expect(browserLikeFetch).toHaveBeenCalledOnce();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
