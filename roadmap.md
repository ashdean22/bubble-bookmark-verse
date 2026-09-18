# Roadmap

- [x] Standardize user-facing and metadata branding as BubbleMark.
- [x] Remove stale former-domain references without inventing a production domain.
- [x] Preserve loading recovery, UI behavior, pricing, features, and backend behavior.
- [x] Verify references and production build.

## Loading reliability
- [x] Harden startup against older browsers and failed optional chunks.
- [x] Verify empty, corrupted, legacy, and large saved sessions load after the latest fix.
- [x] Remove the unsafe production chart chunk split causing a circular initialization crash.
- [x] Verify mobile startup completes without the error or recovery screen.
- [x] Replace the asynchronous startup chain with direct mounting to prevent freezes.
- [x] Verify the mobile action menu responds after startup.
- [x] Remove mobile graphics contention that made the loaded app appear frozen.
- [x] Verify smooth bubble movement and controls under a throttled Samsung-sized test.
- [x] Keep bubble physics moving under Samsung reduced-motion settings and resume after backgrounding.

## Background visibility
- [x] Brighten the bubble board while preserving its blue-violet space character.

## Pricing model update
- [ ] Free tier limited to 15 bubbles, one device, local only, basic themes.
- [ ] Pro: unlimited bubbles, sync, backup, premium themes, heat insights, $14.99/year only.
- [ ] Lifetime: everything in Pro, one-time $24.99.
- [x] Enforce the 10-bubble limit in the add flow, keep existing bubbles intact.
- [x] Gentle warning near 8 bubbles; upgrade prompt at the limit (no crash).
- [x] Remove monthly pricing and outdated free-tier wording everywhere.
- [x] Verify the limit prompt, pricing view, and build pass.

## Payments (deferred to launch)
- [ ] Enable Paddle payments (recommended; eligibility check passed) — user approved setup, then asked to save all payments for launch.
- [ ] Create Pro ($14.99/year) and Lifetime ($24.99 one-time) products.
- [ ] Replace Pro "Coming soon" button with real checkout; wire Lifetime waitlist to purchase.
