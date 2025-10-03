COMPLETED:
✅ Aurora's message text is too light in dark mode - Fixed contrast with better background colors
✅ Move hamburger menu to right side - Repositioned next to dark/light toggle with right-side drawer
✅ Improve calendar spacing - Fixed padding consistency and element spacing
✅ Improve typography - Added Google Fonts (Inter) for modern typography
✅ Modernize meditation UI - Made breathing circle clickable, removed bulky controls, removed cycle counter and descriptive text, made circle responsive and larger
✅ Better font (more distinct) for app title "AuraFlow"
✅ Gentle color gradients - Add gradient (with #fff as secondary color) to message bubbles to make them appear "Shiny"
✅ Add the user Avatar Profile image thing that is next to their messages also by the "Signed in as "
in the sidebar menu
✅ Make the "Menu" text/title visually distinguished from other text in the sidebar
✅ Re assess the AI focus time calendar suggestions - Fixed multiple issues: expanded time window (7 AM - 9 PM), reduced minimum duration (15 min), added multi-day analysis, improved gap detection logic, shows suggestions in week view, respects current time, added better logging and more descriptive titles
✅ Use frontend/public/icon.jpg as favicon - Generated favicon.ico with multiple sizes (16x16, 32x32, 48x48) and added to HTML
✅ Use frontend/public/icon.jpg as app icons referenced in manifest.json - Generated 192x192 and 512x512 PNG icons, updated manifest
✅ Remove the usage of emojis - Removed all emoji usage from components and tests
✅ Ensure text "Dashed events are focus block..." responds correctly to light/dark mode - Changed to use Mantine's `c="dimmed"` prop for proper theme support
✅ The meditation tab does not support dark mode. The background (including the canvas background (which can probably be transparent)) needs to be like the other tab backgrounds in dark mode. The canvas shape colors should also be adjusted for dark mode to a lighter color for each shape.

TODO:


Tech Debt:
- Evaluate usage of components with "Placeholder" in the name (some are not needed any longer).
- Remove CalendarPlaceholder as it is only used in tests (remove those tests as well).
- Integration tests to increase coverage