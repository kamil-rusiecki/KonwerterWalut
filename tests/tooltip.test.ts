import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConversionTooltip } from "../src/content/tooltip";

function rect(
  left: number,
  top: number,
  width = 40,
  height = 20
): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({})
  };
}

describe("ConversionTooltip", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.head.replaceChildren();
    document.documentElement
      .querySelectorAll("[data-currency-converter-tooltip]")
      .forEach((element) => element.remove());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mounts in a shadow root and positions above the selection", () => {
    const tooltip = new ConversionTooltip(document, window);
    tooltip.showResult(
      {
        formatted: "79,71 zł",
        effectiveDate: "2026-07-17",
        copy: vi.fn()
      },
      rect(200, 100)
    );

    const host = document.querySelector<HTMLDivElement>(
      "[data-currency-converter-tooltip]"
    );
    expect(host?.shadowRoot?.querySelector("button")?.textContent).toBe(
      "79,71 zł"
    );
    expect(host?.style.top).toBe("58px");
  });

  it("flips below and clamps horizontally near the viewport edge", () => {
    const tooltip = new ConversionTooltip(document, window);
    tooltip.showError(rect(-20, 2), "TypeError: przykład");

    const host = document.querySelector<HTMLDivElement>(
      "[data-currency-converter-tooltip]"
    );
    expect(host?.style.left).toBe("8px");
    expect(host?.style.top).toBe("30px");
    expect(
      host?.shadowRoot?.querySelector<HTMLButtonElement>("button")?.title
    ).toContain("TypeError: przykład");
  });

  it("copies the result when clicked and confirms the action", async () => {
    vi.useFakeTimers();
    const copy = vi.fn(async () => undefined);
    const tooltip = new ConversionTooltip(document, window);
    tooltip.showResult(
      {
        formatted: "79,71 zł",
        effectiveDate: "2026-07-17",
        copy
      },
      rect(100, 100)
    );

    const button = document
      .querySelector<HTMLDivElement>("[data-currency-converter-tooltip]")
      ?.shadowRoot?.querySelector<HTMLButtonElement>("button");
    button?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(copy).toHaveBeenCalledWith("79,71 zł");
    expect(button?.textContent).toBe("Skopiowano");
    vi.advanceTimersByTime(900);
    expect(button?.textContent).toBe("79,71 zł");
  });

  it("removes itself when hidden", () => {
    const tooltip = new ConversionTooltip(document, window);
    tooltip.showError(rect(100, 100));
    tooltip.hide();
    expect(
      document.querySelector("[data-currency-converter-tooltip]")
    ).toBeNull();
  });
});
