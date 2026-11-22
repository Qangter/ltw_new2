# Eduresult visual style

The dashboard establishes the visual direction for authenticated Eduresult screens. Shared brand values live in [`design-tokens.css`](./design-tokens.css), which is imported by [`index.css`](./index.css). Reuse these variables in feature styles instead of copying color and font values.

## Tokens

| Token | Use |
| --- | --- |
| `--edu-primary` | Main project blue for brand surfaces and focus accents |
| `--edu-primary-dark` | Hover and active states |
| `--edu-primary-light` | Soft highlights and selected surfaces |
| `--edu-ink` | Main headings and body text |
| `--edu-body` / `--edu-muted` | Secondary copy |
| `--edu-line` | Input and divider borders |
| `--edu-surface` / `--edu-canvas` | White surfaces and soft page backgrounds |
| `--edu-radius-card` / `--edu-shadow-card` | Large panels |
| `--edu-font-sans` | Vietnamese-safe sans-serif font stack |

## Component direction

- Extend the login split layout edge-to-edge and match its height to the viewport; keep the form directly on the light page canvas with no separate card fill or shadow.
- Darken the photography with a controlled navy overlay so white text stays readable while the image remains visible.
- Use the project blue selectively for key brand or heading words over the photo.
- Keep headings dark, compact, and bold; use smaller uppercase labels with letter spacing for form fields.
- Use simple underline inputs and pill-shaped primary actions on authentication screens.
- Keep decoration low contrast behind content and respect reduced-motion preferences.
- Collapse split layouts into one column at narrow widths.

The login-specific split layout is in [`auth-login.css`](./auth-login.css). It keeps its full-page photo treatment while sharing the project blue and typography tokens.

## Admin overview direction

The admin dashboard uses a white navigation rail on a pale blue canvas, with a blue overview banner, compact metric cards, and aligned chart panels. The dashboard palette is recorded as `--edu-dashboard-*` tokens in [`design-tokens.css`](./design-tokens.css) and is applied across authenticated screens through [`app-theme.css`](./app-theme.css). Reuse those values for feature styles so the sidebar, page background, headings, forms, tables, and state accents stay consistent.

- Use `--edu-dashboard-canvas` behind pages and `--edu-dashboard-surface` for cards and navigation.
- Use `--edu-dashboard-brand` and `--edu-dashboard-brand-soft` for selected navigation, links, chart bars, and icons.
- Use `--edu-dashboard-ink` for headings and key values, with `--edu-dashboard-muted` for supporting labels.
- Reserve the teal and danger tokens for pass/fail states, keeping the rest of the dashboard blue-led.
- Keep chart panels in a three-column row on desktop and collapse them to one column on small screens.

Dashboard-specific composition lives in [`../features/dashboard/dashboard.css`](../features/dashboard/dashboard.css). Shared shell and component styling for the remaining screens lives in [`app-theme.css`](./app-theme.css).
