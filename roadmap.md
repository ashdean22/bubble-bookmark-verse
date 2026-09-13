# Roadmap

- [x] Standardize user-facing and metadata branding as BubbleMark.
- [x] Remove stale former-domain references without inventing a production domain.
- [x] Preserve loading recovery, UI behavior, pricing, features, and backend behavior.
- [x] Verify references and production build.

## Loading reliability
- [ ] Harden startup against older browsers and failed optional chunks.
- [ ] Verify empty, corrupted, legacy, and large saved sessions load.

## Pricing model update
- [ ] Free tier limited to 15 bubbles, one device, local only, basic themes.
- [ ] Pro: unlimited bubbles, sync, backup, premium themes, heat insights, $14.99/year only.
- [ ] Lifetime: everything in Pro, one-time $24.99.
- [ ] Enforce the 15-bubble limit in the add flow, keep existing bubbles intact.
- [ ] Gentle warning near 12 bubbles; upgrade prompt at the limit.
- [ ] Remove monthly pricing and outdated free-tier wording everywhere.
- [ ] Verify add/edit/delete still work and build passes.
