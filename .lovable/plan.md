# Increase collision bounce and remove lower shading

## Changes
- Increase the collision restitution slightly so bubbles rebound more strongly on contact.
- Remove the dark lower-half shading from the soap-bubble surface while preserving the rim, iridescence, highlights, and caustic.
- Leave movement speed, drag behavior, sizing, pricing, and all other settings unchanged.

## Verification
- Build the app and check the latest diagnostics for errors.
- Seed a temporary local bubble set in a phone-sized browser test, verify bubbles keep moving, and visually confirm the lower dark shading is gone.
