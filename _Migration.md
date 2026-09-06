# Dependency migration notes — DELETE BEFORE MERGE

Branch: `update-deps`  
Related: issue #486 (dependency dashboard), issue #289 (React 19 / DnD)

---

## What was done

### js-yaml 4 → 5 (`fd829ec`, `bcaf8cb`)
- Imports updated to namespace style (`import * as yaml from 'js-yaml'`) before the bump — `safeLoad`/`safeDump` were removed in v5, replaced by `load`/`dump`. The two affected files were `src/util.js` and `src/component/diff.js`.
- No known remaining issues.

### globals 16 → 17 (`bcaf8cb`)
- Dev dependency used only by `eslint.config.mjs`. Breaking change (removal of `globals.es2015` alias) does not affect this codebase.
- No known remaining issues.

### MUI 5/7 → 9 (`4049955` wip — pre-session)
- Bulk import/API migration was done in the `wip` commit. ~188 import sites across ~40 files touched.
- The `wip` commit accidentally introduced JS comments into `package.json` (invalid JSON, broke `npm`). Fixed in `bcaf8cb` by removing the comments.
- Also introduced ~144 extra-semicolon/quote style errors (MUI migration tooling artefact). Fixed in `bcaf8cb` via `eslint --fix`.
- `build/` was not excluded from eslint, causing ~50k noise errors from the minified bundle. Fixed in `bcaf8cb` by adding `{ ignores: ['build/'] }` to `eslint.config.mjs`.
- `react-is` override added to `package.json` (`"overrides": { "react-is": "^18.3.1" }`) — needed because MUI v6+ pulls in react-is@19 internally which mismatches React 18. Removed later when React was upgraded to 19.
- Two `AccordionSummary` instances had `IconButton` children, which is invalid HTML (`<button>` inside `<button>`). React 19 started warning about this. Fixed in `e4e51f0` with `slotProps={{ root: { component: 'div' } }}`:
  - `src/component/common.js:803` — NavigationHeader drill-up/drill-down buttons
  - `src/component/bom.js:326` — ComponentSettings menu button
- No known remaining issues, but MUI 9 is a large surface — see **manual smoke test checklist** below.

### react-beautiful-dnd 13 → @dnd-kit (`762d148`)
- Library replaced entirely. `react-beautiful-dnd` is abandoned and has no React 19 support.
- `DragDropContext` + `Droppable` in `src/landing.js` replaced with `DndContext` + `SortableContext`.
- `Draggable` in `src/util/versionOverview.js` replaced with `useSortable` hook directly on `VersionTableRow`.
- `handleDragEnd` signature changed: was `(result) => result.draggableId / result.source.index / result.destination.index`, now `({ active, over }) => active.id / index lookup via sorted deps array`.
- The `provided` prop that was threaded from `Droppable` down through `VersionOverview` into `VersionTableRow` is gone entirely.
- The original code had a bug: `provided.placeholder` was rendered both inside each `Draggable` and at the bottom of `TableBody`. Both removed; @dnd-kit handles spacing automatically.
- **Key area to smoke test**: landing page drag-to-reorder in edit mode.

### React 18 → 19 (`762d148`)
- `react`, `react-dom`, `react-is` bumped to `^19.2.7`.
- `overrides.react-is` block removed from `package.json`.
- `React.forwardRef` deprecated in React 19 (ref is now a plain prop). Fixed in two files:
  - `src/util/copyOnClickChip.js` — dropped `forwardRef` wrapper, added `ref` to destructured props
  - `src/util/snackbarWithDetails.js` — same
- `React.createContext` (4x in `App.js`) is still valid in React 19; `.Consumer` render-prop API is deprecated but not used here.
- `React.memo` (10x across codebase) — unchanged, fully supported in React 19.
- **Key area to smoke test**: snackbar error notifications with details/retry (uses `SnackbarWithDetails`), any component that receives a `ref` via `CopyOnClickChip`.

### react-router 7 → 8 (`762d148`)
- `react-router` bumped to `^8.3.1`. react-router v8 requires React ≥19.2.7 (hence blocked until React 19 was done).
- `react-router-dom` removed — in v8 it is an empty re-export; all APIs are in `react-router`.
- One import updated: `src/component/metadataBrowser.js` line 35 changed from `react-router-dom` to `react-router`.
- All other router imports (`HashRouter`, `Routes`, `Route`, `useNavigate`, `useSearchParams`) were already using `react-router` directly and are unchanged.
- No API-level breaking changes for the declarative routing pattern this app uses.

### Renovate holds updated (`762d148`)
- Removed holds for `react`/`react-dom`, `react-router`/`react-router-dom` — migrations complete.
- **eslint 10 hold kept**: `eslint-plugin-jsx-a11y` and `eslint-plugin-react` both cap peer deps at `eslint ^9`. Will unblock when those plugins ship eslint 10 support.

---

## What is NOT done

- **eslint 10**: blocked by `eslint-plugin-jsx-a11y ^9` and `eslint-plugin-react ^9.7` peer dep caps. Check with `npm info eslint-plugin-jsx-a11y peerDependencies.eslint` — when both show `|| ^10`, remove the hold in `.github/renovate.json5` and merge the Renovate PR.

---

## Vite migration (react-scripts → Vite 6)

All SAST vulnerabilities came from `react-scripts@5.0.1`'s pinned transitive deps (webpack 4, old postcss, nth-check, svgo, etc.). Replacing it with Vite drops from 1627 packages / many vulnerabilities to ~444 packages / **0 vulnerabilities**.

### What changed
- `package.json`: removed `react-scripts`, added `vite@^6.3.5` + `@vitejs/plugin-react@^4.5.2` to devDependencies; replaced `start`/`build` scripts; removed `homepage: "./"` (handled by `base: './'` in vite.config); added `"type": "module"` for ESM config files.
- `vite.config.js` (new): `@vitejs/plugin-react` plugin, `base: './'`, `esbuild: { include, loader: 'jsx' }` to handle `.js` files containing JSX (CRA permitted `.js` for JSX files; Vite does not by default).
- `index.html` moved from `public/index.html` to project root; `%PUBLIC_URL%/` references removed; `<script type="module" src="/src/index.js">` entry point added.
- `.env.development` / `.env.production`: all `REACT_APP_*` vars renamed to `VITE_*`.
- Source files (App.js, layout.js, common.js, feature.js, api.js): all `process.env.REACT_APP_*` replaced with `import.meta.env.VITE_*`. The `window.REACT_APP_DELIVERY_SERVICE_API_URL` fallback in `api.js` was intentionally left unchanged — it is injected at runtime from `public/dynamic/config.js`, not a build-time env var.
- `eslint.config.mjs`: added `dist/` to ignores (Vite outputs there, not `build/`). Stale `eslint-disable-next-line no-undef` comments removed from 5 files — no longer needed once `import.meta.env.*` is used (ESLint doesn't flag those as `no-undef`).
- `.gitignore`: added `/dist`.

### Why Vite 6 not 8
Vite 8 ships with rolldown/OXC as the bundler/transformer. OXC's built-in transform plugin hardcodes `exclude: /\.js$/` in the bundled-environment path, and the `oxc` user config does not propagate to `environment.config.oxc` — so there is no supported way to override it for the build step without patching Vite internals. Vite 6 uses esbuild, where `esbuild.include` + `esbuild.loader: 'jsx'` cleanly handles `.js` files. This blocker will likely be fixed in a future Vite 8 patch; revisit when upgrading.

### Static assets
`public/` folder structure is unchanged — `public/manifest.json`, `public/favicon.ico`, `public/dynamic/config.js` all served at `/` by Vite's static file middleware, same as CRA.

### Known non-issue
`<script src="/dynamic/config.js"> in "/index.html" can't be bundled without type="module" attribute` — Vite prints this warning at build time but it is harmless. The script is a runtime config injection (loaded by the browser at page load), not a module to be bundled. The build output is correct.

---

## Manual smoke test checklist

CI only checks `npm run build` and `.ci/lint`. These areas need a human:

- [ ] Landing page loads, component cards render
- [ ] Edit mode on a component card: rows are draggable, drag-to-reorder persists after toggling edit off
- [ ] Component BOM view: accordion expands/collapses, NavigationHeader drill-up/drill-down buttons work
- [ ] Snackbar error notifications appear and can be dismissed; "Retry" button works if visible
- [ ] Copy-on-click chip copies to clipboard and shows notification
- [ ] `metadataBrowser` link navigation works (the one import that moved from `react-router-dom`)

---

## Known non-issues

- `Uncaught SyntaxError: Unexpected token '<' (at config.js:1:1)` — pre-existing; the backend config endpoint is not running locally. Not a frontend bug.
- `GET http://localhost:5000/features 401` / `GET http://localhost:5000/service-extensions 401` — expected when running without a backend.
- `TypeError: Cannot read properties of undefined (reading 'startTime')` — comes from a web-vitals/performance observer inside `react-scripts`, triggered by backend errors. Not app code.
