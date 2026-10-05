# Mobile noticeboard layout fixes

## Build
- Reflow the mobile header so the IIM Nagpur identity and full noticeboard title remain readable beside compact account actions.
- Move approaching deadlines above the full notice feed on mobile while retaining the existing three-column desktop order.
- Preserve all filters, starring, club posting, branding, and urgency behavior.

## Verification
- Test the public board at 375px, 390px, and 412px widths for clipping, horizontal overflow, and section order.
- Check the sign-in, password reset, and club desk pages on mobile.
- Confirm the project builds without errors.

## Technical details
- Use responsive grid sizing with shrink-safe text containers in the shared header.
- Apply responsive visual ordering only; do not change data queries or notice logic.
