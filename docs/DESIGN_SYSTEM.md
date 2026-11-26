# Design system

The reference informed the warm cream canvas, espresso text, orange actions, pastel category tones, rounded surfaces, and cut-paper illustrations. The illustrations were created for Playground.

Theme tokens are in `src/app/globals.css`. Plus Jakarta Sans is used for headings and DM Sans for body text. Both fonts are bundled locally. Primary buttons use an orange fill, secondary buttons use a border, and text links use a darker orange for readable contrast. Pills identify categories and sample data.

The layout uses a 1,224-pixel content maximum and fluid page gutters. Feed cards reduce from three columns to two at 820 pixels and to one at 530 pixels. At 880 pixels the desktop navigation moves to the bottom of the screen.

Use the existing spacing and radius tokens when extending the theme, preserve visible focus, and pair color with a label or icon wherever it conveys a status.
