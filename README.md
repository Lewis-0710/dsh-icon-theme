> [!NOTE]
> **Fork 维护版本** | 本仓库是 [yzke/dsh-icon-theme](https://github.com/yzke/dsh-icon-theme) 的维护分支。
>
> **与上游差异**：
> 1. **脱离主题单选互斥**：包名与 Cordis 插件名变更为 `dsh-icon-theme-custom`，避免命中 `dshmarket` 线上注册表的 `theme` 分类互斥逻辑（`activateTheme`），使图标插件能与 `dsh-theme-liquid-glass` 等纯主题插件无冲突共存。
> 2. **内置矢量图标升级为最新官方形态**：
>    - 插件市场（`plugin.market`）内置图标升级为 DSH 最新官方带右上角倾斜悬浮积木的矢量设计，替换旧版呆板九宫格形态。
>    - DSH 官方 UI 原语图标升级至 75 个（同步自 DSH 宿主 `0.1.5-rc.2`），包含新版闹钟、时钟、上下文注入、数据库、仪表等，内置图标总数扩充至 126 个。
> 3. **默认图标定制**：自身设置菜单（`settings.section:icon-theme`）预设图标配置为 DSH 自带的“图像”图标（`image`），在默认策略下即刻生效。
> 4. **保护原生与第三方专有图标（无硬编码通用机制）**：
>    - **防止强行覆盖插件市场**：移除上游强制将插件市场映射为旧版九宫格的写死规则，优先放行 `dshmarket` 官方自带的高清图标。
>    - **通用识别第三方专有图标**：通过通用规范自动识别第三方插件注入的自定义 DOM 标记，不硬编码任何具体插件名称或属性名；在默认策略下优先保留原图（`prefer`），杜绝粗暴劫持与覆盖。
>
> 详见 [sync.patch](./sync.patch)。

# dsh-icon-theme

English | [简体中文](README.zh.md)

Automatic, coherent, and user-customizable icons for DeepSeek Harness Settings and sidebar actions.

![Settings overview](docs/images/settings-overview.png)

_Screenshots use the Chinese locale; the plugin ships equivalent English labels._

## Why this plugin

DSH 0.1.x settings contributions expose stable IDs and labels, but not an icon field. As a result, many third-party pages fall back to the same gear. `dsh-icon-theme` discovers the live slot ledger, preserves trustworthy original icons, fills recognizable gaps with a small Fluent-style pack, and lets the user override every supported target.

- Discovers live winning `settings.section` and `sidebar.footer.action` contributions generically. Audited per-plugin records are used only when a sidebar is partially rendered and cannot be correlated by order.
- Stores choices by stable key, such as `settings.section:market`, never by translated labels or DOM position.
- Ships 50 curated Fluent UI 16 Regular glyphs, 75 official DSH UI glyphs, and the audited monochrome dsh-market glyph (126 total).
- Uses no icon CDN, webfont, Iconify API, GitHub request, or package scanning at runtime.
- Restores every host SVG and owned DOM marker on unload or hot reload.
- Reports non-rendered contributions and non-icon cards instead of pretending they were changed.
- Falls back to the Settings gear when a target has neither a trustworthy match nor an original icon.

## Install

```bash
dsh plugin --profile web add dsh-icon-theme
```

Restart `dsh web`, then open **Settings → Icons**.

To install from a source checkout instead:

```bash
git clone https://github.com/yzke/dsh-icon-theme.git
cd dsh-icon-theme
npm ci
npm run build
dsh plugin --profile web add link:"$PWD"
```

Supported DSH peer range: `>=0.1.0-rc.6 <0.2.0-0 || >=0.1.1-rc.0 <0.2.0-0 || >=0.1.2-alpha.1 <0.2.0-0`.
This includes the source-only `dsh-v0.1.2-alpha.1` GitHub preview. Node.js 22 or newer is required for source builds.

## Uninstall

```bash
dsh plugin --profile web remove dsh-icon-theme
```

Restart `dsh web`. The plugin restores every host SVG and removes all owned DOM markers and styles on unload.

## Use

The page lists every discovered target, its stable key, its compatibility state, and the source of the current icon. Search by feature name, ID, or icon; filter Settings/sidebar/unrecognized/customized entries; choose a glyph; or restore one/all targets to automatic behavior.

![Icon picker](docs/images/icon-picker.png)

Resolution is deterministic:

1. User override.
2. Audited, bundled plugin glyph.
3. Trustworthy DSH/plugin original.
4. Exact stable-ID preset.
5. Unambiguous stable-ID inference.
6. Existing host fallback, or Settings gear when no original exists.

Localized labels are display and search text only. They never decide a persisted mapping.

## Sidebar behavior

| State | Behavior |
| --- | --- |
| Rendered icon action | Changeable; the original is preserved by default. |
| Registered but not rendered | Listed as “can preset”; the override applies when it appears. |
| Non-icon card | Reported but deliberately left unchanged. |
| Unknown or changed DOM | Left untouched unless a unique audited compatibility record exists. |

The compatibility layer is intentionally narrow and reversible because DSH 0.1.x does not yet expose a public icon resolver. See [the design note](docs/design.md) for the contract and upstream direction.

When `dsh-better-sidebar` is installed, its own Settings row icon is treated as a trusted original and preserved by default. It is replaced only when the user chooses `replace-generic` (or a manual override).

## Ecosystem checks

Compatibility fixtures are pinned to real open-source registration excerpts, including `dsh-full-remote`, `dsh-context`, `dsh-openpencil`, `dsh-approve-for-me`, and `dsh-composer-polish`. They prove that an unknown Settings section is discovered generically, while contributions to unrelated surfaces are not misidentified. Details and pinned commits are in [ecosystem compatibility](docs/ecosystem-compatibility.md). The sidebar fallback fingerprints are also pinned to upstream revisions and may need periodic updates if those plugins change their DOM.

## Development and release gate

```bash
npm ci
npm run qa
npm run test:web
npm pack --dry-run
```

For the optional live-host smoke test:

```bash
DSH_E2E_URL=http://127.0.0.1:3080 npm run test:web -- -t @real-dsh
```

The full testing contract is documented in [TESTING.md](TESTING.md). Icon sources and licenses are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Privacy and security

Detection reads only DSH slot metadata and the two rendered UI surfaces. The plugin does not inspect user files or other plugins' bundles. Settings use a fixed-namespace, same-origin Host endpoint that accepts only `overrides` and `originalPolicy`; it cannot read or mutate another plugin's namespace.

MIT licensed.
