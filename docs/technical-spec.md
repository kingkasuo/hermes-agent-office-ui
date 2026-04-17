# Hermes Agent 像素办公室看板 - 技术方案

## 项目背景与目标

### 背景
Hermes Agent（由 Nous Research 开发）是一种具有自我改进能力的 AI 代理系统。当前缺乏直观的方式来监控和可视化多个 Agent 的实时工作状态。

### 目标
构建一个像素风格（Pixel Art）的 AI 办公室看板，实现：
- **实时可视化**：谁在做什么、昨天做了什么、现在是否在线
- **监控状态**：Agent 运行状态、任务进度、资源消耗
- **日志追踪**：抽象日志数据的可视化呈现
- **管理风格**：ui-ux-pro-max 现代化管理界面风格

---

## 功能需求描述

### 核心功能模块

#### 1. Agent 实时监控
| 功能 | 描述 |
|------|------|
| 在线状态 | 显示 Agent 是否在线（像素小人在工位上/离开） |
| 当前任务 | 展示 Agent 正在执行的任务类型和进度 |
| 活动历史 | 查看 Agent 过去 24 小时的任务完成情况 |
| 性能指标 | CPU、内存、API 调用次数等关键指标 |

#### 2. 像素办公室场景
| 元素 | 说明 |
|------|------|
| 工位布局 | 每个 Agent 有自己的像素风格工位 |
| 动态动画 | 工作中、休息中、离线等不同状态的像素动画 |
| 交互元素 | 点击工位查看 Agent 详情 |
| 环境氛围 | 日夜切换、像素粒子效果 |

#### 3. 日志与数据可视化
| 功能 | 描述 |
|------|------|
| 实时日志流 | WebSocket 推送的日志实时显示 |
| 任务时间线 | 甘特图形式展示任务执行时间轴 |
| 统计图表 | 任务完成率、成功率、平均响应时间 |
| 告警通知 | 异常状态时的视觉提示 |

#### 4. 管理功能
| 功能 | 描述 |
|------|------|
| Agent 配置 | 增删改查 Agent 配置 |
| 任务调度 | 手动触发、暂停、停止任务 |
| 权限管理 | 不同角色的访问控制 |

---

## 技术架构

### 整体架构图
```
┌─────────────────────────────────────────────────────────────┐
│                      前端层 (Next.js App Router)              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ 像素办公室场景 │ │ 仪表盘/图表   │ │ Agent 管理界面       │ │
│  │  (Canvas)    │ │  (Charts)   │ │  (Data Tables)      │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                          │                                  │
│                    WebSocket / SSE                          │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                      后端层 (Next.js API Routes)             │
│                          │                                   │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │                   Next.js Server                        │  │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────────┐   │  │
│  │  │ API Routes │ │ WebSocket  │ │  Server Actions  │   │  │
│  │  │ (REST)     │ │  Server    │ │                  │   │  │
│  │  └────────────┘ └────────────┘ └──────────────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                      数据层 (零依赖架构)                      │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────────┐ │
│  │ In-Memory  │ │   SQLite   │ │ Log Files / Agent API    │ │
│  │ 实时状态缓存 │ │ (文件型数据库)│ │ (外部 Agent 数据源)       │ │
│  │ (Node.js)  │ │            │ │                          │ │
│  └────────────┘ └────────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈选型

#### 前端
| 技术 | 用途 | 版本 |
|------|------|------|
| Next.js 15 | 全栈 React 框架 | ^15.x |
| React 19 | UI 库 | ^19.x |
| TypeScript | 类型安全 | ^5.x |
| Tailwind CSS 4 | 原子化 CSS | ^4.x |
| shadcn/ui | UI 组件库 | latest |
| Framer Motion | 动画效果 | ^11.x |
| Recharts | 数据图表 | ^2.x |
| Zustand | 状态管理 | ^5.x |
| SWR | 数据获取 | ^2.x |
| @pixi/react | 游戏渲染引擎（可选） | ^7.x |

#### 后端
| 技术 | 用途 | 版本 |
|------|------|------|
| Next.js API Routes | REST API | ^15.x |
| Next.js Server Actions | 服务端逻辑 | built-in |
| Socket.io | 实时通信 | ^4.x |
| Prisma | ORM | ^6.x |
| In-Memory Store | 实时状态缓存 | built-in |

#### 数据存储
| 技术 | 用途 |
|------|------|
| SQLite | 文件型持久化数据库 |
| In-Memory Map | 实时状态缓存（Node.js 内存） |
| 本地文件 | 日志文件存储 |

---

## 项目目录结构规范

本项目采用 **前后端分离** 的目录结构，便于独立开发、部署和维护。

### 目录结构总览

```
hermes-agent-office-ui/
├── backend/                      # 后端服务 (Node.js + Next.js API)
│   ├── src/                      # 源代码
│   ├── prisma/                   # 数据库配置 (SQLite)
│   ├── data/                     # SQLite 数据文件目录
│   ├── package.json              # 后端依赖
│   └── tsconfig.json             # TypeScript 配置
├── frontend/                     # 前端应用 (Next.js App)
│   ├── app/                      # Next.js App Router
│   ├── components/               # React 组件
│   ├── lib/                      # 工具库
│   ├── hooks/                    # 自定义 Hooks
│   ├── types/                    # TypeScript 类型
│   ├── public/                   # 静态资源
│   ├── styles/                   # 样式文件
│   ├── package.json              # 前端依赖
│   └── next.config.js            # Next.js 配置
├── shared/                       # 共享代码 (类型定义、常量等)
│   ├── types/                    # 共享类型
│   └── constants/                # 共享常量
├── docker-compose.yml            # 容器编排配置
└── README.md                     # 项目说明
```

### backend/ 目录详解

后端服务目录，包含所有服务端代码和数据存储。

```
backend/
├── src/
│   ├── app/                      # Next.js App Router (API 路由)
│   │   ├── api/                  # REST API 端点
│   │   │   ├── agents/           # Agent CRUD API
│   │   │   ├── tasks/            # 任务管理 API
│   │   │   ├── logs/             # 日志查询 API
│   │   │   ├── websocket/        # WebSocket 实时通信
│   │   │   └── health/           # 健康检查
│   │   └── layout.tsx            # API 根布局
│   ├── lib/                      # 服务端工具库
│   │   ├── prisma.ts             # Prisma 客户端配置
│   │   ├── memory-store.ts       # 内存缓存组件
│   │   ├── websocket-server.ts   # WebSocket 服务器
│   │   └── utils.ts              # 通用工具函数
│   ├── server/                   # 独立服务端服务
│   │   ├── agent-monitor.ts      # Agent 监控服务
│   │   ├── log-collector.ts      # 日志收集器
│   │   └── scheduler.ts          # 定时任务调度器
│   └── types/                    # 后端专用类型
├── prisma/
│   ├── schema.prisma             # Prisma 数据库模型
│   └── migrations/               # 数据库迁移文件
├── data/                         # SQLite 数据文件存储目录
│   ├── app.db                    # 主数据库文件
│   ├── app.db-journal            # 数据库日志
│   └── backups/                  # 数据库备份
├── config/
│   └── agents.ts                 # Agent 连接配置
├── package.json                  # 后端依赖管理
├── tsconfig.json                 # TypeScript 配置
└── .env                          # 后端环境变量
```

**backend 职责说明：**
- 提供 REST API 接口供前端调用
- WebSocket 服务器实现实时数据推送
- SQLite 数据库文件存储于 `data/` 目录
- 内存缓存管理 Agent 实时状态
- Agent 监控和日志收集服务

### frontend/ 目录详解

前端应用目录，纯客户端代码，不包含服务端逻辑。

```
frontend/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # 仪表盘路由组
│   │   ├── page.tsx              # 主页 - 像素办公室看板
│   │   ├── layout.tsx            # 仪表盘布局
│   │   ├── agents/               # Agent 管理页面
│   │   │   ├── page.tsx          # Agent 列表
│   │   │   └── [id]/             # Agent 详情
│   │   ├── tasks/                # 任务管理页面
│   │   ├── logs/                 # 日志查看页面
│   │   └── analytics/            # 数据分析页面
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式
│   └── error.tsx                 # 错误边界
├── components/                   # React 组件
│   ├── pixel-office/             # 像素办公室核心组件
│   │   ├── PixelCanvas.tsx       # 主画布渲染器
│   │   ├── AgentAvatar.tsx       # Agent 像素头像
│   │   ├── Workstation.tsx       # 工位组件
│   │   ├── OfficeGrid.tsx        # 办公室网格布局
│   │   ├── animations/           # 动画帧定义
│   │   └── effects/              # 特效组件
│   ├── dashboard/                # 仪表盘组件
│   │   ├── StatCard.tsx          # 统计卡片
│   │   ├── ActivityChart.tsx     # 活动图表
│   │   ├── LogStream.tsx         # 实时日志流
│   │   └── TaskTimeline.tsx      # 任务时间线
│   ├── ui/                       # shadcn/ui 组件
│   └── layout/                   # 布局组件
│       ├── Sidebar.tsx           # 侧边栏
│       ├── Header.tsx            # 顶部导航
│       └── Footer.tsx            # 页脚
├── lib/                          # 前端工具库
│   ├── api.ts                    # API 客户端封装
│   ├── websocket-client.ts       # WebSocket 客户端
│   └── utils.ts                  # 通用工具函数
├── hooks/                        # 自定义 React Hooks
│   ├── useAgents.ts              # Agent 数据获取
│   ├── useWebSocket.ts           # WebSocket 连接
│   ├── usePixelAnimation.ts      # 像素动画控制
│   └── useLocalStorage.ts        # 本地存储
├── types/                        # 前端类型定义
│   ├── agent.ts
│   ├── task.ts
│   └── log.ts
├── public/                       # 静态资源
│   ├── sprites/                  # 像素精灵图
│   │   ├── agents/               # Agent 头像精灵
│   │   ├── furniture/            # 家具装饰精灵
│   │   └── effects/              # 特效精灵
│   ├── fonts/                    # 像素字体
│   └── icons/                    # 图标资源
├── styles/                       # 样式文件
│   ├── pixel-theme.css           # 像素主题变量
│   └── animations.css            # 动画定义
├── stores/                       # 状态管理 (Zustand)
│   ├── agentStore.ts
│   └── uiStore.ts
├── next.config.js                # Next.js 配置
├── tailwind.config.js            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
└── package.json                  # 前端依赖
```

**frontend 职责说明：**
- 纯前端渲染，所有数据通过 API 从 backend 获取
- WebSocket 客户端连接后端实时服务
- 像素办公室场景渲染和交互
- 数据可视化图表展示
- 用户界面和交互逻辑

### shared/ 目录详解

前后端共享的代码，避免重复定义。

```
shared/
├── types/                        # 共享类型定义
│   ├── agent.ts                  # Agent 相关类型
│   ├── task.ts                   # 任务相关类型
│   ├── log.ts                    # 日志相关类型
│   ├── websocket.ts              # WebSocket 消息类型
│   └── index.ts                  # 类型导出
├── constants/                    # 共享常量
│   ├── agent-status.ts           # Agent 状态常量
│   ├── task-types.ts             # 任务类型常量
│   └── api-routes.ts             # API 路由常量
└── utils/                        # 共享工具函数
    └── validators.ts             # 数据验证函数
```

### 目录结构规范说明

#### 1. 前后端分离原则
| 项目 | backend | frontend |
|------|---------|----------|
| 技术栈 | Node.js + Next.js API | Next.js App (静态导出) |
| 端口 | 3001 (默认) | 3000 (开发) / CDN (生产) |
| 数据 | SQLite + 内存缓存 | 无本地存储 (除缓存) |
| 部署 | 独立服务 | 静态托管 / 同服务 |

#### 2. 数据流向
```
frontend (UI)
    ↕ (HTTP/WebSocket)
backend (API + WebSocket Server)
    ↕
SQLite (文件存储) / Memory (实时状态)
```

#### 3. 开发工作流
```bash
# 1. 启动后端服务
cd backend
npm install
npx prisma migrate dev
npm run dev              # 运行在 http://localhost:3001

# 2. 启动前端服务 (新终端)
cd frontend
npm install
npm run dev              # 运行在 http://localhost:3000
```

#### 4. 生产部署
```bash
# 方式一：独立部署
# 后端 - 使用 PM2
cd backend && pm2 start npm --name "hermes-backend" -- start

# 前端 - 静态托管
cd frontend && npm run build
# 将 dist/ 目录部署到 CDN 或 Nginx

# 方式二：Docker Compose (推荐)
docker-compose up -d
```

#### 5. 环境变量配置

**backend/.env**
```bash
# 服务器配置
PORT=3001
NODE_ENV=production

# 数据库配置 (SQLite 文件路径)
DATABASE_URL="file:./data/app.db"

# WebSocket 配置
WS_PORT=3001
WS_PATH="/ws"

# Agent API 配置
AGENT_API_URL="https://hermes-agent-api.example.com"
AGENT_API_KEY="your-api-key"

# 日志配置
LOG_LEVEL="info"
LOG_FILE="./data/logs/app.log"
```

**frontend/.env.local**
```bash
# API 基础地址
NEXT_PUBLIC_API_URL="http://localhost:3001/api"

# WebSocket 地址
NEXT_PUBLIC_WS_URL="ws://localhost:3001/ws"

# 应用配置
NEXT_PUBLIC_APP_NAME="Hermes Agent Office"
NEXT_PUBLIC_MAX_AGENTS_DISPLAY=50
```

---

## 核心文件位置速查

---

## 数据库模型设计

### Prisma Schema

```prisma
// Agent 定义 (SQLite 适配)
model Agent {
  id          String   @id @default(uuid())
  name        String   @unique
  displayName String
  avatar      String?  // 像素头像配置
  status      String   @default("OFFLINE")
  config      String?  // SQLite JSON 存储为 String
  createdAt   Int      @default(dbgenerated("(strftime('%s', 'now'))"))
  updatedAt   Int      @default(dbgenerated("(strftime('%s', 'now'))"))

  tasks       Task[]
  activities  Activity[]
  metrics     AgentMetric[]
}

// 任务记录
model Task {
  id          String   @id @default(uuid())
  agentId     String
  type        TaskType
  status      TaskStatus @default(PENDING)
  payload     String?  // SQLite JSON 存储为 String
  result      String?  // SQLite JSON 存储为 String
  startedAt   Int?     // Unix timestamp
  completedAt Int?     // Unix timestamp
  createdAt   Int      @default(dbgenerated("(strftime('%s', 'now'))"))

  agent       Agent    @relation(fields: [agentId], references: [id])
}

// 活动记录（用于时间线）
model Activity {
  id          String   @id @default(uuid())
  agentId     String
  type        ActivityType
  description String
  metadata    String?  // SQLite JSON 存储为 String
  createdAt   Int      @default(dbgenerated("(strftime('%s', 'now'))"))

  agent       Agent    @relation(fields: [agentId], references: [id])
}

// 性能指标 (SQLite 适配)
model AgentMetric {
  id          String   @id @default(uuid())
  agentId     String
  cpuUsage    Float?
  memoryUsage Float?
  apiCalls    Int
  timestamp   Int      @default(dbgenerated("(strftime('%s', 'now'))"))

  agent       Agent    @relation(fields: [agentId], references: [id])
}

// SQLite 不支持枚举，使用 String 类型
// AgentStatus: ONLINE | OFFLINE | BUSY | IDLE | ERROR
// TaskStatus: PENDING | RUNNING | COMPLETED | FAILED | CANCELLED
// TaskType: RESEARCH | CODE_GENERATION | ANALYSIS | COMMUNICATION | MAINTENANCE
// ActivityType: TASK_STARTED | TASK_COMPLETED | TASK_FAILED | AGENT_ONLINE | AGENT_OFFLINE | CONFIG_UPDATED

// Prisma 配置 (schema.prisma)
// datasource db {
//   provider = "sqlite"
//   url      = env("DATABASE_URL")
// }
//
// generator client {
//   provider = "prisma-client-js"
// }
```

---

## 核心功能实现路径

### Phase 1: 项目初始化与基础架构

1. **初始化 Next.js 项目**
   - 使用 `create-next-app` 创建项目
   - 配置 TypeScript、Tailwind CSS
   - 设置 ESLint、Prettier

2. **安装依赖**
   ```bash
   # UI 组件
   npx shadcn@latest init
   npx shadcn add button card badge dialog tabs table

   # 数据与状态
   npm install zustand swr @tanstack/react-table

   # 图表与动画
   npm install recharts framer-motion

   # 数据库 (SQLite - 无需额外安装服务)
   npm install prisma @prisma/client
   npx prisma init

   # 实时通信
   npm install socket.io socket.io-client
   ```

3. **数据库配置**
   - 配置 SQLite 文件数据库连接
   - 编写 Prisma schema (SQLite 适配)
   - 运行迁移

### Phase 2: 像素办公室核心组件

1. **像素渲染引擎**
   - 使用 HTML5 Canvas 或 PixiJS 创建渲染层
   - 设计像素精灵系统（Agent 头像、工位家具、环境装饰）
   - 实现动画状态机（idle、working、busy、offline）

2. **Agent 像素头像设计**
   - 创建可配置的像素头像组件
   - 支持颜色、配饰、表情的自定义
   - 不同状态的不同动画帧

3. **工位布局系统**
   - 可配置的办公室布局（网格系统）
   - 工位状态同步（在线/离线/忙碌）
   - 点击交互（查看详情）

### Phase 3: 后端 API 与实时通信

1. **REST API 实现**
   - `/api/agents` - Agent CRUD
   - `/api/tasks` - 任务管理
   - `/api/logs` - 日志查询
   - `/api/metrics` - 性能指标

2. **WebSocket 实时通信**
   - Agent 状态变更实时推送
   - 日志流实时推送
   - 任务进度实时更新

3. **Agent 监控服务**
   - 定时轮询 Agent 状态
   - 健康检查机制
   - 数据收集与存储

### Phase 4: 数据可视化仪表盘

1. **统计卡片组件**
   - 在线 Agent 数量
   - 今日任务完成数
   - 平均响应时间
   - 系统健康度

2. **活动图表**
   - 24小时任务分布热力图
   - Agent 活跃度趋势图
   - 任务类型分布饼图

3. **日志查看器**
   - 实时日志流显示
   - 筛选与搜索功能
   - 日志级别颜色标识

### Phase 5: Hermes Agent 集成

1. **Agent 适配器**
   - 实现 Hermes Agent API 客户端
   - 状态转换逻辑
   - 日志格式解析

2. **配置管理**
   - Agent 连接配置
   - 监控参数配置
   - 告警规则配置

---

## UI/UX 设计规范

### 像素风格设计系统

1. **颜色方案**
   ```css
   :root {
     --pixel-bg: #1a1a2e;           /* 深夜办公室背景 */
     --pixel-grid: #16213e;          /* 网格线 */
     --pixel-primary: #e94560;       /* 强调色（红色） */
     --pixel-secondary: #0f3460;     /* 次要色 */
     --pixel-accent: #ffd700;        /* 高光（金色） */
     --pixel-online: #4ade80;        /* 在线绿 */
     --pixel-offline: #6b7280;       /* 离线灰 */
     --pixel-busy: #f59e0b;          /* 忙碌黄 */
     --pixel-error: #ef4444;         /* 错误红 */
   }
   ```

2. **像素字体**
   - 主要：Inter / system-ui（现代管理风格）
   - 像素装饰：VT323 / Press Start 2P（仅用于标题和装饰）

3. **布局风格**
   - ui-ux-pro-max 管理风格：大量留白、卡片式布局
   - 像素元素作为装饰性点缀
   - 玻璃态效果（Glassmorphism）结合像素边框

4. **动画规范**
   - 像素动画：8fps 复古感
   - UI 动画：60fps 流畅现代
   - 状态切换：300ms ease-out

### 组件设计模式

1. **卡片组件**
   ```tsx
   // 带像素边框的玻璃态卡片
   <PixelCard>
     <CardHeader />
     <CardContent />
   </PixelCard>
   ```

2. **像素按钮**
   ```tsx
   // 3D 像素按压效果
   <PixelButton variant="primary">
     开始任务
   </PixelButton>
   ```

3. **状态徽章**
   ```tsx
   // 像素风格的在线状态指示器
   <AgentStatusBadge status="online" />
   ```

---

## 关键代码示例

### 1. Agent 像素头像组件

```tsx
// components/pixel-office/AgentAvatar.tsx
'use client';

import { useEffect, useRef } from 'react';
import { AgentStatus } from '@/types/agent';

interface AgentAvatarProps {
  name: string;
  status: AgentStatus;
  color: string;
  size?: number;
  isAnimating?: boolean;
}

export function AgentAvatar({
  name,
  status,
  color,
  size = 64,
  isAnimating = true
}: AgentAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置像素化渲染
    ctx.imageSmoothingEnabled = false;

    // 绘制像素头像逻辑
    const drawAvatar = () => {
      ctx.clearRect(0, 0, size, size);

      // 绘制基础形状（16x16 网格放大）
      const pixelSize = size / 16;

      // 身体
      ctx.fillStyle = color;
      for (let y = 4; y < 12; y++) {
        for (let x = 4; x < 12; x++) {
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }

      // 眼睛（根据状态变化）
      ctx.fillStyle = '#000';
      if (status === 'BUSY') {
        // 专注的眯眼
        ctx.fillRect(6 * pixelSize, 6 * pixelSize, 2 * pixelSize, pixelSize);
        ctx.fillRect(10 * pixelSize, 6 * pixelSize, 2 * pixelSize, pixelSize);
      } else {
        // 正常眼睛
        ctx.fillRect(6 * pixelSize, 6 * pixelSize, pixelSize, 2 * pixelSize);
        ctx.fillRect(10 * pixelSize, 6 * pixelSize, pixelSize, 2 * pixelSize);
      }

      // 状态指示器光环
      if (status === 'ONLINE') {
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, size, size);
      }
    };

    drawAvatar();

    // 动画循环
    let animationId: number;
    if (isAnimating && status === 'BUSY') {
      let frame = 0;
      const animate = () => {
        frame++;
        if (frame % 8 === 0) {
          drawAvatar();
          // 添加工作动画效果
          ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(frame / 8) * 0.2})`;
          ctx.fillRect(0, 0, size, size);
        }
        animationId = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [name, status, color, size, isAnimating]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="pixelated rounded-lg"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
```

### 2. WebSocket Hook

```tsx
// hooks/useWebSocket.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AgentStatus } from '@/types/agent';
import { LogEntry } from '@/types/log';

interface WebSocketMessage {
  type: 'agent_status' | 'new_log' | 'task_update';
  data: unknown;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  agentStatuses: Record<string, AgentStatus>;
  recentLogs: LogEntry[];
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'agent_status':
          const { agentId, status } = message.data as { agentId: string; status: AgentStatus };
          setAgentStatuses(prev => ({ ...prev, [agentId]: status }));
          break;

        case 'new_log':
          const log = message.data as LogEntry;
          setRecentLogs(prev => [log, ...prev].slice(0, 100));
          break;
      }
    };

    return () => ws.close();
  }, []);

  return { isConnected, agentStatuses, recentLogs };
}
```

### 3. 内存缓存组件 + API Route 示例

```tsx
// lib/memory-store.ts
// 基于 Node.js 内存的实时状态缓存（零依赖）

type AgentStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'IDLE' | 'ERROR';

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

class MemoryStore {
  private cache = new Map<string, CacheEntry<unknown>>();
  private agentStatuses = new Map<string, AgentStatus>();
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  // Agent 实时状态
  setAgentStatus(agentId: string, status: AgentStatus) {
    this.agentStatuses.set(agentId, status);
  }

  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agentStatuses.get(agentId);
  }

  getAllAgentStatuses(): Record<string, AgentStatus> {
    return Object.fromEntries(this.agentStatuses);
  }

  // 通用缓存
  set<T>(key: string, value: T, ttlSeconds?: number) {
    this.cache.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
    });
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  // 日志缓存
  addLog(log: LogEntry) {
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  getRecentLogs(limit = 100): LogEntry[] {
    return this.logs.slice(0, limit);
  }

  // 清理过期缓存
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// 单例模式
export const memoryStore = new MemoryStore();

// 定期清理
setInterval(() => memoryStore.cleanup(), 60000);
```

```tsx
// app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';

export async function GET() {
  try {
    // 从 SQLite 获取 Agent 列表
    const agents = await prisma.agent.findMany();

    // 从内存缓存获取实时状态
    const agentsWithStatus = agents.map((agent) => {
      const realTimeStatus = memoryStore.getAgentStatus(agent.id);
      return {
        ...agent,
        currentStatus: realTimeStatus || agent.status
      };
    });

    return NextResponse.json(agentsWithStatus);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const agent = await prisma.agent.create({
      data: {
        name: body.name,
        displayName: body.displayName,
        config: JSON.stringify(body.config || {})
      }
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
```

---

## 验证与测试方案

### 功能测试清单

1. **像素办公室**
   - [ ] Agent 像素头像正确渲染
   - [ ] 不同状态显示不同动画
   - [ ] 点击工位弹出详情面板
   - [ ] 窗口大小变化时自适应

2. **实时通信**
   - [ ] WebSocket 连接成功
   - [ ] Agent 状态变更实时更新
   - [ ] 日志实时推送显示
   - [ ] 断线重连机制

3. **数据管理**
   - [ ] Agent CRUD 操作正常
   - [ ] 任务创建与状态流转
   - [ ] 历史日志查询
   - [ ] 图表数据正确显示

4. **与 Hermes Agent 集成**
   - [ ] 成功连接 Hermes Agent API
   - [ ] 状态同步准确
   - [ ] 日志收集完整

### 性能测试

1. **前端性能**
   - 同时显示 50+ Agent 不卡顿
   - Canvas 渲染 60fps
   - 首屏加载 < 2s

2. **后端性能**
   - API 响应时间 < 200ms
   - WebSocket 支持 1000+ 并发连接
   - 数据库查询优化

---

## 部署方案

### 开发环境 (零依赖)

```bash
# ========== 后端服务 ==========
cd backend

# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 配置 SQLite 路径和端口

# 3. 初始化数据库 (自动创建 SQLite 文件)
npx prisma migrate dev
npx prisma generate

# 4. 启动后端服务 (默认 http://localhost:3001)
npm run dev

# ========== 前端服务 (新终端) ==========
cd frontend

# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 配置后端 API 地址

# 3. 启动前端服务 (默认 http://localhost:3000)
npm run dev
```

### 生产部署

1. **Docker Compose 部署 (前后端分离, 零外部依赖)**

   **docker-compose.yml**
   ```yaml
   version: '3.8'

   services:
     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile
       ports:
         - "3001:3001"
       volumes:
         - ./backend/data:/app/data
       environment:
         - NODE_ENV=production
         - DATABASE_URL=file:./data/app.db
         - PORT=3001
       restart: unless-stopped

     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       environment:
         - NEXT_PUBLIC_API_URL=http://localhost:3001/api
         - NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
       depends_on:
         - backend
       restart: unless-stopped
   ```

   **backend/Dockerfile**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app

   # 创建数据目录
   RUN mkdir -p /app/data

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .

   # 初始化 Prisma
   RUN npx prisma generate

   EXPOSE 3001
   CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
   ```

   **frontend/Dockerfile**
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app

   COPY package*.json ./
   RUN npm ci

   COPY . .
   RUN npm run build

   FROM node:20-alpine AS runner
   WORKDIR /app

   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   COPY --from=builder /app/public ./public

   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **环境变量**

   **backend/.env**
   ```bash
   # SQLite 文件数据库 (无需外部服务)
   DATABASE_URL="file:./data/app.db"

   # 服务器配置
   PORT=3001
   NODE_ENV=production

   # WebSocket 配置
   WS_PORT=3001

   # Agent API 地址
   AGENT_API_URL="https://hermes-agent-api.example.com"
   AGENT_API_KEY="your-api-key"
   ```

   **frontend/.env.local**
   ```bash
   # 后端 API 地址
   NEXT_PUBLIC_API_URL="http://localhost:3001/api"
   NEXT_PUBLIC_WS_URL="ws://localhost:3001/ws"
   ```

3. **Vercel 部署（仅前端，后端需另行托管）**
   ```bash
   cd frontend
   npm i -g vercel
   vercel --prod
   ```

   > 注意: Vercel 无服务器环境不适合运行后端服务：
   > - 不支持 SQLite 文件持久化
   > - WebSocket 支持受限
   > - 建议后端使用 Railway/Render/Fly.io 等服务

4. **自托管部署 (推荐)**
   ```bash
   # 方式一：PM2 独立部署
   cd backend && npm i -g pm2 && pm2 start npm --name "hermes-backend" -- start
   cd frontend && pm2 start npm --name "hermes-frontend" -- start

   # 方式二：Docker Compose (推荐)
   docker-compose up -d
   ```

---

## 总结

本技术方案提供了一个**零依赖**、**单容器部署**的 Hermes Agent 像素办公室看板实现路径：

1. **技术栈**：Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui + SQLite
2. **核心特色**：像素风格 UI + 现代管理界面风格的结合
3. **零依赖架构**：
   - 数据存储：SQLite 文件数据库（无需 PostgreSQL 服务）
   - 实时缓存：Node.js 内存组件（无需 Redis 服务）
   - 单容器部署：仅需 Node.js 运行时
4. **实时能力**：WebSocket 实现状态与日志的实时推送
5. **可扩展性**：模块化设计，易于添加新的 Agent 类型和功能

### 架构优势

| 特性 | 传统方案 | 本方案 |
|------|----------|--------|
| 依赖服务 | PostgreSQL + Redis | 无（SQLite + 内存） |
| 部署复杂度 | 多容器/多服务 | 单容器 |
| 开发环境 | 需安装多个服务 | 仅需 Node.js |
| 数据持久化 | 需外部存储 | 本地文件 |
| 扩展性 | 垂直扩展 | 水平扩展时可切回 PostgreSQL |

预计开发周期：1-2 周（1 名开发者）

关键成功因素：
- 像素渲染性能优化
- WebSocket 连接稳定性
- 内存缓存的合理管理（避免泄漏）
- Hermes Agent API 的完整集成
