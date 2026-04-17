# Hermes Agent 监控系统架构设计

## 概述

本文档基于 Hermes Agent CLI 能力，重新设计像素办公室监控系统的后端架构。Backend 作为数据中转桥梁，通过 CLI 获取 Hermes 运行数据，经 WebSocket 实时推送到前端。

---

## 需求分析

### 核心监控需求

| 需求 | 数据来源 | 更新频率 |
|------|----------|----------|
| Hermes 基本信息 | `hermes status` | 30s |
| 当前使用的 LLM | `hermes config show` | 启动时 |
| Gateway 状态 | `hermes gateway status` | 30s |
| Agent/会话数量 | `hermes sessions list` | 10s |
| 会话聊天内容 | `hermes sessions export` + SQLite | 实时 |
| 任务执行状态 | `hermes logs` + 进程监控 | 实时 |
| 运行日志 | `hermes logs -f` | 实时流 |

### 像素办公室动态效果映射

| Hermes 状态 | 像素办公室表现 |
|------------|---------------|
| Agent 空闲 | 小人坐在工位，偶尔转头 |
| Agent 处理任务 | 小人敲击键盘，屏幕发光 |
| Agent 执行工具 | 小人站立，手上有动作特效 |
| Gateway 运行中 | 办公室门口绿灯闪烁 |
| 新消息到达 | 头顶消息气泡弹出 |
| 错误/异常 | 红色警报灯闪烁 |

---

## 架构设计

### 数据流向图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Hermes CLI 数据源                            │
├─────────────────────────────────────────────────────────────────────┤
│  hermes status │ hermes gateway status │ hermes sessions │ hermes logs│
│  config show   │ auth list             │ insights        │ (follow)   │
└─────────┬─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Backend 数据中转层                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ CLI 执行器    │  │ 数据解析器    │  │ 数据聚合器    │              │
│  │ (hermes-client│  │ (parsers)    │  │ (aggregators)│              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
│         └─────────────────┴─────────────────┘                       │
│                           │                                         │
│                           ▼                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 内存状态缓存  │  │ SQLite 持久化 │  │ 事件发布器    │              │
│  │ (memoryStore)│  │ (Prisma)     │  │ (EventEmitter│              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
│         └─────────────────┴─────────────────┘                       │
│                           │                                         │
│                           ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    WebSocket Server                          │   │
│  │              (实时推送到前端像素办公室)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          │
          │ WebSocket
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend 像素办公室                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Pixel Office Canvas                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │ Workstation│ Workstation│ Workstation│ Workstation│        │   │
│  │  │  (Agent 1) │  (Agent 2) │  (Agent 3) │  (Gateway) │        │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 仪表盘面板    │  │ 日志流面板    │  │ 会话详情面板  │              │
│  │ (Dashboard)  │  │ (Log Stream) │  │ (Session)    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 模块设计

### 1. CLI 客户端层 (hermes-client.ts)

封装所有 Hermes CLI 命令调用：

```typescript
// 核心接口
interface HermesClient {
  // 系统状态
  getStatus(): Promise<HermesSystemStatus>;
  getConfig(): Promise<HermesConfig>;
  getVersion(): Promise<string>;

  // 认证与模型
  getAuthProviders(): Promise<AuthProvider[]>;
  getCurrentModel(): Promise<ModelInfo>;

  // Gateway
  getGatewayStatus(): Promise<GatewayStatus>;
  getActiveGateways(): Promise<Gateway[]>;

  // 会话
  getSessions(): Promise<HermesSession[]>;
  getSessionDetail(sessionId: string): Promise<HermesSessionDetail>;
  exportSession(sessionId: string): Promise<SessionMessages[]>;

  // 洞察
  getInsights(options?: { days?: number }): Promise<HermesInsights>;

  // 日志流
  createLogStream(options: LogStreamOptions): EventEmitter;
}
```

**支持的 CLI 命令映射：**

| 功能 | CLI 命令 | 用途 |
|------|---------|------|
| 系统状态 | `hermes status [--deep]` | 获取整体运行状态 |
| 配置 | `hermes config show` | 获取当前模型、工具配置 |
| Gateway | `hermes gateway status` | Gateway 服务状态 |
| 会话列表 | `hermes sessions list` | 所有会话概览 |
| 会话统计 | `hermes sessions stats` | 会话数量统计 |
| 会话导出 | `hermes sessions export <id>` | 获取会话消息内容 |
| 洞察 | `hermes insights [--days N]` | 使用分析数据 |
| 日志 | `hermes logs -f --component agent` | 实时日志流 |
| 认证 | `hermes auth list` | 已配置的提供商 |

---

### 2. 数据模型层

#### 2.1 Hermes 系统状态

```typescript
interface HermesSystemStatus {
  version: string;
  configLoaded: boolean;
  authStatus: 'authenticated' | 'not_authenticated' | 'error';
  timestamp: number;
  components: {
    cli: boolean;
    gateway: boolean;
    cron: boolean;
    memory: boolean;
  };
}

interface HermesConfig {
  model: {
    provider: string;      // "anthropic", "openai", "openrouter"...
    modelName: string;     // "claude-sonnet-4", "gpt-4"...
    maxTokens: number;
    temperature?: number;
  };
  toolsets: string[];      // ["web", "terminal", "skills", "mcp"]
  features: {
    voiceMode: boolean;
    compression: boolean;
    promptCaching: boolean;
  };
  personalities: string[];
}
```

#### 2.2 Gateway 状态

```typescript
interface GatewayStatus {
  running: boolean;
  serviceType: 'systemd' | 'launchd' | 'foreground' | 'none';
  uptime?: number;
  connectedPlatforms: string[];  // ["telegram", "discord", "slack"]
}

interface Gateway {
  id: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'error';
  webhookUrl?: string;
  lastActivity: number;
}
```

#### 2.3 会话与消息

```typescript
interface HermesSession {
  id: string;
  name: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  status: 'active' | 'paused' | 'completed';
  source: 'cli' | 'telegram' | 'discord' | 'slack' | 'whatsapp';
  parentId?: string;       // 会话链
  skillNames?: string[];
}

interface HermesMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokens?: number;
    toolCalls?: ToolCall[];
  };
}

interface ToolCall {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp: number;
}
```

#### 2.4 Agent 运行时状态（像素办公室映射）

```typescript
interface PixelAgent {
  id: string;
  name: string;
  displayName: string;
  type: 'cli' | 'gateway' | 'session' | 'worker';

  // 像素办公室位置
  position: {
    x: number;
    y: number;
    workstationId: string;
  };

  // 当前状态（决定像素动画）
  status: 'idle' | 'working' | 'busy' | 'offline' | 'error';

  // 当前活动（用于像素效果）
  currentActivity?: {
    type: 'typing' | 'thinking' | 'tool_call' | 'reading' | 'waiting';
    description: string;
    progress?: number;
    startedAt: number;
  };

  // 外观配置
  appearance: {
    color: string;
    avatar: string;        // 像素头像配置 JSON
    effects: string[];     // 当前特效 ["glow", "typing", "alert"]
  };

  // 统计
  metrics: {
    totalMessages: number;
    totalTasks: number;
    avgResponseTime: number;
    lastActivity: number;
  };
}
```

---

### 3. 监控服务层 (monitor-service.ts)

```typescript
class HermesMonitorService {
  private cliClient: HermesClient;
  private wsServer: WebSocketServer;
  private memoryStore: MemoryStore;

  // 监控任务调度
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // 启动所有监控任务
  async start(): Promise<void> {
    // 1. 系统状态监控 (30s)
    this.schedule('system', () => this.updateSystemStatus(), 30000);

    // 2. Gateway 监控 (30s)
    this.schedule('gateway', () => this.updateGatewayStatus(), 30000);

    // 3. 会话列表监控 (10s)
    this.schedule('sessions', () => this.updateSessions(), 10000);

    // 4. 活跃会话详情监控 (5s)
    this.schedule('sessionDetails', () => this.updateActiveSessionDetails(), 5000);

    // 5. 洞察数据 (60s)
    this.schedule('insights', () => this.updateInsights(), 60000);

    // 6. 日志流 (实时)
    this.startLogStream();
  }

  // 更新系统状态并推送到前端
  private async updateSystemStatus(): Promise<void> {
    const status = await this.cliClient.getStatus();
    const config = await this.cliClient.getConfig();

    const systemState: SystemState = {
      hermesVersion: status.version,
      model: config.model,
      authStatus: status.authStatus,
      components: status.components,
      timestamp: Date.now()
    };

    // 更新内存
    this.memoryStore.set('system', systemState);

    // 推送到前端
    this.wsServer.broadcast({
      type: 'system_update',
      data: systemState
    });
  }

  // 更新会话并映射到像素 Agent
  private async updateSessions(): Promise<void> {
    const sessions = await this.cliClient.getSessions();
    const pixelAgents = this.mapSessionsToPixelAgents(sessions);

    // 对比变化
    const changes = this.detectAgentChanges(pixelAgents);

    if (changes.length > 0) {
      this.memoryStore.set('agents', pixelAgents);

      // 推送变化到前端
      this.wsServer.broadcast({
        type: 'agents_update',
        data: {
          agents: pixelAgents,
          changes
        }
      });
    }
  }

  // 实时日志流
  private startLogStream(): void {
    const logStream = this.cliClient.createLogStream({
      follow: true,
      lines: 100,
      level: 'INFO'
    });

    logStream.on('log', (log: HermesLog) => {
      // 解析日志类型
      const activity = this.parseLogToActivity(log);

      // 更新对应 Agent 状态
      this.updateAgentFromLog(activity);

      // 推送到前端
      this.wsServer.broadcast({
        type: 'log',
        data: log
      });

      // 如果是任务相关日志，推送任务更新
      if (activity.type === 'task') {
        this.wsServer.broadcast({
          type: 'task_update',
          data: activity
        });
      }
    });
  }
}
```

---

### 4. WebSocket 消息协议

```typescript
// 服务端 → 客户端消息
interface ServerMessage {
  type: 'system_update' | 'agents_update' | 'log' | 'task_update' | 'session_messages' | 'error';
  timestamp: number;
  data: unknown;
}

// system_update
interface SystemUpdateData {
  hermesVersion: string;
  model: {
    provider: string;
    modelName: string;
  };
  authStatus: string;
  components: Record<string, boolean>;
  gatewayStatus: GatewayStatus;
}

// agents_update
interface AgentsUpdateData {
  agents: PixelAgent[];
  changes: AgentChange[];
}

interface AgentChange {
  agentId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

// task_update (用于像素动画)
interface TaskUpdateData {
  agentId: string;
  taskType: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  description: string;
  progress?: number;
  toolCall?: ToolCall;
}

// log
interface LogData {
  id: string;
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component: 'agent' | 'gateway' | 'cli' | 'tools' | 'cron';
  message: string;
  sessionId?: string;
}

// session_messages (选中会话时推送)
interface SessionMessagesData {
  sessionId: string;
  messages: HermesMessage[];
  newMessage?: HermesMessage;  // 仅新消息
}
```

---

### 5. 像素办公室状态映射算法

```typescript
class PixelOfficeMapper {
  // 将 Hermes 会话/任务映射到像素 Agent 状态
  mapToPixelActivity(session: HermesSession, messages: HermesMessage[]): PixelActivity {
    const lastMessage = messages[messages.length - 1];

    // 判断当前活动类型
    if (!lastMessage) {
      return { type: 'idle', description: '等待中' };
    }

    // 最后一条是用户消息 → Agent 正在思考/输入
    if (lastMessage.role === 'user') {
      return {
        type: 'thinking',
        description: '思考中...',
        startedAt: lastMessage.timestamp
      };
    }

    // 最后一条是助手消息
    if (lastMessage.role === 'assistant') {
      // 检查是否有待执行的工具调用
      if (lastMessage.metadata?.toolCalls?.some(t => t.status === 'pending')) {
        return {
          type: 'tool_call',
          description: `执行工具: ${lastMessage.metadata.toolCalls[0].tool}`,
          toolCall: lastMessage.metadata.toolCalls[0]
        };
      }

      // 正常回复完成 → 空闲
      return {
        type: 'idle',
        description: '等待新消息'
      };
    }

    return { type: 'idle', description: '空闲' };
  }

  // 根据日志确定动画效果
  getAnimationFromLog(log: HermesLog): PixelAnimation {
    const message = log.message.toLowerCase();

    if (message.includes('executing') || message.includes('running')) {
      return { name: 'typing', intensity: 'high' };
    }

    if (message.includes('tool') || message.includes('function')) {
      return { name: 'tool_glow', color: '#e94560' };
    }

    if (message.includes('error') || message.includes('failed')) {
      return { name: 'alert', blink: true };
    }

    if (message.includes('completed') || message.includes('success')) {
      return { name: 'success_pulse', color: '#4ade80' };
    }

    return { name: 'idle_breathing' };
  }
}
```

---

### 6. API 端点设计

```typescript
// REST API 端点 (用于初始加载)
const API_ROUTES = {
  // 系统
  'GET /api/system/status': () => SystemState;
  'GET /api/system/config': () => HermesConfig;

  // Gateway
  'GET /api/gateways': () => Gateway[];
  'GET /api/gateways/:id/status': (id: string) => GatewayStatus;

  // 会话
  'GET /api/sessions': () => HermesSession[];
  'GET /api/sessions/:id': (id: string) => HermesSessionDetail;
  'GET /api/sessions/:id/messages': (id: string) => HermesMessage[];

  // 像素办公室
  'GET /api/pixel-office/agents': () => PixelAgent[];
  'GET /api/pixel-office/layout': () => OfficeLayout;
  'POST /api/pixel-office/agents/:id/interact': (id: string) => void;

  // 日志
  'GET /api/logs': (query: {
    component?: string;
    level?: string;
    since?: string;
    limit?: number
  }) => HermesLog[];

  // 洞察
  'GET /api/insights': (query: { days?: number }) => HermesInsights;
};
```

---

## 前端像素办公室渲染

### 状态到视觉的映射

```typescript
// 像素办公室渲染配置
const PIXEL_OFFICE_CONFIG = {
  // 工位布局
  layout: {
    rows: 3,
    cols: 4,
    cellSize: 120,  // 像素单位
    spacing: 20
  },

  // Agent 状态动画
  animations: {
    idle: {
      frames: 4,
      fps: 2,
      loop: true,
      // 小人轻微呼吸起伏
      transform: ['scaleY(1)', 'scaleY(0.98)', 'scaleY(1)', 'scaleY(1.02)']
    },
    working: {
      frames: 8,
      fps: 8,
      loop: true,
      // 敲击键盘动画
      transform: ['hand-up', 'hand-down', 'hand-up', 'hand-down']
    },
    thinking: {
      frames: 6,
      fps: 4,
      loop: true,
      // 思考气泡 + 头部倾斜
      effects: ['thought_bubble', 'head_tilt']
    },
    tool_call: {
      frames: 12,
      fps: 12,
      loop: true,
      // 站立 + 手部动作 + 工具图标
      effects: ['standing', 'tool_glow', 'action_lines']
    },
    alert: {
      frames: 2,
      fps: 2,
      loop: true,
      // 红色闪烁
      effects: ['red_alert', 'shake']
    }
  },

  // 环境效果
  environment: {
    dayNightCycle: true,      // 根据时间改变办公室色调
    gatewayIndicator: true,   // Gateway 状态灯
    particleEffects: true     // 打字时的粒子效果
  }
};
```

### WebSocket 消息处理器

```typescript
// 前端 WebSocket 处理器
class PixelOfficeWebSocketHandler {
  private canvas: PixelOfficeCanvas;
  private agentManager: AgentManager;

  handleMessage(message: ServerMessage) {
    switch (message.type) {
      case 'system_update':
        this.updateSystemInfo(message.data as SystemUpdateData);
        break;

      case 'agents_update':
        const { agents, changes } = message.data as AgentsUpdateData;

        for (const change of changes) {
          if (change.field === 'status') {
            this.agentManager.transitionState(
              change.agentId,
              change.oldValue as string,
              change.newValue as string
            );
          }

          if (change.field === 'currentActivity') {
            this.playActivityAnimation(change.agentId, change.newValue);
          }
        }
        break;

      case 'task_update':
        const task = message.data as TaskUpdateData;
        this.showTaskEffect(task);
        break;

      case 'log':
        this.addLogToPanel(message.data as LogData);
        break;

      case 'session_messages':
        this.updateSessionView(message.data as SessionMessagesData);
        break;
    }
  }

  private showTaskEffect(task: TaskUpdateData) {
    if (task.status === 'started') {
      // 播放开始音效 + 特效
      this.canvas.playEffect('task_start', task.agentId);
    } else if (task.status === 'completed') {
      this.canvas.playEffect('success', task.agentId);
    }
  }
}
```

---

## 部署与运行

### 依赖

- Node.js 20+
- Hermes CLI 已安装且配置完成
- SQLite (内置)

### 启动顺序

```bash
# 1. 确保 Hermes 已配置
hermes status
hermes config show

# 2. 启动后端 (数据中转 + WebSocket)
cd backend
npm install
npx prisma generate
npm run dev  # 端口 3001

# 3. 启动前端 (像素办公室)
cd frontend
npm install
npm run dev  # 端口 3000
```

### 环境变量

```bash
# backend/.env
PORT=3001
DATABASE_URL="file:./data/app.db"
HERMES_PATH="/usr/local/bin/hermes"  # CLI 路径
WS_PORT=3001

# frontend/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_WS_URL="ws://localhost:3001/ws"
```

---

## 扩展性设计

### 1. 多 Gateway 支持

```typescript
// 支持多个 Gateway 实例监控
interface GatewayCluster {
  gateways: Gateway[];
  loadBalancer: LoadBalancer;
  healthChecker: HealthChecker;
}
```

### 2. 插件化工具监控

```typescript
// 监控特定工具的执行
interface ToolMonitor {
  toolName: string;
  onExecution: (call: ToolCall) => void;
  showInOffice: boolean;  // 是否在像素办公室显示
}
```

### 3. 历史回放

```typescript
// 回放过去某段时间的 Agent 活动
interface HistoryPlayer {
  play(startTime: number, endTime: number, speed: number): void;
  pause(): void;
  seek(timestamp: number): void;
}
```

---

## 总结

本架构设计将 Hermes CLI 作为唯一数据源，Backend 作为数据中转桥梁：

1. **CLI 客户端层**：封装所有 `hermes` 命令调用
2. **监控服务层**：定时轮询 + 实时日志流
3. **数据聚合层**：将原始数据转换为像素办公室状态
4. **WebSocket 层**：实时推送到前端
5. **像素渲染层**：将状态映射为视觉动画

核心优势：
- 零侵入：不需要修改 Hermes 代码
- 实时性：日志流 + WebSocket 实现秒级更新
- 可视化：完整的像素办公室动态效果
- 可扩展：模块化设计，易于添加新监控维度
