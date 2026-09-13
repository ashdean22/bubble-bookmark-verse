# Roadmap

- [x] Standardize user-facing and metadata branding as BubbleMark.
- [x] Remove stale former-domain references without inventing a production domain.
- [x] Preserve loading recovery, UI behavior, pricing, features, and backend behavior.
- [x] Verify references and production build.

## Loading reliability
- [x] Harden startup against older browsers and failed optional chunks.
- [x] Verify empty, corrupted, legacy, and large saved sessions load after the latest fix.
- [x] Remove the eager 1ms idle fallback from the startup path.
- [x] Keep optional modal downloads off the initial load path.
- [x] Stage dense bubble boards in smaller device-aware batches.
- [x] Recover once from stale generated files after app updates.
- [x] Isolate optional dialog failures from the bookmark board.
- [x] Cap historical click data so long-lived sessions remain fast.

## Background visibility
- [x] Brighten the bubble board while preserving its blue-violet space character.

## Pricing model update
- [x] Free tier limited to 15 bubbles, one device, local only, basic themes.
- [x] Pro: unlimited bubbles, sync, backup, premium themes, heat insights, $14.99/year only.
- [x] Lifetime: everything in Pro, one-time $24.99.
- [x] Enforce the 15-bubble limit in the add flow, keep existing bubbles intact.
- [x] Gentle warning near 12 bubbles; upgrade prompt at the limit.
- [x] Remove monthly pricing and outdated free-tier wording everywhere.
- [ ] Verify add/edit/delete still work and build passes.
