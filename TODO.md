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

TODO:
- Re assess the AI focus time calendar suggestions. It doesn't seem to be working.
There should be more suggestions than what are visible on my calendar


Tech Debt:
- Evaluate usage of components with "Placeholder" in the name (some are not needed any longer).
- Remove CalendarPlaceholder as it is only used in tests (remove those tests as well).
- Integration tests to increase coverage