# Source code and reviewer guide

This document describes how to reproduce and test Konwerter walut version 0.1.0 for Mozilla Add-ons review.

## Environment

- Node.js 20 or newer;
- npm distributed with Node.js;
- Firefox 109 or newer;
- `zip` command-line utility, needed only to create the reviewer source archive.

## Reproducible build

From the source package root:

```bash
npm ci
npm run verify
npm run package
```

`npm run verify` runs 39 automated tests, TypeScript type checking, an unminified esbuild bundle, and `web-ext lint`.

The repository CI additionally runs `npm run verify:ci`, which launches the extension in a real headless Firefox instance and verifies an NBP-backed conversion. This runtime smoke test is not required to reproduce the submitted bundle.

The build copies `static/` into `dist/` and bundles:

- `src/background/index.ts` into `dist/background.js`;
- `src/content/index.ts` into `dist/content.js`.

Source maps are included. The build does not download or execute remote code. All npm dependencies are development and build tools listed in `package-lock.json`.

The installable ZIP is written to `web-ext-artifacts/konwerter_walut-0.1.0.zip`.

## Manual functional test

1. Run `npm run build`.
2. Serve the repository root over HTTP, for example with `python3 -m http.server 8080`.
3. Open `about:debugging#/runtime/this-firefox`.
4. Select **Load Temporary Add-on** and choose `dist/manifest.json`.
5. Open `http://localhost:8080/test-page.html`.
6. Select `$19.99`, `19,99 USD`, `EUR 1.234,56`, and `25 €` separately.
7. Confirm that a PLN result appears above the selection.
8. Click the result and confirm that it changes briefly to `Skopiowano`.
9. Confirm that selecting the bare amount `19.99` produces no tooltip.

No account or reviewer credentials are required.

## Runtime network access

The background script downloads the complete NBP Table A from:

`https://api.nbp.pl/api/exchangerates/tables/a/?format=json`

The selected text, amount, page URL, and browsing history are not included in the request. See [PRIVACY.md](PRIVACY.md) for the complete disclosure.

## Permissions

- `storage`: caches the NBP rate table locally;
- `clipboardWrite`: copies the converted value only after the user clicks it;
- `https://api.nbp.pl/*`: downloads the official exchange-rate table;
- `http://*/*` and `https://*/*` content-script matches: detects explicit user text selections on ordinary web pages.
