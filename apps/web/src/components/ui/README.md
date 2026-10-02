# Shared dashboard components

Existing component props remain compatible. The shared palette uses petrol primary actions, neutral surfaces, seafoam selection and focus, and distinct semantic status colors. Mobile buttons and fields have a 44px minimum touch target; mobile text inputs use 16px text.

- `Button`: `primary`, `secondary`, `tertiary`, `ghost`, `destructive`; `loading` disables the action and exposes its busy state while preserving its label. Icon-only actions require `aria-label`.
- `PageHeader`: `title`, optional `tabs`, `actions`, `description`, and `illustration`. Header actions wrap on narrow screens.
- `Field`: `label`, optional `htmlFor`, `hint`, `error`, and `required`. Nested `Input`, `Select`, or `Textarea` inherits the control ID, required state, and accessible descriptions. Use one control per field. For an explicit control ID, set matching `Field.htmlFor`.
- `Dialog` and `Drawer`: `open`, `onClose`, `title`, `children`; optional `description`, `footer`, `closeLabel`, and `size` (`sm`, `md`, `lg`). Pass a localized `closeLabel`. Native modal behavior contains focus, dismisses on Escape or backdrop press, and returns focus to the opener.
- `TableContainer`: horizontally scrolls a `Table`; optional `label` names the scroll region. Use a table caption, real links or buttons for row actions, and `Th.onSort` for sortable columns.
- `EmptyState`: `title`, optional `icon`, `description`, `action`, and `illustration`. Use empty artwork only when the underlying collection is genuinely empty. Use a distinct filtered-empty message and working filter-reset action for a collection with no matches.
- `Illustration`: `variant`, optional `alt`, `decorative`, `className`, `priority`, `sizes`, `aspect` (`natural`, `landscape`, `square`), and `fit` (`cover`, `contain`). Decorative images have empty alt text; supply localized alt for informative images. Preserve architecture orientation in RTL layouts.

## Illustration assets

The 20 final images are in `public/illustrations/v1`. Their public manifest records dimensions, alpha, fit, focal point, and SHA-256. Source and imported PNG hashes were verified before import; source originals remain unchanged. Images load through responsive Next Image, lazily unless `priority` is explicitly set. Set `sizes` to match the rendered slot when it differs from the default 240px mobile / 360px desktop slot. Use `contain` for transparent empty-state artwork. `fully-settled` belongs only to a genuinely completed roadmap.

## Shell integration

`AppShell` provides English/Arabic context to its children. Server route layouts should pass `initialLocale` from the locale cookie for the correct first paint; an additional nested language provider is unnecessary. Navigation and menus support RTL, phone widths, and both themes.

Shell identity defaults to a localized role workspace label. Set `organizationLabel` only from a real selected organization context; the shell keeps no independent organization selection. Existing `OrgSwitcher` calls render display-only unless explicitly given an operative `onChange` and `interactive` flag. Route owners retain responsibility for action semantics and actual state scoping.
