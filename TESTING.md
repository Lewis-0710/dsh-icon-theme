# Testing

The release gate is:

```bash
npm run qa
npm run test:web
npm pack --dry-run
```

## DSH compatibility matrix

| Host line | Gate | Expected result |
| --- | --- | --- |
| `0.1.0-rc.6` | Dev dependencies, typecheck, unit suite, build | Pass |
| `0.1.1-rc.*` and stable `0.1.x` | npm-semver peer contract | Accepted |
| `0.1.2-alpha.1` | Official tag `dsh-v0.1.2-alpha.1` (`cd5ef8148158c3a752a658978873241fdf8e2bbc`), full source build, isolated `DSH_HOME`, packed-plugin browser smoke | Pass |
| `0.2.0-alpha.1` and later | npm-semver peer contract | Rejected until explicitly validated |

The alpha.1 browser smoke opens Settings → Icons, requires all rendered
Settings rows to be changeable, writes a manual icon, checks the owned DOM
marker and icon ID, reloads the page to prove Host persistence, and checks for
failed API requests or browser console warnings/errors. A present but empty
`sidebar.footer.action` slot is a supported waiting state; a populated layout
that cannot be correlated remains unsupported and untouched.

### Exact `0.1.2-alpha.1` isolated smoke

Use empty paths for `DSH_ALPHA_ROOT` and `DSH_ALPHA_HOME`, and point
`ICON_THEME_ROOT` at this checkout:

```bash
export DSH_ALPHA_ROOT=/tmp/deepseek-harness-0.1.2-alpha.1
export DSH_ALPHA_HOME=/tmp/dsh-icon-theme-alpha1-home
export ICON_THEME_ROOT=/absolute/path/to/dsh-icon-theme

git clone --depth 1 --branch dsh-v0.1.2-alpha.1 https://github.com/deepseek-ai/deepseek-harness.git "$DSH_ALPHA_ROOT"
test "$(git -C "$DSH_ALPHA_ROOT" rev-parse HEAD)" = cd5ef8148158c3a752a658978873241fdf8e2bbc
pnpm --dir "$DSH_ALPHA_ROOT" install --frozen-lockfile
pnpm --dir "$DSH_ALPHA_ROOT" run build

npm --prefix "$ICON_THEME_ROOT" ci
npm --prefix "$ICON_THEME_ROOT" run qa
npm --prefix "$ICON_THEME_ROOT" pack --pack-destination /tmp
DSH_HOME="$DSH_ALPHA_HOME" pnpm --dir "$DSH_ALPHA_ROOT" dsh plugin --profile web add /tmp/dsh-icon-theme-0.2.3.tgz
DSH_HOME="$DSH_ALPHA_HOME" pnpm --dir "$DSH_ALPHA_ROOT" dsh web --no-open --port 3182
```

Observed on 2026-08-30 with the packed dependency recorded as
`file:/tmp/dsh-icon-theme-0.2.3.tgz`: the Host identified itself as
`0.1.2-alpha.1-cd5ef81`; Icons reported pack 121, detected 6, Settings active
and changeable 5/5, and the empty sidebar action slot as waiting 0/1. Changing
General to Home produced one owned glyph with icon ID `home`, survived a full
page reload, and reset to automatic. All observed dynamic requests returned
HTTP 200 and the browser console had zero warnings and zero errors.

## Layers

1. **Config and catalog** — Schemastery rejects malformed overrides; every SVG
   is unique, local, monochrome, safe, 16 px, and attributed.
2. **Resolution** — table-driven tests lock manual, plugin, original, preset,
   inference, and fallback priority. Localized labels are explicitly excluded.
3. **DOM contracts** — jsdom covers delayed mount, host rerender, ledger/DOM
   mismatch, look-alike/ambiguous dialogs, in-place child and compatibility
   attribute replacement, iconless rows, multi-root contributions, and complete
   disposal. A first-open mismatch retries on a bounded burst and on tab
   visibility even when the slot ledger catches up without another DOM
   mutation. It also proves unrelated streaming DOM mutations do not rescan the
   sidebar.
4. **Store and UI** — stable-key writes, user-layer clearing, both surfaces,
   icon picking, live source changes, filtering, and reset behavior.
5. **Lifecycle and build** — fake DSH context verifies registrations,
   subscriptions, observers, styles, and markers are owned and released.
6. **Settings wire** — Host and browser tests enforce the fixed namespace,
   same-origin non-simple header, top-level path allowlist, revision forwarding,
   unavailable state, and DSH Settings persistence.
7. **Ecosystem fixtures** — registrations pinned from five open-source plugins
   include immutable source blob IDs and prove generic discovery of an unknown
   Settings section, safe gear fallback, manual override, and non-interference
   with unrelated slot surfaces.
8. **Browser fixture** — real Chromium and React execute the produced
   `window.__ModuleLoader__` artifact, mount the complete settings component,
   open every generated picker item, persist a manual choice through the browser wire,
   confirm non-empty mask pixels, and restore original SVGs on disposal.
9. **Real DSH smoke** — after local installation, run:

   ```bash
   DSH_E2E_URL=http://127.0.0.1:3080 npm run test:web -- -t @real-dsh
   ```

   The test opens Settings → Icons, verifies live discovery and friendly sidebar
   names, changes the rendered Import Conversations icon, changes the Market
   icon, verifies both real DOM updates, reloads the whole page to prove Host
   Settings persistence, and restores automatic selection before exiting.

## Regression requirements

Any new supported surface needs a fail-closed mismatch test and a disposal
test. Any new icon needs catalog generation, license metadata, semantic aliases,
and the invariant suite. Any new exact plugin adapter needs a repository/license
reference and evidence that the asset is a navigation icon rather than a logo,
banner, screenshot, or favicon.
