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
