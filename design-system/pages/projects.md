# 项目页面基准

## 角色
- `/projects` 和 `/projects/:projectId` 是产品的视觉基准。
- 其他路由页面应向这种语法迁移，而不是发明新的壳。

## 页面语法
- 以 `workspace-page` 英雄区块开始。
- 使用 `workspace-hero-grid` 分割：
  - 左侧：标题、辅助文本、汇总统计
  - 右侧：操作栏
- 汇总指标应使用 `workspace-stat-grid` 和 `workspace-stat-card`。
- 二级路由区块也应使用 `workspace-page`，不是临时白卡。
- 小型信息 chip 应使用 `workspace-chip`。

## 排版
- 页面标题：`workspace-heading-display`
- 主要区块标题：`workspace-heading-page`
- 嵌入式模块标题：`workspace-heading-section`
- 卡片或小组件标题：`workspace-heading-card`
- 元数据和操作文本：
  - 标签：`workspace-kicker` 或 `workspace-meta`
  - 描述：`workspace-body`

## 动效
- 可折叠元数据和帮助面板使用 `section-collapse`。
- 侧边栏、抽屉和模态框动效必须保持在 `src/style.css` 中定义的共享壳过渡上。
- 避免项目级面板的瞬间隐藏/显示。

## 表格
- 项目表格应放在 `workspace-page` 或 `workspace-panel` 内部。
- 使用共享的 `workspace-table` 比例，使表头具有编辑感，而不是管理员微缩感。

## 操作栏
- 创建/导出/日志/返回集群使用 `workspace-action-rail`。
- 主操作在前，次操作在后。
- 支持上下文位于操作上方，使用 `workspace-body`。

## 令牌快速参考

构建或编辑项目页面时，优先使用这些 Tailwind 工具类而非原始值：

| 用途                     | 工具类                     |
| ------------------------ | -------------------------- |
| 页面背景                 | `bg-ppx-bg`                |
| 卡片/面板背景            | `bg-ppx-bg-elevated`       |
| 内敛/微妙背景            | `bg-ppx-bg-subtle`         |
| 主文本                   | `text-ppx-text`            |
| 辅助文本                 | `text-ppx-text-soft`       |
| 弱化/元数据文本          | `text-ppx-text-muted`      |
| 默认边框                 | `border-ppx-border`        |
| 强调边框                 | `border-ppx-border-strong` |
| 交互圆角（按钮、输入框） | `rounded-ppx-interactive`  |
| 面板圆角（卡片、表格）   | `rounded-ppx-panel`        |
| 页面圆角（英雄区块）     | `rounded-ppx-page`         |
| 静止阴影                 | `shadow-ppx-rest`          |
| 悬浮阴影                 | `shadow-ppx-raised`        |
| 快速过渡                 | `duration-ppx-fast`        |
| 标准过渡                 | `duration-ppx-standard`    |

## 迁移规则
- 任务、文献库、设置和旧版文献表面应在引入任何页面特定偏差之前复制此结构。

## 项目工作台详情页

`/projects/:projectId` 默认进入概览，顶部固定显示概览、文献、文件、活动；导出是独立面板，编辑与删除在更多操作菜单。当前实现使用 `PageLayout` / `PageTopbar` 的共享壳；上述英雄区块语法用于项目列表，详情页不叠加第二套英雄区块。

概览按状态、需要关注、研究摘要、最近论文与文件、最近活动及标签与年份排列；桌面两列，窄屏单列。热门标签和年份直接显示；摘要生成必须显式点击。可点击的最近记录使用整行按钮与悬停、键盘焦点样式。

活动页复用 `AppTable`：类别、活动、结果、时间、操作五列，技术 JSON 在展开行中默认折叠。加载、空记录与失败保持相同表头和表格壳。筛选、表格、分页共用页面滚动区域，表格内部支持横向滚动。桌面筛选和重置位于关键词后，窄屏自然换行；类别与状态带图标，日期复用 Reka Calendar/Popover，支持键盘、月份选择、年份输入与清除。每页条数支持 10/20/50/100，改变后回到第一页。顶部当前标签用强调色填充和边框，不用容易被滚动容器裁切的外扩 ring。

文件树与预览在一个外层圆角面板中分栏，分隔线在面板内部留出上下间距；复用 Reka splitter 与 `PaneResizeHandle`。所有分栏填满分配的宽度，内容滚动不得挤压详情和 PDF。进度条沿用 `--ppx-*` 色彩，并保留原生进度语义与减少动画偏好。

概览与文件不重复显示内部标题栏。概览卡片使用一致的白底、标题图标和 16px 内边距；可跳转行始终有方向箭头，悬停与键盘焦点突出背景。摘要使用完整卡片宽度，标签与年份区块按内容自然定高，年份指标使用描述列表展示。
