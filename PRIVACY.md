# Privacy Policy

Effective date: 18 July 2026

Konwerter walut converts selected USD and EUR prices to PLN in Firefox.

## Data handled locally

The extension reads text selected by the user only to recognize a supported price and calculate its PLN value. The selected text, amount, page URL, and browsing history remain in the browser and are not sent to the developer or to an analytics service.

The content script sends only the detected currency code (`USD` or `EUR`) to the extension's own background script. This is internal browser communication and does not leave the device.

The extension stores the latest downloaded NBP exchange-rate table, its effective date, and the download time in Firefox local extension storage. The cache is replaced after a successful refresh and is removed when the user clears the extension's data or uninstalls the extension.

The converted value is written to the system clipboard only when the user clicks the result.

## Network communication

To provide official exchange rates, the background script downloads NBP Table A from:

`https://api.nbp.pl/api/exchangerates/tables/a/?format=json`

This request does not contain the selected text, amount, page URL, browsing history, account identifier, or a developer-defined tracking identifier. As with any network request, the service operator may receive standard connection metadata such as the IP address under its own policies.

## Data not collected

The extension has no user accounts, analytics, advertising, telemetry, crash reporting, or remote executable code. The developer does not collect, sell, share, or retain personal data through the extension.

## Changes

Material changes to this policy will be documented in the project changelog and published with an updated effective date.

## Contact

Questions and privacy requests can be submitted through the project's public issue tracker:

https://github.com/kamil-rusiecki/KonwerterWalut/issues
