# BubbleMark pre-launch brand cleanup

## Scope
- Replace remaining visible `BubbleLink` branding with `BubbleMark` in app-facing metadata and launch documentation.
- Keep existing asset filenames and import variable names unchanged where they are internal-only.
- Remove obsolete `bubblelink.app` references without inventing a replacement domain.
- Preserve startup recovery, bubble behavior, pricing, features, payments, and backend behavior exactly as-is.

## Changes
1. Update `index.html` branding so the author, Open Graph title/site name, Twitter title, and structured data consistently say BubbleMark.
2. Remove the canonical, `og:url`, `twitter:url`, and structured-data URL fields until a production domain is chosen.
3. Remove the obsolete sitemap declaration from `robots.txt` and make `sitemap.xml` a valid empty sitemap until production URLs are available.
4. Update clearly branded BubbleLink references in launch documentation and source comments; retain `bubblelink-logo.*` filenames and import identifiers to avoid unnecessary asset churn.
5. Run the project build, re-scan for old brand/domain references, and confirm the current loading watchdog remains untouched.

## Verification
- Confirm no visible or metadata `BubbleLink` text remains.
- Confirm no `https://bubblelink.app` references remain.
- Confirm the production build succeeds with no errors.
