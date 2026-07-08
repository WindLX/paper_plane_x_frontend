# Paper Plane X Frontend

Paper Plane X Frontend 是连接 Paper Plane X Backend 的 Vue 3 Web 控制台。它面向日常使用者：创建项目、上传和查看论文、管理项目文件、观察后台任务、配置 LLM 和 PDF Parser，都可以在这里完成。

## 主要页面

| 页面 | 用途 |
| --- | --- |
| Project Files | 管理项目沙箱里的笔记、草稿、JSON/CSV/YAML 文件 |
| Project Papers | 查看项目关联论文、处理状态和 quick scan |
| Library | 浏览全库论文、搜索、打开论文详情抽屉 |
| Tasks | 查看 PDF 解析和 Agent 处理任务状态 |
| Agent Trace | 查看 LLM 调用与工具调用记录 |
| Settings | 配置外观、语言、LLM Provider、Agent LLM、PDF Parser、Data Process |

## 界面预览

项目文件页：

![项目文件页](../docs/assets/screenshots/project-files.png)

文献列表：

![文献列表](../docs/assets/screenshots/library.png)

论文详情：

![论文详情](../docs/assets/screenshots/paper-detail.png)

任务监控：

![任务监控](../docs/assets/screenshots/tasks.png)

设置页：

![设置页](../docs/assets/screenshots/settings.png)

## 启动前准备

先启动后端：

```bash
cd ../paper_plane_x_backend
uv sync
uv run app
```

默认 API 地址：

```text
http://127.0.0.1:8000/api/v1
```

## 开发启动

安装依赖：

```bash
pnpm install
cp .env.example .env
```

如需指定后端地址，在 `.env.development` 或 `.env` 中配置：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

启动开发服务器：

```bash
pnpm dev
```

访问：

```text
http://127.0.0.1:5173
```

## 由后端托管

如果希望只启动后端、并让后端直接托管前端页面：

```bash
pnpm build:console
```

构建产物会写入：

```text
../paper_plane_x_backend/data/console/
```

然后访问：

```text
http://127.0.0.1:8000
```

这种模式下，后端会向前端注入正确的 API base URL，不需要手动配置 `VITE_API_BASE_URL`。

## 常用命令

推荐使用 `just`：

```bash
just dev
just lint
just test
just build
just build-console
just pre-commit
```

原始 `pnpm` 命令：

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm lint` | ESLint 检查 |
| `pnpm lint:fix` | 自动修复可修复的 lint 问题 |
| `pnpm format` | Prettier 格式化 |
| `pnpm format:check` | 检查格式 |
| `pnpm test` | 运行 Vitest |
| `pnpm build` | 类型检查并构建到 `dist/` |
| `pnpm build:console` | 构建到后端 `data/console/` |
| `pnpm build:console:fast` | 跳过 type-check 的 console 构建 |

## 首次使用建议

1. 打开 Settings。
2. 添加 LLM Provider。
3. 为 `extraction`、`analysis`、`fact_check`、`deep_diver`、`query_builder`、`global_finder` 绑定 Provider。
4. 确认 PDF Parser 配置。
5. 创建项目。
6. 上传论文，等待 Tasks 页面任务完成。
7. 回到项目页面查看论文、写项目文件和导出结果。

## 配置说明

前端 API 地址解析优先级：

1. 后端托管时注入的运行时配置。
2. Vite 环境变量 `VITE_API_BASE_URL`。
3. 默认值 `http://127.0.0.1:8000/api/v1`。

开发环境通常使用第 2 种；后端托管模式使用第 1 种。

## License

Paper Plane X Frontend 使用 [GNU Affero General Public License v3.0 or later](LICENSE)。
