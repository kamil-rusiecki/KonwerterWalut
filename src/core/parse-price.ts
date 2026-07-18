import { CURRENCIES, CURRENCY_BY_MARKER } from "../shared/currencies";
import type { ParsedPrice } from "../shared/types";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const markerPattern = CURRENCIES.flatMap((currency) => currency.markers)
  .sort((left, right) => right.length - left.length)
  .map(escapeRegex)
  .join("|");

const numberPattern = String.raw`\d(?:[\d\s\u00a0\u202f'’.,]*\d)?`;
const pricePattern = new RegExp(
  String.raw`^\s*([+-]?)\s*(?:(` +
    markerPattern +
    String.raw`)\s*([+-]?` +
    numberPattern +
    String.raw`)|([+-]?` +
    numberPattern +
    String.raw`)\s*(` +
    markerPattern +
    String.raw`))\s*$`,
  "iu"
);

const groupingWhitespace = /[\s\u00a0\u202f'’]+/u;
const groupingWhitespaceGlobal = /[\s\u00a0\u202f'’]/gu;

function hasValidSpacedGrouping(raw: string): boolean {
  const unsigned = raw.replace(/^[+-]/u, "");
  const groups = unsigned.split(groupingWhitespace);

  if (groups.length === 1) {
    return true;
  }

  if (!/^\d{1,3}$/u.test(groups[0] ?? "")) {
    return false;
  }

  return groups.slice(1).every((group, index, remaining) => {
    const isLast = index === remaining.length - 1;
    return isLast
      ? /^\d{3}(?:[.,]\d{1,2})?$/u.test(group)
      : /^\d{3}$/u.test(group);
  });
}

function normalizeNumber(raw: string): number | null {
  if (!hasValidSpacedGrouping(raw)) {
    return null;
  }

  const compact = raw.replace(groupingWhitespaceGlobal, "");
  const sign = compact.startsWith("-") ? -1 : 1;
  const unsigned = compact.replace(/^[+-]/u, "");

  if (!/^\d[\d.,]*$/u.test(unsigned)) {
    return null;
  }

  const dotCount = (unsigned.match(/\./gu) ?? []).length;
  const commaCount = (unsigned.match(/,/gu) ?? []).length;
  let normalized: string;

  if (dotCount > 0 && commaCount > 0) {
    const decimalSeparator =
      unsigned.lastIndexOf(".") > unsigned.lastIndexOf(",") ? "." : ",";
    const groupingSeparator = decimalSeparator === "." ? "," : ".";
    const decimalIndex = unsigned.lastIndexOf(decimalSeparator);
    const integerPart = unsigned.slice(0, decimalIndex);
    const decimalPart = unsigned.slice(decimalIndex + 1);
    const groupingRegex = new RegExp(
      String.raw`^\d{1,3}(?:${escapeRegex(groupingSeparator)}\d{3})*$`,
      "u"
    );

    if (
      !groupingRegex.test(integerPart) ||
      !/^\d{1,2}$/u.test(decimalPart)
    ) {
      return null;
    }

    normalized =
      integerPart.replaceAll(groupingSeparator, "") + "." + decimalPart;
  } else if (dotCount + commaCount > 0) {
    const separator = dotCount > 0 ? "." : ",";
    const pieces = unsigned.split(separator);

    if (pieces.some((piece) => !/^\d+$/u.test(piece))) {
      return null;
    }

    if (pieces.length > 2) {
      if (
        !/^\d{1,3}$/u.test(pieces[0] ?? "") ||
        !pieces.slice(1).every((piece) => /^\d{3}$/u.test(piece))
      ) {
        return null;
      }
      normalized = pieces.join("");
    } else {
      const [integerPart, fractionalPart] = pieces;
      if (!integerPart || !fractionalPart) {
        return null;
      }

      normalized =
        fractionalPart.length === 3
          ? integerPart + fractionalPart
          : fractionalPart.length <= 2
            ? integerPart + "." + fractionalPart
            : "";

      if (!normalized) {
        return null;
      }
    }
  } else {
    normalized = unsigned;
  }

  const amount = Number(normalized) * sign;
  return Number.isFinite(amount) ? amount : null;
}

export function parsePrice(selection: string): ParsedPrice | null {
  const match = pricePattern.exec(selection);
  if (!match) {
    return null;
  }

  const outerSign = match[1] ?? "";
  const marker = match[2] ?? match[5];
  const rawAmount = match[3] ?? match[4];

  if (!marker || !rawAmount) {
    return null;
  }

  if (outerSign && /^[+-]/u.test(rawAmount)) {
    return null;
  }

  const amount = normalizeNumber(outerSign + rawAmount);
  const sourceCurrency = CURRENCY_BY_MARKER.get(marker.toUpperCase());

  if (amount === null || !sourceCurrency) {
    return null;
  }

  return { amount, sourceCurrency };
}
