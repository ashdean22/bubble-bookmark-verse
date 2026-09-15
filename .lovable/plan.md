# Fix the two-second bubble options hold

## Changes
- Keep the two-second hold timer active during small finger movement and bubble dragging.
- Track the latest finger position so the options open beside the held bubble.
- Prevent the held bubble from opening its website when the options appear.
- Preserve mouse dragging, right-click options, bubble physics, and visuals.

## Verification
- Simulate a real phone touch that moves slightly while held and confirm options appear at about two seconds.
- Confirm releasing after the menu opens does not navigate.
- Recheck mouse drag, right-click, console errors, and the production build.
