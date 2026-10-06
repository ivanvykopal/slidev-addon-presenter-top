---
theme: default
title: Presenter Top Demo
addons:
  - slidev-addon-presenter-top
---

# Presenter Top Demo

A minimal deck to try the custom presenter view.

<!--
Introduce the demo: this addon replaces the presenter view with notes on top
and current/next slides side by side. Walk through the three slides and point
out that the notes panel stays readable on any screen width.
-->

---
layout: two-cols
---

::left::

# Click steps

This slide has click animations.

Left column, shown first.

::right::
- <span v-click>Appears on the first click</span>
- <span v-click>And this on the second click</span>

<!--
Mention that the "Next" preview on the right of the presenter shows the next
click step, not just the next slide — handy when you narrate click-by-click.
Use the click slider under the current slide to scrub through steps.
-->

---

# Longer notes

This one has a longer note to show the centered column.

<!--
This paragraph is intentionally long so you can see how the notes wrap into a
centered, teleprompter-style column instead of stretching across the whole
width of the window. The measure is capped at 85 characters, which keeps your
eyes near the middle of the screen while speaking. The panel height can be
adjusted by dragging the divider just below the notes, and the font size with
the zoom buttons in the panel toolbar. Both settings survive a reload because
they are stored in local storage.
-->

---

# The end

Thank you.

<!--
Wrap up and take questions. The next-slide area shows
"End of the presentation" here.
-->
