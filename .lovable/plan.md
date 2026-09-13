# BubbleMark loading reliability fix

## Scope
- Preserve the current design, bubble physics, pricing, features, saved bookmarks, and startup recovery.
- Fix only startup and loading failure paths.

## Changes
1. Guard optional browser APIs used during the first render so older Safari/WebViews cannot crash before BubbleMark appears.
2. Isolate delayed utilities from the main app so a missing or failed optional chunk cannot replace the bookmark screen.
3. Make startup failure recovery remain available even when rendering fails asynchronously.
4. Test empty, corrupted, legacy, and large saved bookmark sessions in a real browser, then confirm the build is healthy.
