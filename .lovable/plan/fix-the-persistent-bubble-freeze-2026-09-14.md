# Fix the persistent bubble freeze

## Changes
- Keep startup, bubble appearance, bounce physics, pricing, and saved bookmarks unchanged.
- Stop the phone's reduced-motion setting from disabling the bubble physics loop entirely; it will continue suppressing decorative CSS motion only.
- Make the physics loop restart safely after the page returns from the background.
- Test sustained bubble position changes with Samsung-sized Chrome, including reduced-motion mode, then verify controls and the production build.

## Technical details
The canvas currently exits before starting `requestAnimationFrame` whenever the device reports `prefers-reduced-motion: reduce`. Samsung's “Remove animations” accessibility setting can trigger this, leaving every bubble permanently stationary even though the app loaded successfully.
