# BubbleMark Cosmetic Refinement

## Scope
Apply the selected Iridescent Glass Canvas direction without changing pricing, bookmark logic, bubble physics, storage, loading recovery, backend behavior, or publishing.

## Changes
- Refine bubble shells to clearer glass with softer thin-film colors, stronger rim iridescence, subtle refraction, softer highlights, and seed-based visual variation.
- Keep favicons crisp and centered; replace failed favicons with a polished neutral globe mark.
- Enable clean, readable, truncated labels beneath bubbles using DM Sans.
- Refine the BubbleMark header presentation using Space Grotesk while preserving its existing placement and capacity indicator.
- Replace the bright board treatment with the locked Twilight Glass palette and restrained layered ambient depth.
- Preserve reduced-motion behavior and reduce costly optical effects for dense boards and smaller screens.

## Technical details
- Define all new visual colors, gradients, and shadows as semantic CSS tokens.
- Pass seed-derived CSS variables into the existing bubble component to vary film rotation and highlight placement without changing motion physics.
- Update only presentation files and the font declaration in the document head.
- Validate the production build, browser console, desktop canvas, mobile canvas, favicon fallback, labels, and existing add/edit/delete interactions.
