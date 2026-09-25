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
> 5. **全面兼容适配 DSH Desktop 2.0.14+（DSH 0.1.7+）**：
>    - **修复设置修改失活**：解决新版 DSH 废弃 `settings.register()` 导致后端插件崩溃、API 挂载失败从而引发设置面板全部“更改/重置”按钮禁用失效的问题。
>    - **适配新版在线易变配置架构**：在 Schema 中为 `overrides` 和 `originalPolicy` 声明 `.volatile()`，满足新版 `SettingsForms` 在线编辑校验；通过 `unwrapVolatile` 保证配置解包纯粹无冗余包装。
>    - **配置策略声明**：通过 `settings.configure({ auto: false })` 声明展示策略，优雅屏蔽新版自动表单，完整保留插件自带的高清可视化图标选择界面。
>    - **依赖范围扩充**：`peerDependencies` 扩充支持 `0.1.7-rc.0+`，官方图标提取脚本支持自适应解析新版 `*Artwork` 矢量组件。
>
> 详见 [sync.patch](./sync.patch)。

# dsh-icon-theme

[English](README.md) | 简体中文

为 DeepSeek Harness 的设置导航和侧边栏功能自动分配统一图标，并支持逐项手动更改。

![设置页总览](docs/images/settings-overview.png)

## 为什么做这个插件

DSH 0.1.x 的设置贡献提供稳定 ID 和名称，但尚未提供图标字段，所以许多第三方页面都会回退成相同的齿轮。`dsh-icon-theme` 从实时插槽账本发现功能，优先保留可信原图标，用一套精简的 Fluent 风格图标补齐缺口，并允许用户覆盖每一项。

- 通用识别实时生效且经过优先级遮蔽后的 `settings.section` 和 `sidebar.footer.action`；只有侧边栏部分渲染、无法按顺序对应时，才使用经过审核的插件兼容记录。
- 用 `settings.section:market` 这样的稳定键保存选择，不依赖中文、英文或 DOM 顺序。
- 内置 50 个 Fluent UI 16 Regular 图标、75 个 DSH 官方 UI 图标，以及经过审核的 dsh-market 单色原图标（共 126 个）。
- 运行时不请求图标 CDN、Iconify、GitHub、webfont，也不扫描其他插件包。
- 卸载或热重载时完整恢复宿主 SVG 和插件添加的 DOM 标记。
- 明确区分“当前未渲染”和“非图标卡片”，不会假装已经更改成功。
- 目标既没有可信匹配、也没有原图标时，统一使用设置齿轮回退。

## 安装

```bash
dsh plugin --profile web add dsh-icon-theme
```

重启 `dsh web`，打开“设置 → 图标”。

从源码安装：

```bash
git clone https://github.com/yzke/dsh-icon-theme.git
cd dsh-icon-theme
npm ci
npm run build
dsh plugin --profile web add link:"$PWD"
```

DSH peer 兼容范围：`>=0.1.0-rc.6 <0.2.0-0 || >=0.1.1-rc.0 <0.2.0-0 || >=0.1.2-alpha.1 <0.2.0-0 || >=0.1.7-rc.0 <0.2.0-0`，
包含 DSH Desktop 2.0.14+（`0.1.7-rc.1`）及 GitHub 预览版本。从源码构建需要 Node.js 22 或更高版本。

## 卸载

```bash
dsh plugin --profile web remove dsh-icon-theme
```

重启 `dsh web`。插件卸载时会恢复所有宿主 SVG，并移除自身添加的 DOM 标记和样式。

## 使用方式

图标页会列出所有已发现目标、稳定键、兼容状态和当前图标来源。可以按功能名、ID 或图标搜索，也可以筛选设置、侧边栏、未识别和已自定义项目；支持逐项选择、逐项恢复自动和全部恢复自动。

![图标选择器](docs/images/icon-picker.png)

解析顺序固定为：

1. 用户手动覆盖。
2. 已审核并随包附带的插件原图标。
3. 可信的 DSH / 插件现有图标。
4. 稳定 ID 精确预设。
5. 稳定 ID 的无歧义语义推断。
6. 宿主已有回退图标；完全没有原图标时使用设置齿轮。

中英文名称只用于展示和搜索，不参与持久化映射。

## 侧边栏如何处理

| 状态 | 行为 |
| --- | --- |
| 已渲染的图标按钮 | 可以更改，默认优先保留原图标。 |
| 已注册但当前未渲染 | 显示“可预设”，出现时自动应用。 |
| 非图标卡片 | 明确报告，但不破坏卡片布局。 |
| 未知或结构变化的 DOM | 保持不动；只有唯一且经过审核的兼容记录才会匹配。 |

DSH 0.1.x 尚未提供公共图标解析接口，因此当前兼容层刻意保持范围小、可逆、遇到歧义就停。完整契约和上游建议见[设计文档](docs/design.md)。

同时安装 `dsh-better-sidebar` 时，其设置页自身图标会被视为可信原图标并默认保留；只有用户选择“替换通用回退图标”或手动覆盖时才会被替换。

## 外部插件兼容验证

测试固定抽取了真实开源项目的注册源码片段，包括 `dsh-full-remote`、`dsh-context`、`dsh-openpencil`、`dsh-approve-for-me` 和 `dsh-composer-polish`。它们证明：未安装过的设置页插件仍能被通用发现，而其他插槽上的功能不会被误认成设置或侧边栏入口。来源和固定提交见[生态兼容记录](docs/ecosystem-compatibility.md)。侧边栏回退指纹同样固定到上游提交，若这些插件后续调整 DOM，需要定期更新。

## 开发与发布门槛

```bash
npm ci
npm run qa
npm run test:web
npm pack --dry-run
```

可选的真实 DSH 冒烟测试：

```bash
DSH_E2E_URL=http://127.0.0.1:3080 npm run test:web -- -t @real-dsh
```

完整测试分层见 [TESTING.md](TESTING.md)，图标来源和许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 隐私与安全

自动识别只读取 DSH 插槽元数据和两个受支持界面的当前 DOM，不读取用户文件，也不解析其他插件的编译产物。配置通过固定命名空间、同源限定的 Host 接口保存；接口只接受 `overrides` 和 `originalPolicy`，不能读取或修改其他插件的配置。

MIT 许可证。
