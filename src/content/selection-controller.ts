import { convertToPln } from "../core/conversion";
import { parsePrice } from "../core/parse-price";
import type {
  GetRateResponse,
  ParsedPrice
} from "../shared/types";

export interface SelectionSnapshot {
  text: string;
  rect: DOMRect;
}

export interface TooltipPort {
  showResult(
    result: {
      formatted: string;
      effectiveDate: string;
      copy: (text: string) => Promise<void>;
    },
    rect: DOMRect
  ): void;
  showError(rect: DOMRect, detail?: string): void;
  hide(): void;
}

export interface SelectionControllerDependencies {
  tooltip: TooltipPort;
  requestRate: (
    currency: ParsedPrice["sourceCurrency"]
  ) => Promise<GetRateResponse>;
  copy: (text: string) => Promise<void>;
  currentSelectionText: () => string;
}

export class CurrencySelectionController {
  private requestId = 0;

  constructor(private readonly dependencies: SelectionControllerDependencies) {}

  invalidate(): void {
    this.requestId += 1;
    this.dependencies.tooltip.hide();
  }

  async handle(snapshot: SelectionSnapshot | null): Promise<void> {
    const requestId = ++this.requestId;
    if (!snapshot) {
      this.dependencies.tooltip.hide();
      return;
    }

    const price = parsePrice(snapshot.text);
    if (!price) {
      this.dependencies.tooltip.hide();
      return;
    }

    let response: GetRateResponse;
    try {
      response = await this.dependencies.requestRate(price.sourceCurrency);
    } catch {
      response = { ok: false, reason: "rate-unavailable" };
    }

    if (
      requestId !== this.requestId ||
      this.dependencies.currentSelectionText().trim() !== snapshot.text.trim()
    ) {
      return;
    }

    if (!response.ok) {
      this.dependencies.tooltip.showError(snapshot.rect, response.detail);
      return;
    }

    const conversion = convertToPln(price, {
      [price.sourceCurrency]: response.rate
    });
    this.dependencies.tooltip.showResult(
      {
        formatted: conversion.formatted,
        effectiveDate: response.effectiveDate,
        copy: this.dependencies.copy
      },
      snapshot.rect
    );
  }
}
