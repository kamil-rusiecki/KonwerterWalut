# Release checklist

Use this checklist before signing or submitting a new version to Mozilla Add-ons.

## Automated checks

- [ ] Install exactly the locked dependencies with `npm ci`.
- [ ] Run `npm run verify:ci`.
- [ ] Confirm all Vitest tests pass.
- [ ] Confirm TypeScript type checking passes.
- [ ] Confirm `web-ext lint` reports no errors, warnings, or notices.
- [ ] Confirm the real Firefox smoke test reports a dated NBP conversion.
- [ ] Run `npm run package:release`.
- [ ] Extract the reviewer source ZIP in a clean directory and run `npm ci` followed by `npm run verify`.

## Manual Firefox checks

- [ ] `$19.99`, `19,99 USD`, `EUR 1.234,56`, and `25 €` each produce a PLN result.
- [ ] A bare `19.99`, a price range, and a selection containing two prices produce no tooltip.
- [ ] The tooltip remains inside the viewport near every screen edge.
- [ ] Clicking the result copies it and briefly displays `Skopiowano`.
- [ ] Pressing Escape, scrolling, resizing, or changing the selection hides an obsolete tooltip.
- [ ] With a fresh rate cache and the network unavailable, conversion still works.
- [ ] With no usable cached rate and the network unavailable, `Brak kursu` appears.
- [ ] Ordinary HTTP and HTTPS pages work.
- [ ] Protected Firefox pages remain unaffected as documented.

## Release metadata

- [ ] The versions in `package.json`, `static/manifest.json`, and `CHANGELOG.md` agree.
- [ ] The extension ID has not changed.
- [ ] Permission descriptions and privacy disclosures still match the implementation.
- [ ] AMO listing copy and screenshots match the current behavior.
- [ ] The installable ZIP contains only the built extension.
- [ ] The source ZIP contains readable source, the lockfile, and reviewer instructions.
- [ ] Both artifact SHA-256 checksums are recorded in the release notes.
