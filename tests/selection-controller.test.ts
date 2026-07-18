import { describe, expect, it, vi } from "vitest";
import {
  CurrencySelectionController,
  type SelectionSnapshot,
  type TooltipPort
} from "../src/content/selection-controller";
import type { GetRateResponse } from "../src/shared/types";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

const snapshot = (text: string): SelectionSnapshot => ({
  text,
  rect: new DOMRect(10, 10, 40, 20)
});

function tooltipMock(): TooltipPort {
  return {
    showResult: vi.fn(),
    showError: vi.fn(),
    hide: vi.fn()
  };
}

describe("CurrencySelectionController", () => {
  it("ignores a response for an outdated selection", async () => {
    let selectedText = "$10";
    const first = deferred<GetRateResponse>();
    const second = deferred<GetRateResponse>();
    const requestRate = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const tooltip = tooltipMock();
    const controller = new CurrencySelectionController({
      tooltip,
      requestRate,
      copy: vi.fn(),
      currentSelectionText: () => selectedText
    });

    const firstHandle = controller.handle(snapshot("$10"));
    selectedText = "20 EUR";
    const secondHandle = controller.handle(snapshot("20 EUR"));
    first.resolve({ ok: true, rate: 4, effectiveDate: "2026-07-17" });
    await firstHandle;
    expect(tooltip.showResult).not.toHaveBeenCalled();

    second.resolve({ ok: true, rate: 4.2, effectiveDate: "2026-07-17" });
    await secondHandle;
    expect(tooltip.showResult).toHaveBeenCalledOnce();
  });

  it("shows a short error when no rate is available", async () => {
    const tooltip = tooltipMock();
    const controller = new CurrencySelectionController({
      tooltip,
      requestRate: vi.fn(async (): Promise<GetRateResponse> => ({
        ok: false,
        reason: "rate-unavailable",
        detail: "TypeError: offline"
      })),
      copy: vi.fn(),
      currentSelectionText: () => "$10"
    });

    await controller.handle(snapshot("$10"));
    expect(tooltip.showError).toHaveBeenCalledWith(
      expect.any(DOMRect),
      "TypeError: offline"
    );
  });

  it("does not request a rate for non-price text", async () => {
    const requestRate = vi.fn();
    const controller = new CurrencySelectionController({
      tooltip: tooltipMock(),
      requestRate,
      copy: vi.fn(),
      currentSelectionText: () => "price 10"
    });

    await controller.handle(snapshot("price 10"));
    expect(requestRate).not.toHaveBeenCalled();
  });
});
