# Hermes Agent Office UI

像素风格的 AI Agent 监控管理平台。

## 功能介绍

### 前端特性
- **像素办公室场景** - 独特的像素风格 Agent 展示，每个 Agent 有自己的工位和状态动画
- **实时监控仪表盘** - 展示多个 AI Agent 的运行状态
- **任务分布可视化** - 甜甜圈图展示任务完成/进行中/失败状态
- **系统指标图表** - CPU/内存使用率的实时折线图
- **Agent 状态显示** - 在线/忙碌/空闲/离线/错误 五种状态
- **活动日志流** - 实时更新的 Agent 操作日志
- **响应式设计** - 支持桌面和移动设备

### 后端特性
- RESTful API - 提供 Agent 和 Task 管理接口
- WebSocket 实时推送 - 支持实时数据更新
- SQLite 数据库 - 零依赖的持久化存储
- Prisma ORM - 类型安全的数据库操作
- 内存缓存 - 高性能的实时状态管理

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 15 + React 19 |
| 样式 | Tailwind CSS 3 |
| UI 组件 | shadcn/ui |
| 动画 | Framer Motion |
| 图表 | Recharts |
| 状态管理 | Zustand |
| 后端 | Next.js API Routes |
| 数据库 | Prisma + SQLite |
| 实时通信 | WebSocket (ws) |

## 项目结构

```
hermes-agent-office-ui/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── app/api/        # API 路由
│   │   │   ├── agents/     # Agent API
│   │   │   ├── tasks/      # Task API
│   │   │   ├── logs/       # Log API
│   │   │   └── health/     # Health check
│   │   ├── lib/            # 工具库
│   │   │   ├── prisma.ts   # Prisma client
│   │   │   ├── memory-store.ts  # 内存缓存
│   │   │   └── websocket-server.ts  # WebSocket
│   │   └── server/         # 服务层
│   │       ├── agent-monitor.ts  # Agent监控
│   │       └── log-collector.ts  # 日志收集
│   ├── prisma/             # 数据库 schema
│   └── data/               # SQLite 数据文件
├── frontend/                # 前端应用
│   ├── app/                # Next.js App Router
│   │   ├── (dashboard)/    # Dashboard 路由组
│   │   │   ├── page.tsx    # 主页 - 仪表盘
│   │   │   ├── agents/     # Agent 管理
│   │   │   ├── tasks/      # 任务管理
│   │   │   ├── logs/       # 日志查看
│   │   │   └── analytics/  # 数据分析
│   │   └── layout.tsx      # 根布局
│   ├── components/         # React 组件
│   │   ├── pixel-office/   # 像素办公室组件
│   │   ├── dashboard/      # 仪表盘组件
│   │   └── ui/             # shadcn/ui 组件
│   ├── hooks/              # 自定义 Hooks
│   └── lib/                # 工具库
└── shared/                  # 共享类型和常量
    ├── types/              # TypeScript 类型
    └── constants/          # 常量定义
```

## 安装

### 后端安装

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
```

### 前端安装

```bash
cd frontend
npm install
```

## 启动

### 开发模式

终端 1 - 启动后端：
```bash
cd backend
npm run dev
```
API 地址 http://localhost:3001

终端 2 - 启动前端：
```bash
cd frontend
npm run dev
```
访问 http://localhost:3000

### 生产构建

```bash
# 后端构建
cd backend
npm run build
npm run start

# 前端构建
cd frontend
npm run build
npm run start
```

## 页面说明

| 路径 | 说明 |
|------|------|
| `/` | 主页 - 仪表盘（实时数据可视化）|
| `/agents` | Agent 管理页面 |
| `/tasks` | 任务管理页面 |
| `/logs` | 日志查看页面 |
| `/analytics` | 数据分析页面 |

## API 端点

### Agents
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/agents` | GET | 获取所有 Agent |
| `/api/agents` | POST | 创建新 Agent |
| `/api/agents/[id]` | GET | 获取单个 Agent |
| `/api/agents/[id]` | PATCH | 更新 Agent |
| `/api/agents/[id]` | DELETE | 删除 Agent |

### Tasks
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/tasks` | GET | 获取所有任务 |
| `/api/tasks` | POST | 创建新任务 |
| `/api/tasks/[id]` | GET | 获取单个任务 |
| `/api/tasks/[id]` | PATCH | 更新任务 |
| `/api/tasks/[id]` | DELETE | 删除任务 |
| `/api/tasks/stats` | GET | 获取任务统计 |

### Logs
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/logs` | GET | 获取日志 |
| `/api/logs/stats` | GET | 获取日志统计 |

### Stats
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/stats` | GET | 获取仪表盘统计 |

### WebSocket
| 端点 | 说明 |
|------|------|
| `ws://localhost:3001/ws` | WebSocket 连接 |

## Agent 状态

- **ONLINE** - 在线，准备接收任务
- **OFFLINE** - 离线
- **BUSY** - 忙碌，正在执行任务
- **IDLE** - 空闲，在线但无任务
- **ERROR** - 错误状态

## 开发计划

- [x] Phase 1: 项目初始化与基础架构
- [x] Phase 2: 像素办公室核心组件
- [x] Phase 3: 后端 API 与实时通信
- [x] Phase 4: 数据可视化仪表盘
- [x] Phase 5: 界面美化和功能完善

## 开发规范

- 使用 TypeScript 强类型
- 使用 Tailwind CSS 样式
- 遵循 Next.js App Router 规范
- 使用 shadcn/ui 组件库
- 组件和页面使用函数式组件
- 使用 SWR 进行数据获取
- WebSocket 用于实时更新
