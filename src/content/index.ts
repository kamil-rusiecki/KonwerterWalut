import { CurrencySelectionController } from "./selection-controller";
import { ConversionTooltip } from "./tooltip";
import type {
  GetRateRequest,
  GetRateResponse,
  SourceCurrency
} from "../shared/types";

const tooltip = new ConversionTooltip();

function currentSelectionText(): string {
  return window.getSelection()?.toString() ?? "";
}

async function requestRate(currency: SourceCurrency): Promise<GetRateResponse> {
  const request: GetRateRequest = { type: "GET_RATE", currency };
  return browser.runtime.sendMessage(request) as Promise<GetRateResponse>;
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;";
  document.documentElement.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) {
    throw new Error("Kopiowanie do schowka nie powiodło się.");
  }
}

const controller = new CurrencySelectionController({
  tooltip,
  requestRate,
  copy: copyText,
  currentSelectionText
});

let selectionTimer: number | null = null;

function getSelectionSnapshot() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount !== 1) {
    return null;
  }

  const text = selection.toString();
  if (!text.trim()) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return { text, rect };
}

function scheduleSelectionCheck(delay = 0): void {
  if (selectionTimer !== null) {
    window.clearTimeout(selectionTimer);
  }
  selectionTimer = window.setTimeout(() => {
    selectionTimer = null;
    void controller.handle(getSelectionSnapshot());
  }, delay);
}

document.addEventListener("selectionchange", () => {
  controller.invalidate();
  scheduleSelectionCheck(120);
});

document.addEventListener("pointerup", () => scheduleSelectionCheck());
document.addEventListener("keyup", (event) => {
  if (event.key === "Escape") {
    controller.invalidate();
    return;
  }
  scheduleSelectionCheck();
});

document.addEventListener(
  "pointerdown",
  (event) => {
    if (!tooltip.containsEvent(event)) {
      controller.invalidate();
    }
  },
  true
);

window.addEventListener("scroll", () => controller.invalidate(), true);
window.addEventListener("resize", () => controller.invalidate());
