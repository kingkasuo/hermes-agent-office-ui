# Hermes Agent Office UI

像素风格的 AI Agent 监控管理平台。

## 功能介绍

### 前端特性
- **实时监控仪表盘** - 展示多个 AI Agent 的运行状态
- **任务分布可视化** - 甜甜圈图展示任务完成/进行中/失败状态
- **系统指标图表** - CPU/内存使用率的实时折线图
- **Agent 状态显示** - 在线/忙碌/空闲/离线/错误 五种状态
- **活动日志流** - 实时更新的 Agent 操作日志

### 后端特性
- RESTful API - 提供 Agent 管理接口
- 健康检查端点 - 监控系统状态
- WebSocket 实时推送 - 支持实时数据更新
- Prisma ORM - 内置数据库 schema

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 15 + React 19 |
| 样式 | Tailwind CSS 4 |
| 后端 | Next.js API Routes |
| 数据库 | Prisma + SQLite |
| 实时通信 | Socket.IO |

## 项目结构

```
hermes-agent-office-ui/
├── frontend/          # Next.js 前端应用
│   ├── app/          # 页面路由
│   ├── components/    # React 组件
│   └── types/        # TypeScript 类型
├── backend/          # Next.js 后端 API
│   ├── prisma/      # 数据库 schema
│   └── src/app/api/ # API 路由
└── shared/         # 共享类型定义
```

## 安装

### 前端安装

```bash
cd frontend
npm install
```

### 后端安装

```bash
cd backend
npm install
```

## 启动

### 开发模式

终端 1 - 启动前端：
```bash
cd frontend
npm run dev
```
访问 http://localhost:3000

终端 2 - 启动后端：
```bash
cd backend
npm run dev
```
API 地址 http://localhost:3001

### 生产构建

```bash
# 前端构建
cd frontend
npm run build
npm run start

# 后端构建
cd backend
npm run build
npm run start
```

## 页面说明

| 路径 | 说明 |
|------|------|
| `/` | 登录/首页 |
| `/dashboard` | 监控仪表盘 (实时数据可视化) |

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/agents` | GET, POST | 获取/创建 Agent |
| `/api/agents/[id]` | GET, PUT, DELETE | 单个 Agent 操作 |
| `/api/health` | GET | 健康检查 |

## 开发规范

- 使用 TypeScript 强类型
- 使用 Tailwind CSS 样式
- 遵循 Next.js App Router 规范
- 使用 ESLint 进行代码检查