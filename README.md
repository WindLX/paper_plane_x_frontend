# Paper Plane X Frontend

Vue 3 控制台，连接后端 API。覆盖项目管理、任务监控、论文浏览、Settings 配置。

## 启动

```bash
pnpm install && cp .env.example .env
```

`.env.development` 指定后端地址，按实际修改：

```bash
# .env.development
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

```bash
pnpm dev
```

`http://127.0.0.1:5173`

## 让后端托管

构建产物输出到后端 `data/console/`，之后 `http://127.0.0.1:8000/` 即可访问：

```bash
pnpm build:console
```

## 命令

| 命令                      | 作用                                            |
| ------------------------- | ----------------------------------------------- |
| `pnpm dev`                | 开发服务器                                      |
| `pnpm build`              | 构建到 `dist/`                                  |
| `pnpm build:console`      | 构建到 `../paper_plane_x_backend/data/console/` |
| `pnpm build:console:fast` | 同上，跳过 type-check                           |
| `pnpm test`               | 单元测试                                        |