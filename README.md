# NSV - Nitro Server Scaffold

基于 [Nitro](https://nitro.unjs.io/) 的后端项目脚手架 CLI 工具，一键生成开箱即用的 Node.js 服务端项目。

## 特性

- 基于 Nitro（UnJS 生态）构建，自动文件路由、HMR 开发体验
- 内置 MySQL 连接池与便捷查询方法（`query` / `queryOne` / `execute`）
- 统一 API 响应格式（`success` / `fail` / `paginated`）与错误码体系
- 请求参数校验（`validateBody` / `validateQuery`）
- CORS 中间件、请求日志与耗时追踪
- 分级日志系统（控制台 + 按日归档文件）
- Docker 多阶段构建 + docker-compose 一键部署
- 健康检查端点 `/api/health`
 
## 安装

**全局安装（推荐）：**

```bash
npm install -g @knox.zhang/nsv
```

**免安装直接使用：**

```bash
npx @knox.zhang/nsv init my-project
```

## 使用

```bash
# 交互式创建项目
nsv init

# 指定项目名称
nsv init my-server
```

CLI 会引导你输入项目名称和描述，然后自动生成项目结构并初始化 Git 仓库。

## 生成的项目结构

```
my-server/
├── server.ts              # 请求生命周期（日志、耗时记录）
├── nitro.config.ts        # Nitro 配置（运行时数据库配置、关闭钩子）
├── vite.config.ts         # Vite + Nitro 插件
├── tsconfig.json          # TypeScript 配置（含路径别名）
├── Dockerfile             # 多阶段构建
├── docker-compose.yml     # App + MySQL 编排
├── .env.example           # 环境变量模板
├── mapper/
│   ├── pool.ts            # MySQL 连接池管理
│   └── mysql.ts           # 便捷查询方法
├── middleware/
│   └── cors.ts            # CORS 中间件
├── routes/
│   └── api/
│       ├── hello.get.ts   # 示例接口
│       └── health.get.ts  # 健康检查
├── service/
│   ├── handler.ts         # defineApiHandler 统一封装
│   ├── logger.ts          # 分级日志
│   └── response.ts        # 统一响应格式
├── script/                # 构建后处理脚本
└── types/
    └── index.ts           # ErrorCode、分页类型等
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（HMR）
pnpm dev

# 构建
pnpm build

# 预览构建产物
pnpm preview

# 类型检查
pnpm typecheck
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DB_HOST` | MySQL 主机 | `localhost` |
| `DB_PORT` | MySQL 端口 | `3306` |
| `DB_USER` | MySQL 用户名 | - |
| `DB_PASSWORD` | MySQL 密码 | - |
| `DB_DATABASE` | 数据库名 | - |
| `LOG_LEVEL` | 日志级别 (`debug`/`info`/`warn`/`error`) | `info` |
| `LOG_DIR` | 日志文件目录 | `logs` |

## Docker 部署

```bash
# 创建 .env 文件并填写数据库配置
cp .env.example .env

# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f app
```

`docker-compose.yml` 包含 App 和 MySQL 两个服务，App 依赖 MySQL 健康检查通过后才启动。

## API 示例

### 统一响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

### 使用 defineApiHandler

```ts
import { defineApiHandler } from "../../service/handler";

export default defineApiHandler(
  async (event) => {
    return { items: [] };
  },
  {
    validateBody: (body) => {
      if (!body.name) return { success: false, errors: ["name is required"] };
      return { success: true };
    },
  }
);
```

### 数据库查询

```ts
import { query, queryOne, execute } from "../mapper/mysql";

// 查询列表
const users = await query<RowDataPacket[]>("SELECT * FROM users WHERE status = ?", [1]);

// 查询单行
const user = await queryOne<RowDataPacket[]>("SELECT * FROM users WHERE id = ?", [id]);

// 写操作
const result = await execute("INSERT INTO users (name) VALUES (?)", ["test"]);
```

## 错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| `0` | 成功 | 200 |
| `-1` | 未知错误 | 500 |
| `1001` | 参数校验错误 | 400 |
| `1002` | 资源不存在 | 404 |
| `1003` | 未授权 | 401 |
| `1004` | 禁止访问 | 403 |
| `2001` | 数据库连接错误 | 503 |
| `2002` | 数据库查询错误 | 500 |

## 发布

```bash
pnpm release
```

该命令会编译 CLI 代码、构建模板文件并发布到 npm。

## License

MIT
