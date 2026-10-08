# 组件规则

## 共享基础
- `AppButton`：操作样式的唯一真理来源。
- `AppModalShell`、`AppDialog`、`AppRightDrawer`：共享覆盖层模糊、面板密度、关闭控件和标题层级。
- `AppNotify`：与对话框和抽屉属于同一家族，不是独立的 Toast 风格。
- `JsonPanel`：虽然是技术组件，但仍属于同一产品，不是旧控制台孤岛。

## 搜索和表单组件
- 搜索栏必须在视觉上匹配通用表单控件。
- 多行技术输入仍使用与用户-facing 字段相同的边框、圆角和焦点语言。

## 数据组件

所有列表表格共用同一层壳、表头操作区和选择控件，不要在页面里重复实现：

- 壳：`AppTable` 提供 `workspace-table-shell`、左侧标题、右侧操作区和表格横向滚动容器；`workspace-table` 表格本身由领域表格通过默认插槽传入。`PaperListTable` 与 `TaskListTable` 使用该组件；其余表格沿用同样的 `workspace-table-shell` 样式。
- 表头：标题左对齐，操作区右对齐；标题栏固定 52px 高，窄屏操作区横向滚动而不换行；没有操作时不渲染操作区，也不预留空位。
- 表头操作：批量操作条放在表头右侧，不再单独占一行页面正文。`PaperListTable` 与 `TaskListTable` 暴露 `actions` 插槽并转发给 `AppTable`，页面在已选数量大于 0 时才把 `BulkActionBar` 传进去，因此零选择时表头既没有工具条也没有占位空白。
- 批量操作按钮：统一使用 `AppButton`，并带语义图标——取消 `XCircle`、重试 `RotateCcw`、删除 `Trash2`、关联 `Link2`、解除关联 `Unlink2`、移出项目 `FolderMinus`，清除选择使用 `X`。
- 选择控件：行选择与全选统一使用 `AppCheckbox`，见下节。
- 选中的行必须在模块之间看起来相关。
- 空状态应使用 `workspace-table-empty`，而不是临时 muted 文本块。

### 选择勾选框（AppCheckbox）

`AppCheckbox` 包装原生 `input[type="checkbox"]`，保留 Space 切换、焦点环、disabled 和表单语义，只把外观替换为 token 描边加 Lucide `Check` / `Minus`。

- props：`checked`、`indeterminate`、`disabled`、`label`，以及状态化可访问名称 `checkedLabel`、`indeterminateLabel`、`disabledLabel`。
- `indeterminate` 是 DOM 属性而非 HTML 属性，模板绑定无法表达；组件通过 `useIndeterminate` 在输入挂载和 prop 变化时重新写入，确保状态确定，包括改回 `false`。
- 可访问名称优先级为 `disabledLabel` > `indeterminateLabel` > `checkedLabel` > `label`；行级名称必须包含对象 id，使图标、颜色以外仍有可读的状态信息。

## 旧版文献组件
- 旧版标签页也不例外。
- 即使它们的信息架构以后会发生变化，当前的壳、结果块和输入表单必须保持在同一系统内。

## 区块图标

当页面区块或卡片有前导图标时，使用 `workspace-section-icon` 而不是手写容器：

```vue
<!-- 之前（不要这样做） -->
<div class="flex h-8 w-8 items-center justify-center rounded-lg border border-(--ppx-border) bg-(--ppx-bg-subtle)">
  <Cog class="h-4 w-4 text-(--ppx-text-soft)" />
</div>

<!-- 之后 -->
<div class="workspace-section-icon">
  <Cog class="h-4 w-4 text-(--ppx-text-soft)" />
</div>
```

## 表格迁移示例

之前：
```vue
<section class="rounded-2xl border border-(--ppx-border) bg-white p-3 shadow-(--ppx-shadow-rest) dark:bg-slate-950">
  <table class="w-full text-sm">
    <thead>
      <tr class="border-b border-(--ppx-border) text-left text-(--ppx-text-soft)">...</tr>
    </thead>
    <tbody>
      <tr class="border-b border-(--ppx-border) last:border-0">...</tr>
    </tbody>
  </table>
</section>
```

之后：
```vue
<section class="workspace-table-shell">
  <table class="workspace-table">
    <thead><tr>...</tr></thead>
    <tbody>
      <tr class="workspace-row-hover">...</tr>
    </tbody>
  </table>
</section>
```

## 应该做
- 复用表面原语。
- 复用状态 badge。
- 保持标题克制且结构化。
- 让排版和间距在颜色之前创建层级。
- 所有操作按钮使用 `AppButton`（不使用手写的 `\u003cbutton\u003e` 和临时类）。

## 不应该做
- 在一个功能中混合 `rounded-md`、`rounded-xl`、`rounded-2xl` 和任意圆角。
- 发明本地状态色板。
- 直接从原始 slate 工具类组合构建新卡片。
- 让旧组件看起来像上一代产品。
- 使用 `text-s`、`text-[11px]` 或其他任意字体大小。使用 `text-xs`、`text-sm`、`text-base` 等。

## 右侧边栏内容规范（Drawer Content）

`AppRightDrawer` 提供统一的壳（标题栏、关闭按钮、滑入动效），但内容区域需要遵循以下规范以保持模块间的一致性。

### 内容头部（Header Panel）

所有详情类抽屉（Paper、Trace、Task）的内容头部使用统一的 `workspace-panel` 结构：

```vue
<header class="workspace-panel space-y-3 p-3.5">
  <!-- 第一行：ID + 操作按钮 -->
  <div class="flex items-center justify-between gap-3">
    <CopyableText :text="entityId" mono />
    <div class="flex items-center gap-2 overflow-x-auto">
      <AppButton ... />
    </div>
  </div>
  <!-- 第二行：标题 -->
  <h3 class="workspace-section-title">{{ title }}</h3>
  <!-- 第三行：基础信息 -->
  <div class="space-y-2 text-xs text-ppx-text-soft">
    <div class="flex items-start gap-2">
      <span class="shrink-0 font-semibold text-ppx-text-muted">{{ label }}</span>
      <span>{{ value }}</span>
    </div>
  </div>
</header>
```

规则：
- ID 行和操作按钮行必须在同一行，使用 `justify-between` 分隔。
- 按钮组需要 `overflow-x-auto` 防止在小视口被挤压。
- 标题必须使用 `workspace-section-title`。
- 标签文字使用 `font-semibold text-ppx-text-muted`，值文字使用默认 `text-ppx-text-soft`。

### 元数据网格（Metadata Grid）

时间戳、计数等扁平元数据使用独立的 `workspace-panel` 和双列网格：

```vue
<div class="workspace-panel p-3.5">
  <div class="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-ppx-text-soft">
    <div class="min-w-0">
      <span class="mb-0.5 block font-semibold text-ppx-text-muted">{{ label }}</span>
      <div class="wrap-break-word">{{ value }}</div>
    </div>
  </div>
</div>
```

规则：
- 每个元数据项必须包裹在 `min-w-0` 中，防止网格溢出。
- 标签使用 `block` 布局独占一行，值为常规文本。
- 长文本（如时间戳）使用 `wrap-break-word`。

### 子面板（Subpanel）

复杂字段（如作者列表、摘要、自定义元数据）使用 `workspace-subpanel`：

```vue
<div class="workspace-subpanel p-2.5">
  <div class="workspace-label mb-0">{{ label }}</div>
  <div class="workspace-body">{{ value }}</div>
</div>
```

规则：
- 子面板通常放在 `grid gap-2 md:grid-cols-2` 中形成卡片网格。
- `workspace-label` 提供带大写和字间距的标签样式。

### 状态徽章（Status Badges）

状态、时间戳等标签使用 `workspace-badge--*`：

```vue
<div class="flex flex-wrap gap-2">
  <span class="workspace-badge workspace-badge--neutral">...updated_at...</span>
  <span class="workspace-badge workspace-badge--success">...status...</span>
</div>
```

### 错误/警告表面

错误信息使用危险徽章样式：

```vue
<div class="workspace-badge--danger rounded-ppx-interactive px-3 py-2 text-xs">
  <span class="font-semibold">错误:</span>
  <span class="wrap-break-word">{{ errorMessage }}</span>
</div>
```

### 内容区动画

- 抽屉内容根元素使用 `animate-fade-in-up`（抽屉壳本身已有 `animate-slide-in-right`）。
- 内容内部的列表项使用 `animate-stagger` 实现依次入场。

## 右侧边栏统一设计规范

本规范是「右侧边栏内容规范（Drawer Content）」的补充和细化，以 Trace 右侧边栏为标杆，对所有详情类抽屉（Paper、Trace、Task 等）的内容区域提出统一要求。

### 1. 按钮统一规范

- 所有操作按钮统一使用 `variant="outline"`，禁止在同一头部混用多种彩色 soft 按钮。
- 危险操作（如删除）使用 `tone="rose"`。
- 主操作（如编辑、重试）使用 `tone="sky"`。
- 次要操作保持默认 outline 样式，不额外着色。

### 2. 字号统一规范

| 用途       | 类名                      | 说明                           |
| ---------- | ------------------------- | ------------------------------ |
| 头部元数据 | `text-xs`                 | ID、时间戳、计数等辅助信息     |
| 标签       | `workspace-label`         | 对应 `text-xs`，带大写和字间距 |
| 正文       | `workspace-body`          | 对应 `text-sm`，摘要、描述等   |
| 区块标题   | `workspace-section-title` | 对应 `text-base`，可加图标     |

严禁使用任意字体大小，如 `text-[11px]`、`text-[13px]` 或临时组合。

### 3. 圆角统一规范

按组件尺寸使用以下圆角 token：
- `rounded-ppx-interactive`：用于按钮、badge、输入框、子面板等交互元素。
- `rounded-ppx-selection`：4px 圆角，专用于 16px 勾选框，保留方形轮廓。
- `rounded-ppx-panel`：用于卡片、抽屉内容面板等容器级表面。

禁止直接使用 `rounded-md`、`rounded-xl`、`rounded-2xl`、`rounded-lg` 等 Tailwind 原始圆角类。

### 4. 内容区块结构规范

每个独立内容区块必须是自包含的 `workspace-panel`，遵循以下结构：

规则：
- 每个区块使用 `workspace-panel space-y-3 p-3.5` 作为根容器。
- 区块标题使用 `workspace-section-title`，可带图标。
- 内部子项使用 `workspace-subpanel p-2.5` + `workspace-label` + `workspace-body`。
- 禁止在区块内部再嵌套完整的 `workspace-panel`。

### 5. 状态徽章堆叠规范

同一行内的状态徽章最多 4 个，超出时应换行或精简。

规则：
- 时间戳类信息统一使用 `workspace-badge--neutral`。
- 状态类信息使用语义色：success、warning、danger、info。
- 避免重复信息。

### 6. 冗余文本清理规范

不要在值前面添加 "结果:"、"错误:" 这类前缀标签。直接使用 `workspace-label` 作为独立标签行。

### 7. 动画规范

- 抽屉内容根元素添加 `animate-fade-in-up`。
- 列表项使用 `animate-stagger`。
- 禁止为单个文本段落或 badge 添加独立动画。

### 8. Trace 作为标杆

Trace 右侧边栏为标准参考：
1. 头部：agent badge + CopyableText + outline 按钮组。
2. 元数据网格：`workspace-panel` 包裹的 `grid grid-cols-2 gap-x-3 gap-y-2 text-xs`。
3. 消息区：`TraceMessageRenderer` 展开收起动画。
4. 底部：`JsonPanel` + 删除按钮（`tone="rose"`）。


## 可调整的阅读工作区

`PageLayout` 使用 Reka UI `SplitterGroup` 将正文、可选 PDF 和详情抽屉约束在实际可用容器内，正文可收缩，详情不会被外部内容撑出屏幕。`ResizableNavigation` 管理左侧导航面板，默认 240px，可调范围 200–480px，折叠时保留 60px 并记住展开宽度。`DrawerSplitPanels` 管理两个阅读面板，`PaneResizeHandle` 只提供样式、指针捕获与用户提交事件；尺寸计算和键盘处理由库负责，不再手写拖动算法。分隔条挂载后才注册交互；窗口失焦、指针取消和分隔条销毁时通过库导出的 group 生命周期 API 结束拖动，释放面板事件并清理句柄。

详情宽度范围为 320–960px，默认 512px；PDF 为 512–1280px，默认 768px。桌面正文面板至少保留工作区的 10%，库根据总宽度限制拖动；正文画布最小宽度为 960px，面板更窄时横向滚动，顶部栏和表格保持完整。当实际可用工作区放不下已选详情宽度、PDF 最小宽度和中间区域时阅读区浮动；<=1023px 时显示全宽单面板，打开 PDF 后暂时隐藏详情，关闭后恢复。拖动经过 iframe 时通过指针捕获与 PDF 遮罩保留事件。展开和关闭 PDF 后重新应用详情宽度，避免新面板加入时覆盖用户偏好。

拖拽结束或键盘操作完成时保存详情宽度到 `ppx-console-drawer-width`，挂载与响应式适配不覆盖偏好。方向键调整，Home/End 移动至边界，双击对应分隔条恢复默认。PDF 宽度为当前页面临时状态。
