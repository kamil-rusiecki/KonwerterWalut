# Firefox Currency Selection Converter

A local Firefox extension that converts selected USD or EUR prices to PLN. Exchange rates come from the latest available Table A published by the National Bank of Poland (NBP).

Polish documentation: [README.pl.md](README.pl.md)

## Supported price formats

- currency symbols and codes before or after the amount: `$19.99`, `19,99 USD`, `EUR 1.234,56`, `25 €`;
- the `US$` marker;
- `.` and `,` decimal separators;
- regular spaces, non-breaking spaces, apostrophes, periods, and commas as thousands separators.

The selection must contain exactly one complete amount together with its currency symbol or code. A bare `19.99`, price ranges, and selections containing multiple amounts are ignored. A standalone `$` is interpreted as USD.

## Requirements

- Node.js 20 or newer;
- Firefox 109 or newer.

## Installation and verification

```bash
npm install
npm run verify
```

The `verify` command runs the test suite, checks TypeScript types, builds the extension, and validates it with `web-ext lint`.

## Running in Firefox

The simplest development workflow is:

```bash
npm run build
npm run firefox
```

`web-ext` opens a separate Firefox profile with the extension installed temporarily. You can also load it manually:

1. Run `npm run build`.
2. Open `about:debugging` in Firefox.
3. Select **This Firefox**.
4. Click **Load Temporary Add-on**.
5. Choose `dist/manifest.json`.

Use `test-page.html` to check the supported formats manually. Serve the project over HTTP because the content script does not run on `file://` URLs:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/test-page.html`.

A temporary extension is removed when the development Firefox profile is closed. Permanent end-user installation requires a package signed by Mozilla Add-ons.

## Building a package

```bash
npm run package
```

The generated `.zip` file is written to `web-ext-artifacts/`.

To build both the installable add-on package and the reviewer source package:

```bash
npm run package:release
```

The release command produces:

- `konwerter_walut-0.1.0.zip` for Mozilla Add-ons;
- `konwerter_walut-0.1.0-sources.zip` with the readable source code and build instructions.

See [SOURCE_CODE_REVIEW.md](SOURCE_CODE_REVIEW.md) for reproducible build and reviewer testing instructions.

## Development

In the first terminal:

```bash
npm run build:watch
```

After the initial build, run this in a second terminal:

```bash
npm run firefox
```

TypeScript changes are rebuilt automatically. Changes to `static/manifest.json` require restarting the build.

## Privacy and exchange rates

Selected text stays in the browser. The content script sends only the detected currency code to the background script. The background script downloads the complete NBP Table A from `https://api.nbp.pl/` and stores it in the extension's local storage.

Cached rates are considered fresh for 12 hours. If the network is temporarily unavailable, the extension can use the last successful response for up to seven days. When no usable rate is available, it displays `Brak kursu` ("Rate unavailable").

The extension has no analytics, accounts, advertising, or remote executable code. See the full [privacy policy](PRIVACY.md).

## MVP limitations

- PLN is the only target currency;
- only rendered page text is supported, not text selected inside form fields;
- Firefox extensions cannot run on protected pages such as `about:*`, the built-in PDF viewer, or Mozilla Add-ons;
- conversions use the average NBP rate and do not represent the transactional rate offered by a bank or card provider;
- the extension UI is currently in Polish.

## License

Released under the [MIT License](LICENSE).
