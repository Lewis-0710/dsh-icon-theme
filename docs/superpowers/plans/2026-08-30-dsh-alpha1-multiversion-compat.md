# DSH Alpha.1 Multi-Version Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `dsh-icon-theme` compatible with the existing DSH 0.1 release-candidate lines while adding verified support for `0.1.2-alpha.1`.

**Architecture:** Preserve the existing feature-ledger and DOM adapters. Extend only the package-manager compatibility declaration, and distinguish a valid-but-empty alpha.1 sidebar slot from an unknown populated structure; all unsafe populated mismatches remain fail-closed.

**Tech Stack:** TypeScript, Vitest/jsdom, npm semver, DSH source checkout, Playwright CLI.

## Global Constraints

- Preserve the user's existing uncommitted `0.2.3` work.
- Keep DSH `0.1.0-rc.6`, `0.1.1-rc.*`, stable `0.1.x`, and `0.1.2-alpha.1` installable.
- Continue rejecting DSH `0.2.0` and later.
- Never modify icons when a populated sidebar cannot be mapped safely.

---

### Task 1: Package Compatibility Contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tests/package-compat.spec.ts`

**Interfaces:**
- Consumes: npm peer dependency ranges from `package.json`.
- Produces: one shared DSH range accepted by npm semver for each injected DSH service.

- [x] **Step 1: Add a failing manifest test**

```ts
expect(satisfies('0.1.2-alpha.1', range)).toBe(true)
expect(satisfies('0.2.0-alpha.1', range)).toBe(false)
```

- [x] **Step 2: Run the focused test and confirm the current range rejects alpha.1**

Run: `npx vitest run tests/package-compat.spec.ts`
Expected: FAIL for `0.1.2-alpha.1`.

- [x] **Step 3: Extend every injected DSH peer range**

Use `>=0.1.0-rc.6 <0.2.0-0 || >=0.1.1-rc.0 <0.2.0-0 || >=0.1.2-alpha.1 <0.2.0-0` for locale, runtime, UI slots, and settings.

- [x] **Step 4: Regenerate the lockfile and rerun the test**

Run: `npm install`
Expected: lockfile updated and the focused test passes.

### Task 2: Empty Alpha.1 Sidebar Slot Semantics

**Files:**
- Modify: `tests/sidebar-adapter.spec.ts`
- Modify: `src/client/dom/sidebar-adapter.ts`

**Interfaces:**
- Consumes: an existing `[data-slot="sidebar.footer.action"]` with zero children.
- Produces: `AdapterReport.status === 'waiting'` while keeping every target `not-rendered`; populated ambiguous layouts still produce `unsupported`.

- [x] **Step 1: Add the empty-slot regression test**

```ts
document.body.append(slot())
expect(reports.at(-1)).toMatchObject({ status: 'waiting' })
```

- [x] **Step 2: Run the focused test and confirm it fails as unsupported**

Run: `npx vitest run tests/sidebar-adapter.spec.ts`
Expected: FAIL with received status `unsupported`.

- [x] **Step 3: Implement the minimal status distinction**

Set the report status to `waiting` only when `roots.length === 0`; retain `active` for matched/empty-ledger states and `unsupported` for populated unmatched DOM.

- [x] **Step 4: Rerun the focused tests**

Run: `npx vitest run tests/sidebar-adapter.spec.ts tests/package-compat.spec.ts`
Expected: PASS.

### Task 3: Evidence and Release Gate

**Files:**
- Modify: `README.md`
- Modify: `README.zh.md`
- Modify: `TESTING.md`

**Interfaces:**
- Consumes: fixed upstream tag `dsh-v0.1.2-alpha.1` at `cd5ef8148158c3a752a658978873241fdf8e2bbc`.
- Produces: documented old/new compatibility matrix and reproducible isolated-host smoke command.

- [x] **Step 1: Document alpha.1 support in both READMEs**

State that the supported 0.1.x line includes the source-only `0.1.2-alpha.1` preview.

- [x] **Step 2: Record the local compatibility matrix in TESTING.md**

Record legacy compile/unit coverage plus the alpha.1 source build, isolated profile load, Settings 5/5 discovery, mutation, reload persistence, API 200 responses, and zero console errors.

- [x] **Step 3: Run the complete local gate**

Run: `npm run qa && npm pack --dry-run`
Expected: 0 failures and a valid package file list.

- [x] **Step 4: Reinstall/reload in the isolated alpha.1 profile**

Run: `DSH_HOME=<isolated-home> pnpm dsh plugin --profile web add /tmp/dsh-icon-theme-0.2.3.tgz`
Expected: plugin loads, Settings summary is active 5/5, empty sidebar summary is waiting, and persisted icon override survives reload.
