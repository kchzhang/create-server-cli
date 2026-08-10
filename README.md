# NSV - Nitro Server Scaffold

基于 [Nitro](https://nitro.unjs.io/) 的后端项目脚手架，一键生成开箱即用的 Node.js 服务端项目。

## 快速开始

```bash
# 全局安装
npm install -g @knoxzhang/nsv

# 创建项目
nsv init my-server

# 或免安装直接使用
npx @knoxzhang/nsv init my-server
```

## 项目结构

```
my-server/
├── nitro.config.ts        # Nitro 配置（数据库、全局错误处理）
├── vite.config.ts         # Vite + Nitro 插件
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── mapper/
│   ├── pool.ts            # MySQL 连接池
│   └── mysql.ts           # query / queryOne / execute
├── middleware/
│   └── cors.ts            # CORS 中间件
├── plugins/
│   └── db.ts              # 数据库连接插件
├── routes/
│   └── api/
│       ├── hello.get.ts   # 示例接口
│       └── health.get.ts  # 健康检查
├── utils/
│   ├── error-handler.ts   # 全局错误拦截（404/5xx 友好提示）
│   ├── handler.ts         # defineApiHandler 统一封装
│   ├── logger.ts          # 分级日志
│   └── response.ts        # 统一响应格式
├── script/
└── types/
    └── index.ts           # ErrorCode、分页类型
```

## 开发

```bash
pnpm install    # 安装依赖
pnpm dev        # 启动开发服务器（HMR）
pnpm build      # 构建
pnpm preview    # 预览构建产物
pnpm typecheck  # 类型检查
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DB_HOST` | MySQL 主机 | `localhost` |
| `DB_PORT` | MySQL 端口 | `3306` |
| `DB_USER` | MySQL 用户名 | - |
| `DB_PASSWORD` | MySQL 密码 | - |
| `DB_DATABASE` | 数据库名 | - |
| `LOG_LEVEL` | 日志级别 | `info` |
| `LOG_DIR` | 日志文件目录 | `logs` |

## 用法示例

### 统一响应格式

所有接口返回 `{ code, message, data }` 格式：

```json
{ "code": 0, "message": "ok", "data": { ... } }
```

### 创建接口

```ts
import { defineApiHandler } from "../../utils/handler";

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

const users = await query<RowDataPacket[]>("SELECT * FROM users WHERE status = ?", [1]);
const user = await queryOne<RowDataPacket[]>("SELECT * FROM users WHERE id = ?", [id]);
const result = await execute("INSERT INTO users (name) VALUES (?)", ["test"]);
```

### 全局错误拦截

404 和服务端异常自动返回友好提示，不暴露内部信息：

```json
{ "code": 1002, "message": "请求的资源不存在", "data": null }
```

## 错误码

| 错误码 | 说明 | HTTP |
|--------|------|------|
| `0` | 成功 | 200 |
| `-1` | 未知错误 | 500 |
| `1001` | 参数校验错误 | 400 |
| `1002` | 资源不存在 | 404 |
| `1003` | 未授权 | 401 |
| `1004` | 禁止访问 | 403 |
| `2001` | 数据库连接错误 | 503 |
| `2002` | 数据库查询错误 | 500 |

## Docker 部署

```bash
cp .env.example .env   # 填写数据库配置
docker compose up -d
docker compose logs -f app
```

## 发布

```bash
pnpm release
```

## License

MIT
