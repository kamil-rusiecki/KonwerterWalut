import { RateService } from "./rate-service";
import type {
  GetRateRequest,
  GetRateResponse,
  SourceCurrency
} from "../shared/types";

const rateService = new RateService({
  storage: browser.storage.local
});

function isSourceCurrency(value: unknown): value is SourceCurrency {
  return value === "USD" || value === "EUR";
}

function isGetRateRequest(message: unknown): message is GetRateRequest {
  if (!message || typeof message !== "object") {
    return false;
  }
  const candidate = message as Partial<GetRateRequest>;
  return candidate.type === "GET_RATE" && isSourceCurrency(candidate.currency);
}

browser.runtime.onMessage.addListener(
  async (message: unknown): Promise<GetRateResponse | undefined> => {
    if (
      message &&
      typeof message === "object" &&
      (message as { type?: unknown }).type === "GET_RATE" &&
      !isGetRateRequest(message)
    ) {
      return { ok: false, reason: "invalid-request" };
    }

    if (!isGetRateRequest(message)) {
      return undefined;
    }

    try {
      const result = await rateService.getRate(message.currency);
      return { ok: true, ...result };
    } catch (error) {
      const detail =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);
      console.error("Nie udało się pobrać kursu NBP:", error);
      return { ok: false, reason: "rate-unavailable", detail };
    }
  }
);
