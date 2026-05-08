# Paper Plane X 前端设计系统

## 设计方向
- 产品定位：研究工作台、编辑仪表盘，专业且克制的风格。
- 视觉目标：在 Shell、数据表格、抽屉、对话框、旧版文献面板和工具组件之间保持统一的设计语言。
- 避免：glossy glassmorphism（光泽毛玻璃）、混合圆角半径、临时的 slate 类、以及一次性的面板样式。

## 设计令牌
- 颜色：
  - 主文本使用 `--ppx-text`，辅助文本使用 `--ppx-text-soft`，元数据文本使用 `--ppx-text-muted`。
  - 主操作按钮使用 `--ppx-accent`。
  - 状态色仅使用 `--ppx-success`、`--ppx-warning`、`--ppx-danger`、`--ppx-info`。
- 圆角：
  - 交互元素：`--ppx-radius-interactive`
  - 面板：`--ppx-radius-panel`
  - 页面：`--ppx-radius-page`
- 阴影：
  - 静止表面：`--ppx-shadow-rest`
  - 悬浮覆盖层：`--ppx-shadow-raised`
- 动效：
  - 快速交互：`--ppx-motion-fast`
  - 标准覆盖层/折叠：`--ppx-motion-standard`
  - 慢速区块展开：`--ppx-motion-slow`
  - 共享缓动：
    - `--ppx-ease` 用于 hover、focus、行高亮和 chip 动效
    - `--ppx-ease-emphasis` 用于抽屉、侧边栏和模态框的入场动效

## 动画系统

参考 ChatGPT 风格：流畅、克制、有呼吸感的微交互。

### 设计原则
- 动画是为了引导注意力，不是为了炫技。
- 所有入场动画统一从下方淡入（fade-in-up）。
- 避免同时出现多个复杂的动画。
- 支持 `prefers-reduced-motion` 媒体查询。

### 缓动曲线

| 名称                  | 曲线                                      | 用途                               |
| --------------------- | ----------------------------------------- | ---------------------------------- |
| `--ppx-ease-smooth`   | `cubic-bezier(0.16, 1, 0.3, 1)`           | 主要入场动画（内容、卡片、列表项） |
| `--ppx-ease`          | `cubic-bezier(0.2, 0.8, 0.2, 1)`          | Hover、focus、行高亮               |
| `--ppx-ease-emphasis` | `cubic-bezier(0.16, 1, 0.3, 1)`           | 抽屉、侧边栏、模态框入场           |
| `--ppx-ease-bounce`   | `cubic-bezier(0.34, 1.56, 0.64, 1)`       | 按钮点击反馈（极短暂）             |
| `--ppx-ease-spring`   | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | 弹出菜单、toast                    |

### 入场动画工具类

| 工具类                   | 效果           | 时长          |
| ------------------------ | -------------- | ------------- |
| `animate-fade-in`        | 淡入           | 250ms         |
| `animate-fade-in-up`     | 从下方淡入     | 400ms         |
| `animate-fade-in-down`   | 从上方淡入     | 300ms         |
| `animate-slide-in-right` | 从右侧滑入     | 350ms         |
| `animate-slide-in-left`  | 从左侧滑入     | 350ms         |
| `animate-scale-in`       | 缩放入场       | 300ms         |
| `animate-stagger`        | 子元素依次入场 | 每项延迟 40ms |

### 页面切换过渡

所有页面切换使用 Vue `<Transition name="page" mode="out-in">`：
- Enter：opacity 0 → 1 + translateY(10px) → 0，250ms / 350ms
- Leave：opacity 1 → 0，150ms（快速离场避免重叠）

在 `src/App.vue` 中已为 `<RouterView />` 包裹此过渡。

### 加载动画

- **Skeleton**：使用 `animate-shimmer` 为骨架屏添加流光效果。
- **Spinner**：使用 `animate-spin-ring` 为环形加载添加旋转动画。

### 微交互

| 工具类        | 效果                 |
| ------------- | -------------------- |
| `hover-lift`  | Hover 时向上微抬 1px |
| `hover-scale` | Hover 时放大到 1.02  |

### 使用示例

列表项入场：
```vue
<ul class="animate-stagger space-y-2">
  <li v-for="item in items" :key="item.id" class="workspace-panel p-3">
    {{ item.name }}
  </li>
</ul>
```

卡片 hover：
```vue
<div class="workspace-panel hover-lift cursor-pointer">
  ...
</div>
```

模态框内容入场：
```vue
<div class="animate-fade-in-up space-y-4">
  <h2 class="workspace-section-title">标题</h2>
  <p class="workspace-body">内容...</p>
</div>
```

## 表面规则
- 路由级别的英雄区块或主要页面区块使用 `workspace-page`。
- 标准卡片、抽屉、模态框和二级模块使用 `workspace-panel`。
- 嵌套在更强面板内部的内敛区块使用 `workspace-panel-inset`。
- JSON 包装器、统计卡片和内联结果块等紧凑嵌套表面使用 `workspace-subpanel`。
- 不要手写新的面板壳，直接使用 `rounded-* border-slate-* bg-white` 的组合。

## 排版
- `h1-h4` 使用已在 `src/style.css` 中定义的双语衬线标题字体族。
- 中文和英文标题都走衬线路线。
- 正文、表单、表格单元格和元数据保持在无衬线栈上。
- 区块标签和元数据使用 `workspace-kicker` 或 `workspace-label` 的全大写 tracking 标签。
- 正文复制使用 `workspace-body`。
- 技术标识符和 DSL 示例使用 `workspace-code`。
- 首选标题工具类：
  - `workspace-heading-display`
  - `workspace-heading-page`
  - `workspace-heading-section`
  - `workspace-heading-card`

## 表单
- 输入框、文本域和下拉框必须使用：
  - `workspace-input`
  - `workspace-textarea`
  - `workspace-select`
- 标签必须使用 `workspace-label`。
- 当可见标签实用时，不允许仅使用 placeholder。

## 表格
- 所有表格必须使用：
  - `workspace-table-shell`
  - `workspace-table`
  - `workspace-row-hover`
  - `workspace-row-selected`
  - `workspace-table-empty`
- 表头和排序控件应使用共享的较大标题比例。不再允许使用旧的 11px 管理员表头外观。
- 不要为项目、论文、任务、矩阵或历史表格创建独立的视觉语言。

## 页面语法
- 路由级示例页面应由以下元素构建：
  - `workspace-page`
  - `workspace-hero-grid`
  - `workspace-stat-grid`
  - `workspace-stat-card`
  - `workspace-action-rail`
  - `workspace-chip`
- 当前的基准是项目页面族。详见 `design-system/pages/projects.md`。

## 按钮和操作
- 所有操作都通过 `AppButton`，除非它们是路由链接或小型内联图标控件。
- `AppButton` 拥有 tone、variant、size、loading、icon-only 和 emphasis 行为。
- 纯图标控件必须有可访问的名称。
- 小型关闭/取消按钮应使用 `workspace-icon-button`。

## 状态语言
- 语义 chip 和状态必须使用：
  - `workspace-badge--success`
  - `workspace-badge--warning`
  - `workspace-badge--danger`
  - `workspace-badge--info`
  - `workspace-badge--neutral`
- 不要在每个功能内部独立映射状态颜色。

## 侧边栏（Sidebar）

### 字体颜色规则
- **默认状态**：所有文本和图标使用 `text-ppx-text-soft`。
- **Hover 状态**：文本和图标变为正常颜色（`text-ppx-text`，通过 `group-hover:text-current` 或 `hover:text-ppx-text` 实现）。
- **选中状态（Select/Active）**：文本和图标使用 `text-ppx-text`，背景使用 `bg-ppx-bg-elevated`，并加上 `shadow-ppx-rest`。

### 背景规则
- **Hover 背景**：所有可交互项统一使用 `hover:bg-ppx-bg-elevated/60`。
- **选中背景**：使用 `bg-ppx-bg-elevated` + `shadow-ppx-rest`。
- **过渡**：统一使用 `duration-ppx-fast transition-colors`。

### 结构规则
- 所有可交互行使用相同的高度：`h-9`（导航项、项目项、操作按钮），分组标题使用 `h-8`。
- 统一内边距：`px-2`。
- 统一圆角：`rounded-xl`。
- 图标尺寸：导航项 `h-4.5 w-4.5`，项目项 `h-4 w-4`。
- 布局：`flex items-center gap-2.5`。

### 图标颜色规则
- 未选中/未 hover 时：图标使用 `text-ppx-text-soft`。
- 选中时：图标不额外设置颜色类，继承父容器的 `text-ppx-text`。
- Hover 时：图标通过 `group-hover:text-current` 跟随父容器颜色变化。

## 可访问性
- 纯图标按钮需要 `aria-label`。
- 警告表面在适当的地方必须使用 `role="alert"` 或 `role="alertdialog"`。
- 键盘焦点必须保持可见和一致。
- 颜色不能是唯一的状态指示器，应添加文本或图标。

## Tailwind v4 令牌策略

所有设计令牌都通过 Tailwind v4 的 `@theme inline` 块在 `src/style.css` 中注册。这会将每个 `--ppx-*` CSS 变量暴露为一等 Tailwind 工具类：

| 令牌类别 | 工具类前缀                | 示例                                                   |
| -------- | ------------------------- | ------------------------------------------------------ |
| 颜色     | `bg-`、`text-`、`border-` | `bg-ppx-bg`、`text-ppx-text-soft`、`border-ppx-border` |
| 圆角     | `rounded-`                | `rounded-ppx-interactive`、`rounded-ppx-panel`         |
| 阴影     | `shadow-`                 | `shadow-ppx-rest`、`shadow-ppx-raised`                 |
| 缓动     | `ease-`                   | `ease-ppx`、`ease-ppx-emphasis`                        |
| 时长     | `duration-`               | `duration-ppx-fast`、`duration-ppx-standard`           |

**规则：**
- 永远不要在组件模板中硬编码 `slate-*`、`bg-white`、`text-white` 或 `dark:bg-slate-*`。始终使用 `--ppx-*` 令牌。
- 覆盖层背景（模态框、抽屉、侧边栏）可以使用 `bg-black/{opacity}`，因为它们是全局的，不应在暗色模式下反转。
- 不要发明新的一次性工具类，如 `text-s` 或 `text-[11px]`。使用 Tailwind 内置的比例：`text-xs`、`text-sm`、`text-base`、`text-lg`、`text-xl`、`text-2xl`。

## 迁移检查清单

编辑或创建组件时，请验证：

- [ ] class 属性中没有剩余的 `slate-*` 颜色。
- [ ] 没有 `bg-white` / `dark:bg-slate-950` 组合。使用 `bg-ppx-bg-elevated`。
- [ ] 没有任意字体大小（`text-[11px]`、`text-[12px]`、`text-[13px]`、`text-[15px]`、`text-[1.35rem]`）。使用标准 Tailwind 字体大小工具类。
- [ ] 没有任意圆角（`rounded-[0.875rem]`、`rounded-[1rem]`、`rounded-[0.7rem]`）。使用 `rounded-ppx-interactive`、`rounded-ppx-panel`、`rounded-ppx-page`。
- [ ] 表面使用 `workspace-page`、`workspace-panel`、`workspace-panel-inset` 或 `workspace-subpanel`。
- [ ] 表格使用 `workspace-table-shell` + `workspace-table`。
- [ ] 表单使用 `workspace-input`、`workspace-textarea`、`workspace-select`。
- [ ] 按钮使用 `AppButton`（不是手写带临时类的 `<button>`）。
- [ ] 状态 chip 使用 `workspace-badge--*` 类。
- [ ] 区块标题中的图标使用 `workspace-section-icon`。

## 迁移规则
- 编辑组件时，首先将原始的一次性表面类替换为最近的共享表面原语。
- 如果组件无法适配当前原语，请在添加另一个定制样式集群之前扩展设计系统。
- 新页面工作应首先继承项目基线，然后记录任何合理的页面特定覆盖。
