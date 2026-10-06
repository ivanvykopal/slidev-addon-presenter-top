# slidev-addon-presenter-top

A [Slidev](https://sli.dev) addon that replaces the default presenter view
(`/presenter/:no`) with a layout optimized for reading speaker notes:

- **Speaker notes in a full-width panel on top**, rendered as a centered,
  comfortable-to-read column (`85ch` measure) — teleprompter style, so your
  gaze stays near the middle of the screen instead of scanning wide lines.
- **Current and next slide side by side** below the notes. The next preview
  accounts for click steps (`v-click`), just like the default presenter.
- **Resizable notes panel** — drag the divider under the notes; the height is
  remembered in local storage.
- Everything else keeps working: navigation controls, click slider, timer,
  progress bar, goto / quick-overview overlays, drawings, laser pointer,
  presenter cursor sync, and in dev mode also live note editing.

## Install

From npm (once published):

```bash
npm i slidev-addon-presenter-top
```

From GitHub:

```bash
npm i github:<user>/slidev-addon-presenter-top
```

Local development (path on disk):

```bash
npm i file:../path/to/slidev-addon-presenter-top
```

## Usage

Enable the addon in your presentation's frontmatter:

```yaml
---
addons:
  - slidev-addon-presenter-top
---
```

Then run Slidev as usual and open the presenter view:

```bash
npx slidev
# → http://localhost:3030/presenter/
```

To remove it, delete the `addons:` entry. If your deck defines its own
`setup/routes.ts`, note that deck-level setups run **after** addon setups and
can further override the presenter route.

## How it works

The addon ships a `setup/routes.ts` that remaps the built-in `presenter`
route to a custom component (`components/PresenterTop.vue`) following the
[route customization approach](https://sli.dev/custom/config-routes). The
component reuses official Slidev internals (`SlideContainer`, `SlidesShow`,
`NoteStatic`, `NavControls`, nav/clicks composables, …) so behavior stays
consistent with the default presenter.

> **Note:** the component imports from `@slidev/client/internals/*`, which is
> not a fully stable public API. The required Slidev version is pinned via
> `engines.slidev` (currently `>=52`). Expect occasional adjustments after
> major Slidev upgrades.

## Structure

```
slidev-addon-presenter-top/
├── package.json
├── setup/
│   └── routes.ts              # overrides the 'presenter' route
├── components/
│   └── PresenterTop.vue       # the presenter layout component
└── example/
    └── slides.md              # minimal deck to try the addon locally
```

## Development

```bash
cd example
npm run setup:addon   # packs the addon into a tarball and installs it (plus Slidev)
npm run dev           # open http://localhost:3030/presenter/
```

The addon is installed from a tarball (`npm pack`) rather than a `file:../`
symlink on purpose: the component imports `@slidev/client/*`, which resolves
from the package's real location. A symlinked install would point outside the
example's `node_modules` and break both module resolution and Vite's `fs.allow`
allowlist. A tarball install is identical to what end users get from npm.

## License

MIT
