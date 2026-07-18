# Notes for Mozilla Add-ons reviewers

Konwerter walut has one purpose: converting a price explicitly selected by the user from USD or EUR to PLN.

## Testing

Complete build and functional testing instructions are provided in [`SOURCE_CODE_REVIEW.md`](../../SOURCE_CODE_REVIEW.md).

No account, subscription, API key, or test credentials are required.

## Data flow

1. The content script parses selected text locally.
2. It sends only `USD` or `EUR` through Firefox internal extension messaging.
3. The background script downloads the complete NBP Table A without sending the selected amount or page information.
4. The resulting rate table is cached in `browser.storage.local`.
5. Clipboard access occurs only after a click on the displayed result.

There is no analytics, advertising, telemetry, remote executable code, or remotely configured behavior.

## Permission rationale

- `storage` is required for the NBP cache and offline fallback.
- `clipboardWrite` is required for the explicit click-to-copy interaction.
- `https://api.nbp.pl/*` is limited to the official exchange-rate source.
- ordinary HTTP and HTTPS page matches are required because the core feature operates on prices selected on web pages.
