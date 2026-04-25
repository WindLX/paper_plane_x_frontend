# Paper Plane X Frontend

前端基于 Vue 3 + TypeScript + Vite，用来提供一个轻量控制台，覆盖当前最常用的后端操作：

- 浏览项目
- 浏览项目内论文
- 查看任务队列与任务详情
- 查看 Agent traces
- 下载项目导出结果

## 1. 开发启动

```bash
cd paper_plane_x_frontend
pnpm install
cp .env.example .env
pnpm dev
```

默认地址：

- `http://127.0.0.1:5173`

## 2. 环境变量

前端当前只依赖一个公开环境变量：

- `VITE_API_BASE_URL`

默认值见：

- `.env.example`
- `.env.development`

默认本地后端地址：

- `http://127.0.0.1:8000/api/v1`

如果你想把前端连到局域网内另一台机器上的后端，只需要修改：

```env
VITE_API_BASE_URL=http://your-host:8000/api/v1
```

## 3. 构建与检查

```bash
pnpm test
pnpm vue-tsc
pnpm build
pnpm preview
pnpm build:console
```

其中：

- `pnpm build`：构建普通前端产物到 `dist/`
- `pnpm build:console`：构建并输出到 `../paper_plane_x_backend/data/console`
- `pnpm build:console:fast`：跳过类型检查，直接构建 console

## 4. 当前页面

当前控制台主要页面：

- `/projects`
- `/projects/:projectId`
- `/tasks`
- `/tasks/:taskId`

## 5. 配置实现方式

前端配置不再在业务代码里直接散落读取 `import.meta.env`，而是统一通过：

- `src/config.ts`

这样做的目的很简单：

- 默认值更集中
- 测试更容易写
- 以后如果新增前端配置项，不需要满项目搜字符串

## 6. 与后端的关系

前端本身只负责控制台，不处理论文解析逻辑。  
真正的数据处理都在后端完成，前端只是消费这些接口：

- `/api/v1/projects`
- `/api/v1/papers`
- `/api/v1/projects/{project_id}/papers`
- `/api/v1/data-process/tasks`
- `/api/v1/agent-traces`

## 7. 常见问题

### 页面能打开，但接口请求失败

优先检查：

- `VITE_API_BASE_URL` 是否正确
- 后端是否真的启动在对应地址
- 后端 CORS 配置是否允许当前来源

### 后端根路径没有出现控制台

后端只有在找到构建好的 console 静态文件后，才会托管前端页面。  
如果你想让后端直接提供 console，请先执行：

```bash
pnpm build:console
```
