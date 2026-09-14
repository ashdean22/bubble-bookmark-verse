# Fix the mobile freeze

## Changes
- Keep bubble movement, collisions, design, pricing, and saved bookmarks unchanged.
- On phone-sized screens, stop redundant decorative CSS animations and disable the costliest live blur/refraction layers while retaining the soap-bubble appearance.
- Simplify only the animated background workload on phones.
- Verify startup, bubble movement, and menu interaction under a throttled Samsung-sized browser test, then confirm the production build.

## Technical details
The current phone stress test falls to roughly 15 animation frames per second because JavaScript bubble motion runs alongside multiple CSS filters, backdrop filters, oversized animated backgrounds, and per-bubble animations. Mobile-only rendering rules will remove that GPU contention without changing the physics loop.
