export interface TooltipResult {
  formatted: string;
  effectiveDate: string;
  copy: (text: string) => Promise<void>;
}

const TOOLTIP_GAP = 8;
const VIEWPORT_MARGIN = 8;

export class ConversionTooltip {
  private host: HTMLDivElement | null = null;
  private button: HTMLButtonElement | null = null;
  private resetTimer: number | null = null;
  private generation = 0;

  constructor(
    private readonly pageDocument: Document = document,
    private readonly pageWindow: Window = window
  ) {}

  showResult(result: TooltipResult, selectionRect: DOMRect): void {
    const button = this.ensureMounted();
    const currentGeneration = ++this.generation;
    button.disabled = false;
    button.textContent = result.formatted;
    button.title = `Kliknij, aby skopiować. Kurs NBP z ${result.effectiveDate}.`;
    button.setAttribute(
      "aria-label",
      `${result.formatted}. Kliknij, aby skopiować. Kurs NBP z ${result.effectiveDate}.`
    );
    button.onclick = async () => {
      try {
        await result.copy(result.formatted);
        if (currentGeneration === this.generation) {
          button.textContent = "Skopiowano";
          this.scheduleReset(currentGeneration, result.formatted);
        }
      } catch {
        if (currentGeneration === this.generation) {
          button.textContent = "Nie skopiowano";
          this.scheduleReset(currentGeneration, result.formatted);
        }
      }
    };
    this.position(selectionRect);
  }

  showError(selectionRect: DOMRect, detail?: string): void {
    const button = this.ensureMounted();
    ++this.generation;
    button.disabled = true;
    button.textContent = "Brak kursu";
    button.title = detail
      ? `Nie udało się pobrać kursu NBP. ${detail}`
      : "Nie udało się pobrać kursu NBP.";
    button.setAttribute("aria-label", "Nie udało się pobrać kursu NBP.");
    button.onclick = null;
    this.position(selectionRect);
  }

  hide(): void {
    ++this.generation;
    if (this.resetTimer !== null) {
      this.pageWindow.clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    this.host?.remove();
    this.host = null;
    this.button = null;
  }

  containsEvent(event: Event): boolean {
    return this.host !== null && event.composedPath().includes(this.host);
  }

  private ensureMounted(): HTMLButtonElement {
    if (this.host && this.button) {
      return this.button;
    }

    const host = this.pageDocument.createElement("div");
    host.dataset.currencyConverterTooltip = "true";
    host.style.setProperty("all", "initial", "important");
    host.style.setProperty("position", "fixed", "important");
    host.style.setProperty("z-index", "2147483647", "important");
    host.style.setProperty("top", "0", "important");
    host.style.setProperty("left", "0", "important");

    const shadow = host.attachShadow({ mode: "open" });
    const style = this.pageDocument.createElement("style");
    style.textContent = `
      :host { all: initial; }
      button {
        appearance: none;
        box-sizing: border-box;
        border: 0;
        border-radius: 8px;
        background: #202124;
        color: #fff;
        cursor: pointer;
        font: 600 14px/1.25 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        min-height: 34px;
        padding: 8px 12px;
        white-space: nowrap;
        box-shadow: 0 3px 12px rgb(0 0 0 / 28%);
      }
      button:hover:not(:disabled) { background: #303134; }
      button:focus-visible { outline: 2px solid #8ab4f8; outline-offset: 2px; }
      button:disabled { cursor: default; opacity: .9; }
    `;

    const button = this.pageDocument.createElement("button");
    button.type = "button";
    button.addEventListener("pointerdown", (event) => event.preventDefault());
    shadow.append(style, button);
    this.pageDocument.documentElement.append(host);

    this.host = host;
    this.button = button;
    return button;
  }

  private position(selectionRect: DOMRect): void {
    if (!this.host || !this.button) {
      return;
    }

    const tooltipRect = this.button.getBoundingClientRect();
    const width = tooltipRect.width || 120;
    const height = tooltipRect.height || 34;
    const viewportWidth = this.pageWindow.innerWidth;
    const viewportHeight = this.pageWindow.innerHeight;

    const centeredLeft = selectionRect.left + selectionRect.width / 2 - width / 2;
    const left = Math.min(
      Math.max(centeredLeft, VIEWPORT_MARGIN),
      Math.max(VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN)
    );

    const above = selectionRect.top - height - TOOLTIP_GAP;
    const below = selectionRect.bottom + TOOLTIP_GAP;
    const top =
      above >= VIEWPORT_MARGIN
        ? above
        : Math.min(
            below,
            Math.max(VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN)
          );

    this.host.style.setProperty("left", `${Math.round(left)}px`, "important");
    this.host.style.setProperty("top", `${Math.round(top)}px`, "important");
  }

  private scheduleReset(generation: number, formatted: string): void {
    if (this.resetTimer !== null) {
      this.pageWindow.clearTimeout(this.resetTimer);
    }
    this.resetTimer = this.pageWindow.setTimeout(() => {
      if (generation === this.generation && this.button) {
        this.button.textContent = formatted;
      }
      this.resetTimer = null;
    }, 900);
  }
}
