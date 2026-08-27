# Paper Plane X Frontend 开发指南

## 作用域与工具链

- 本文件适用于 frontend 独立仓库。若在 monorepo 中开发，同时遵循上级 `AGENTS.md`；冲突时以本文件的项目级规则为准。
- 本项目是 Vue 3 + TypeScript 独立 pnpm package。以 `package.json`、`pnpm-lock.yaml`、TypeScript / Vite / ESLint / Prettier 配置、本目录 `justfile` 和 `design-system/` 为事实源。
- 常用命令：`just setup`、`just dev`、`just test`、`just lint`、`just format-check`、`just typecheck`、`just build`、`just pre-commit`。依赖变化只使用 pnpm 更新 lockfile。
- `build-console` 会清空并写入 sibling backend 的 console 目录，属于跨项目生成操作；只有任务明确需要集成产物时才运行，并提前确认目标目录没有用户数据或未保存改动。

## 组件与状态边界

- view 负责页面组合，feature component 负责可复用交互，composable / store 负责状态与业务流程，API module 负责传输协议。不要在模板、展示组件或路由守卫中散落请求和跨页面业务规则。
- server state、临时 UI state 和持久化偏好必须区分；避免复制同一实体到多个独立 reactive source。异步操作显式建模 loading、empty、error、success 和 stale 状态，并处理竞态与组件卸载。
- HTTP / WebSocket 访问统一经过现有 API 层；组件不直接拼 URL、解析后端错误或建立裸连接。API 变化同步更新请求响应类型、调用方、mock、错误文案和相关 backend 契约。
- TypeScript 核心路径不使用 `any`、非必要类型断言、动态属性探测或字符串驱动的隐式状态机。外部数据在 API 边界验证或收窄，使用 discriminated union 与穷举分支表达状态。
- 不添加静默 fallback、空 catch 或永久 loading。用户可恢复的失败提供明确操作；程序错误保留可诊断上下文但不得在界面或日志暴露密钥、私有地址和论文敏感内容。

## UI、样式与可访问性

- 修改 UI 前阅读 `design-system/MASTER.md` 及相关组件，优先复用 `--ppx-*` token、workspace primitives 和现有基础组件；不硬编码主题颜色，不为单个页面复制已有组件或交互模式。
- 用户可见文案必须通过 i18n，并同时维护 `zh-CN` 与 `en-US`；不要在业务组件中硬编码可见字符串。新增 key 按现有 namespace 归类。
- 交互控件必须可键盘使用并具有可访问名称；dialog 管理焦点与关闭行为；icon-only control 提供 label；表单错误与状态变化不能只依赖颜色表达。
- 响应式改动至少检查窄屏和桌面布局，视觉改动检查亮色和暗色主题。避免无依据引入新断点、层级、阴影或动画；动画需尊重 reduced-motion。
- Markdown、数学公式和外部内容继续经过既有 sanitizer / renderer，不用 `v-html` 或手工 DOM 注入绕过安全边界。

## 测试与交付

- 配置、API client、composable、store 和纯逻辑优先添加 Vitest 回归测试；用户交互测试覆盖成功、失败、空状态和关键可访问行为。不得依赖真实 backend、网络、localStorage 残留或执行顺序。
- 小改动至少运行相关 `just test`、`just lint` 和 `just typecheck`；格式变化运行 `just format-check`；路由、构建、依赖、类型或 production 行为变化运行 `just build`。较大改动运行 `just pre-commit`。
- 视觉改动应在可运行环境中实际检查，并在交付说明中列出已检查的 viewport / theme；无法启动环境时明确说明未完成视觉验证，不用构建通过代替视觉结论。
- 不手改 `dist/`、backend console 构建目录、缓存或生成文件。不得声称未运行的验证已通过；失败需报告命令、失败项和与本次改动的关系。
- Markdown 无新段落时不因行宽机械换行；非直观的排序、评分、分页或状态算法必须注释假设，并在 `docs/` 中记录推导、边界和验证依据。
