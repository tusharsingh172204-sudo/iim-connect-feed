# Noticeboard color refresh

## Build
- Keep the warm paper base and the existing red, orange, and amber deadline signals.
- Add a restrained campus palette for non-urgent interface areas: a deep teal masthead, green active filters, and blue notice/timeline accents.
- Give each notice type a distinct semantic accent while preserving readability and the current editorial grid.
- Carry the same color system through shared buttons and interactive states without changing any functionality.

## Verification
- Check the public board at desktop and mobile sizes.
- Confirm urgency colors remain unchanged and text contrast stays clear.
- Confirm the app builds without errors.

## Technical details
- Define new semantic colors in the global design tokens and reference them through Tailwind classes.
- Keep all posting, sign-in, filtering, starring, and deadline logic unchanged.
