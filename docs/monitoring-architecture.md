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

### 0. 项目结构

```
hermes-agent-office-ui/
├── backend/
│   ├── src/
│   │   ├── app/api/           # Next.js API 路由
│   │   │   ├── agents/        # Agent CRUD API
│   │   │   ├── tasks/         # 任务管理 API
│   │   │   ├── logs/          # 日志查询 API
│   │   │   ├── hermes/        # Hermes CLI 数据接口
│   │   │   └── pixel-office/  # 像素办公室数据接口
│   │   ├── lib/
│   │   │   ├── prisma.ts          # Prisma 客户端
│   │   │   ├── hermes-client.ts   # CLI 执行器
│   │   │   ├── memory-store.ts    # 内存缓存
│   │   │   └── websocket-server.ts # WebSocket 服务
│   │   └── server/
│   │       ├── monitor-service.ts  # 主监控服务
│   │       ├── agent-monitor.ts    # Agent 监控
│   │       └── log-collector.ts    # 日志收集器
│   ├── prisma/
│   │   └── schema.prisma     # 数据库 Schema
│   └── server.ts             # 自定义服务器启动
├── frontend/
│   ├── app/                  # Next.js 页面
│   ├── components/           # React 组件
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useWebSocket.ts   # WebSocket 连接
│   │   ├── useAgents.ts      # Agent 数据
│   │   └── useTasks.ts       # 任务数据
│   └── lib/
│       ├── api.ts            # API 客户端
│       └── websocket-client.ts
└── shared/                   # 共享代码
    ├── types/                # TypeScript 类型
    └── constants/            # 常量定义
```

---

### 1. CLI 客户端层 (hermes-client.ts)

封装所有 Hermes CLI 命令调用，负责与本地安装的 Hermes CLI 交互：

```typescript
// 核心接口
interface HermesClient {
  // 系统状态
  getHermesStatus(): Promise<HermesSystemStatus>;
  getHermesConfig(): Promise<HermesConfig>;
  getHermesVersion(): Promise<string>;
  isHermesInstalled(): Promise<boolean>;

  // 认证与模型
  getAuthProviders(): Promise<AuthProvider[]>;
  getCurrentModel(): Promise<ModelInfo>;

  // Gateway
  getGatewayStatus(): Promise<GatewayStatus>;

  // 会话
  getSessions(): Promise<HermesSession[]>;
  exportSession(sessionId: string): Promise<HermesMessage[]>;

  // 洞察
  getInsights(days?: number): Promise<HermesInsights>;

  // 日志
  getLogs(options?: LogStreamOptions): Promise<HermesLog[]>;
  createLogStream(options: LogStreamOptions): EventEmitter;
}
```

**命令执行配置：**

```typescript
const EXEC_TIMEOUT = 30000;      // 30秒超时
const MAX_BUFFER = 1024 * 1024;  // 1MB 输出缓冲区
```

**命令执行实现：**

```typescript
async function execHermesCommand(args: string): Promise<string> {
  const command = `hermes ${args}`;
  const { stdout, stderr } = await execAsync(command, {
    timeout: EXEC_TIMEOUT,
    maxBuffer: MAX_BUFFER,
    env: {
      ...process.env,
      PATH: `${process.env.HOME}/.local/bin:/usr/local/bin:${process.env.PATH}`,
    },
  });
  return stdout || '';
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

### 3. 内存存储层 (memory-store.ts)

内存缓存用于快速访问热点数据和 WebSocket 客户端管理：

```typescript
class MemoryStore {
  // 系统状态缓存
  private systemState: SystemState | null = null;
  private hermesConfig: HermesConfig | null = null;
  private gatewayStatus: GatewayStatus | null = null;
  private insights: HermesInsights | null = null;

  // Agent 和会话缓存
  private agents: Map<string, PixelAgent> = new Map();
  private sessions: Map<string, HermesSession> = new Map();
  private hermesLogs: HermesLog[] = [];

  // WebSocket 客户端
  private wsClients: Set<WebSocket> = new Set();

  // 缓存操作
  setSystemState(state: SystemState): void { this.systemState = state; }
  getSystemState(): SystemState | null { return this.systemState; }

  setAgent(agent: PixelAgent): void { this.agents.set(agent.id, agent); }
  getAgent(id: string): PixelAgent | undefined { return this.agents.get(id); }
  getAllAgents(): PixelAgent[] { return Array.from(this.agents.values()); }

  // 变化检测
  detectAgentChanges(newAgents: PixelAgent[]): AgentChange[] {
    const changes: AgentChange[] = [];
    for (const newAgent of newAgents) {
      const oldAgent = this.agents.get(newAgent.id);
      if (!oldAgent) continue;

      // 检测状态变化
      if (oldAgent.status !== newAgent.status) {
        changes.push({
          agentId: newAgent.id,
          field: 'status',
          oldValue: oldAgent.status,
          newValue: newAgent.status,
          timestamp: Date.now()
        });
      }

      // 检测活动变化
      if (JSON.stringify(oldAgent.currentActivity) !==
          JSON.stringify(newAgent.currentActivity)) {
        changes.push({
          agentId: newAgent.id,
          field: 'currentActivity',
          oldValue: oldAgent.currentActivity,
          newValue: newAgent.currentActivity,
          timestamp: Date.now()
        });
      }
    }
    return changes;
  }

  // WebSocket 客户端管理
  addWsClient(ws: WebSocket): void { this.wsClients.add(ws); }
  removeWsClient(ws: WebSocket): void { this.wsClients.delete(ws); }

  broadcast(message: WebSocketMessage<unknown>): void {
    const data = JSON.stringify(message);
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }
}

export const memoryStore = new MemoryStore();
```

---

### 4. 监控服务层 (monitor-service.ts)

主监控服务，负责协调所有监控任务和事件分发：

```typescript
class MonitorService extends EventEmitter {
  private isRunning = false;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private logStream: EventEmitter | null = null;
  private hermesInstalled = false;
  private activeSessionIds: Set<string> = new Set();

  // 监控配置
  private readonly config = {
    system: { interval: 30000 },      // 30s
    gateway: { interval: 30000 },     // 30s
    sessions: { interval: 10000 },    // 10s
    sessionDetails: { interval: 5000 }, // 5s
    insights: { interval: 60000 },    // 60s
  };

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // 检查 Hermes 安装
    this.hermesInstalled = await isHermesInstalled();

    // 初始化数据
    await this.updateSystemStatus();
    await this.updateGatewayStatus();
    await this.updateSessions();

    // 启动定时任务
    this.schedule('system', () => this.updateSystemStatus(), this.config.system.interval);
    this.schedule('gateway', () => this.updateGatewayStatus(), this.config.gateway.interval);
    this.schedule('sessions', () => this.updateSessions(), this.config.sessions.interval);
    this.schedule('sessionDetails', () => this.updateSessionDetails(), this.config.sessionDetails.interval);
    this.schedule('insights', () => this.updateInsights(), this.config.insights.interval);

    // 启动日志流
    if (this.hermesInstalled) {
      this.startLogStream();
    }
  }

  // 任务调度器
  private schedule(name: string, fn: () => Promise<void>, interval: number): void {
    // 立即执行一次
    fn().catch(err => console.error(`[${name}] Initial run failed:`, err));

    // 设置定时器
    const timer = setInterval(() => {
      if (!this.isRunning) return;
      fn().catch(err => console.error(`[${name}] Error:`, err));
    }, interval);

    this.intervals.set(name, timer);
  }

  stop(): void {
    this.isRunning = false;

    // 清除定时任务
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();

    // 停止日志流
    if (this.logStream) {
      (this.logStream as any).stop?.();
      this.logStream = null;
    }
  }

  // 更新系统状态
  private async updateSystemStatus(): Promise<void> {
    if (!this.hermesInstalled) return;

    const [status, config] = await Promise.all([
      getHermesStatus(),
      getHermesConfig(),
    ]);

    const systemState: SystemState = {
      hermesVersion: status.version,
      model: config.model,
      authStatus: status.authStatus,
      components: status.components,
      gatewayStatus: memoryStore.getGatewayStatus() || { running: false, serviceType: 'none', connectedPlatforms: [] },
      timestamp: Date.now(),
    };

    memoryStore.setSystemState(systemState);
    memoryStore.setHermesConfig(config);

    // 推送到前端
    this.emit('system_update', systemState);
  }

  // 更新会话并映射为 Pixel Agents
  private async updateSessions(): Promise<void> {
    const sessions = await getSessions();
    const pixelAgents = this.mapSessionsToPixelAgents(sessions);

    // 添加 Gateway Agent
    const gatewayAgent = memoryStore.getAgent('gateway-main');
    if (gatewayAgent) {
      pixelAgents.push(gatewayAgent);
    }

    // 检测变化
    const changes = memoryStore.detectAgentChanges(pixelAgents);

    // 更新内存
    for (const agent of pixelAgents) {
      memoryStore.setAgent(agent);
    }

    // 推送到前端
    this.emit('agents_update', { agents: pixelAgents, changes });
  }

  // 启动实时日志流
  private startLogStream(): void {
    this.logStream = createLogStream({
      follow: true,
      lines: 100,
      level: 'INFO',
    });

    this.logStream.on('log', (log: HermesLog) => {
      // 存储日志
      memoryStore.addHermesLog(log);

      // 推送到前端
      this.emit('log', log);

      // 解析任务更新
      const taskUpdate = this.parseLogToTaskUpdate(log);
      if (taskUpdate) {
        this.emit('task_update', taskUpdate);
        this.updateAgentFromTask(taskUpdate);
      }
    });
  }

  // 将会话映射为 Pixel Agents
  private mapSessionsToPixelAgents(sessions: HermesSession[]): PixelAgent[] {
    return sessions.map((session, index) => {
      // 计算工位位置 (3x4 网格)
      const col = (index % 4) + 1; // 跳过第一列给 Gateway
      const row = Math.floor(index / 4);

      // 确定状态
      let status: PixelAgent['status'] = 'idle';
      if (session.status === 'completed') status = 'offline';
      else if (session.messageCount > 0) status = 'working';

      return {
        id: `session-${session.id}`,
        name: session.name,
        displayName: session.title || session.name || `Session ${session.id.slice(0, 8)}`,
        type: 'session',
        position: { x: col, y: row, workstationId: `desk-${index}` },
        status,
        currentActivity: session.status === 'active'
          ? { type: 'typing', description: `${session.messageCount} messages`, startedAt: session.updatedAt }
          : undefined,
        appearance: {
          color: this.getSessionColor(session.source),
          avatar: '{}',
          effects: session.status === 'active' ? ['glow'] : [],
        },
        metrics: {
          totalMessages: session.messageCount,
          totalTasks: 0,
          avgResponseTime: 0,
          lastActivity: session.updatedAt,
        },
        sessionId: session.id,
      };
    });
  }
}

export const monitorService = new MonitorService();
```

---

---

### 5. WebSocket 层

#### 5.1 服务器实现 (websocket-server.ts)

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] Client connected');
    memoryStore.addWsClient(ws);

    // 发送连接成功消息
    ws.send(JSON.stringify({
      type: 'connected',
      data: { message: 'Connected to Hermes Agent Office' },
      timestamp: Date.now()
    }));

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage<unknown>;
        handleMessage(ws, message);
      } catch (error) {
        console.error('[WebSocket] Invalid message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
      memoryStore.removeWsClient(ws);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      memoryStore.removeWsClient(ws);
    });
  });

  console.log('[WebSocket] Server initialized on /ws');
  return wss;
}

// 广播消息到所有客户端
export function broadcast(message: WebSocketMessage<unknown>) {
  if (!wss) return;
  memoryStore.broadcast(message);
}
```

#### 5.2 消息协议

**服务端 → 客户端消息：**

```typescript
interface ServerMessage {
  type: 'system_update' | 'agents_update' | 'log' | 'task_update' | 'session_messages' | 'error';
  timestamp: number;
  data: unknown;
}

// system_update 数据
interface SystemUpdateData {
  hermesVersion: string;
  model: ModelInfo;
  authStatus: string;
  components: Record<string, boolean>;
  gatewayStatus: GatewayStatus;
}

// agents_update 数据
interface AgentsUpdateData {
  agents: PixelAgent[];
  changes: AgentChange[];
}

// log 数据
interface LogData {
  id: string;
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component: 'agent' | 'gateway' | 'cli' | 'tools' | 'cron' | 'system';
  message: string;
  sessionId?: string;
}

// task_update 数据
interface TaskUpdateData {
  agentId: string;
  taskType: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  description: string;
  progress?: number;
  toolCall?: ToolCall;
}
```

#### 5.3 前端 Hook 实现

```typescript
// hooks/useWebSocket.ts
export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [agents, setAgents] = useState<PixelAgent[]>([]);
  const [logs, setLogs] = useState<HermesLog[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // 3秒后重连
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'system_update':
          setSystemState(message.data as SystemState);
          break;

        case 'agents_update':
          const { agents: newAgents } = message.data as AgentsUpdateData;
          setAgents(newAgents);
          break;

        case 'log':
          const log = message.data as HermesLog;
          setLogs((prev) => [log, ...prev].slice(0, 100)); // 保留最近100条
          break;

        case 'task_update':
          // 任务更新由父组件处理
          break;

        case 'session_messages':
          // 会话消息由父组件处理
          break;
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected, systemState, agents, logs, lastMessage, error };
}
```

// session_messages (选中会话时推送)
interface SessionMessagesData {
  sessionId: string;
  messages: HermesMessage[];
  newMessage?: HermesMessage;  // 仅新消息
}
```

---

### 6. 像素办公室状态映射算法

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

## 前端像素办公室渲染

### 状态到视觉的映射

```typescript

```typescript
// shared/constants/api-routes.ts
export const API_ROUTES = {
  // Agent API
  AGENTS: '/agents',
  AGENT_BY_ID: (id: string) => `/agents/${id}`,
  AGENT_METRICS: (id: string) => `/agents/${id}/metrics`,
  AGENT_ACTIVITIES: (id: string) => `/agents/${id}/activities`,

  // Task API
  TASKS: '/tasks',
  TASK_BY_ID: (id: string) => `/tasks/${id}`,
  TASK_STATS: '/tasks/stats',

  // Log API
  LOGS: '/logs',
  LOG_STATS: '/logs/stats',

  // System API
  HEALTH: '/health',
  STATS: '/stats',

  // Hermes API
  HERMES_STATUS: '/hermes/status',
  HERMES_LOGS: '/hermes/logs',
  HERMES_INSIGHTS: '/hermes/insights',

  // Sessions API
  SESSIONS: '/sessions',

  // Pixel Office API
  PIXEL_OFFICE_AGENTS: '/pixel-office/agents',
};
```

#### 前端 API 客户端

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

// Agent API
export const agentAPI = {
  getAll: () => fetchAPI<{ agents: AgentWithStatus[] }>(API_ROUTES.AGENTS),
  getById: (id: string) => fetchAPI<{ agent: AgentWithStatus }>(API_ROUTES.AGENT_BY_ID(id)),
  create: (data: CreateAgentRequest) =>
    fetchAPI<{ agent: Agent }>(API_ROUTES.AGENTS, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: UpdateAgentRequest) =>
    fetchAPI<{ agent: Agent }>(API_ROUTES.AGENT_BY_ID(id), { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchAPI<{ success: boolean }>(API_ROUTES.AGENT_BY_ID(id), { method: "DELETE" }),
};

// Task API
export const taskAPI = {
  getAll: () => fetchAPI<{ tasks: Task[] }>(API_ROUTES.TASKS),
  getById: (id: string) => fetchAPI<{ task: Task }>(API_ROUTES.TASK_BY_ID(id)),
  create: (data: CreateTaskRequest) =>
    fetchAPI<{ task: Task }>(API_ROUTES.TASKS, { method: "POST", body: JSON.stringify(data) }),
  getStats: () => fetchAPI<TaskStats>(API_ROUTES.TASK_STATS),
};

// Log API
export const logAPI = {
  getAll: (filter?: LogFilter) => {
    const params = new URLSearchParams();
    if (filter?.agentId) params.append("agentId", filter.agentId);
    if (filter?.level) params.append("level", filter.level);
    if (filter?.search) params.append("search", filter.search);
    return fetchAPI<LogQueryResult>(`${API_ROUTES.LOGS}?${params}`);
  },
  getStats: () => fetchAPI<LogStats>(API_ROUTES.LOG_STATS),
};
```

---

## 前端像素办公室渲染

### 状态到视觉的映射

```typescript
// 像素办公室渲染配置
const PIXEL_OFFICE_CONFIG = {
  // 工位布局 (3x4 网格)
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

## 错误处理与容错机制

### CLI 执行容错

```typescript
// 命令执行带错误处理和降级
async function execHermesCommand(args: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: EXEC_TIMEOUT,
      maxBuffer: MAX_BUFFER,
      env: { ...process.env, PATH: `${process.env.HOME}/.local/bin:/usr/local/bin:${process.env.PATH}` },
    });
    return stdout || '';
  } catch (error: any) {
    console.error(`[HermesClient] Command failed: ${command}`, error.message);
    // 返回空字符串而不是抛出异常，让调用者处理
    return '';
  }
}

// 结果解析容错
export async function getHermesStatus(): Promise<HermesSystemStatus> {
  try {
    const output = await execHermesCommand('status');
    // 解析逻辑...
    return status;
  } catch (error) {
    console.error('[HermesClient] Failed to get status:', error);
    // 返回默认状态而不是抛出异常
    return {
      version: 'unknown',
      configLoaded: false,
      authStatus: 'error',
      timestamp: Date.now(),
      components: { cli: false, gateway: false, cron: false, memory: false },
    };
  }
}
```

### 会话 ID 验证

```typescript
// UUID 格式验证
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str.trim());
}

// 导出会话时验证
export async function exportSession(sessionId: string): Promise<HermesMessage[]> {
  if (!isValidUUID(sessionId)) {
    console.warn(`[HermesClient] Invalid session ID format: ${sessionId}`);
    return [];
  }
  // ...
}
```

### WebSocket 连接恢复

```typescript
// 自动重连机制
const connect = useCallback(() => {
  const ws = new WebSocket(wsUrl);
  wsRef.current = ws;

  ws.onclose = () => {
    setIsConnected(false);
    // 3秒后重连
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 3000);
  };
}, []);
```

---

## 性能优化

### 1. 数据聚合与去重

```typescript
// 日志去重
addHermesLog(log: HermesLog): void {
  // 检查是否已存在相同日志
  const exists = this.hermesLogs.some(
    l => l.timestamp === log.timestamp && l.message === log.message
  );
  if (!exists) {
    this.hermesLogs.unshift(log);
    // 只保留最近 1000 条
    if (this.hermesLogs.length > 1000) {
      this.hermesLogs = this.hermesLogs.slice(0, 1000);
    }
  }
}
```

### 2. 变化检测与增量更新

```typescript
// 只发送变化的数据
detectAgentChanges(newAgents: PixelAgent[]): AgentChange[] {
  const changes: AgentChange[] = [];
  for (const newAgent of newAgents) {
    const oldAgent = this.agents.get(newAgent.id);
    if (!oldAgent) continue;

    if (oldAgent.status !== newAgent.status) {
      changes.push({
        agentId: newAgent.id,
        field: 'status',
        oldValue: oldAgent.status,
        newValue: newAgent.status,
        timestamp: Date.now()
      });
    }
  }
  return changes;
}
```

### 3. 前端日志限制

```typescript
// 只保留最近 100 条日志用于显示
setLogs((prev) => [log, ...prev].slice(0, 100));
```

---

## 数据持久化层

### Prisma Schema

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Agent - 像素办公室中的 AI Agent
model Agent {
  id          String   @id @default(uuid())
  name        String   @unique
  displayName String
  avatar      String?  // 像素头像配置 (JSON 字符串)
  status      String   @default("OFFLINE") // ONLINE | OFFLINE | BUSY | IDLE | ERROR
  config      String?  // SQLite 存储 JSON 为 String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tasks      Task[]
  activities Activity[]
  metrics   AgentMetric[]
}

// Task - Agent 执行的任务
model Task {
  id          String   @id @default(uuid())
  agentId     String
  type        String   @default("RESEARCH")
  status      String   @default("PENDING") // PENDING | RUNNING | COMPLETED | FAILED | CANCELLED
  payload     String?  // JSON 字符串
  result      String?  // JSON 字符串
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
}

// Activity - 活动时间线
model Activity {
  id          String   @id @default(uuid())
  agentId     String
  type        String   @default("AGENT_ONLINE")
  description String
  metadata    String?  // JSON 字符串
  createdAt   DateTime @default(now())

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
}

// AgentMetric - 性能指标
model AgentMetric {
  id          String   @id @default(uuid())
  agentId     String
  cpuUsage    Float?
  memoryUsage Float?
  apiCalls    Int      @default(0)
  timestamp   DateTime @default(now())

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
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

## 安全考虑

### 1. 输入验证

```typescript
// UUID 格式验证防止命令注入
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str.trim());
}

// 会话 ID 验证
export async function exportSession(sessionId: string): Promise<HermesMessage[]> {
  if (!isValidUUID(sessionId)) {
    console.warn(`[HermesClient] Invalid session ID format: ${sessionId}`);
    return [];
  }
  // ...
}
```

### 2. 命令执行安全

```typescript
// 避免 shell 注入
async function execHermesCommand(args: string): Promise<string> {
  // 使用 execAsync 而不是 spawn，限制 PATH 环境变量
  const { stdout, stderr } = await execAsync(command, {
    timeout: EXEC_TIMEOUT,
    maxBuffer: MAX_BUFFER,
    env: {
      ...process.env,
      // 限制 PATH，避免执行未授权命令
      PATH: `${process.env.HOME}/.local/bin:/usr/local/bin:${process.env.PATH}`,
    },
  });
  return stdout || '';
}
```

### 3. 日志敏感信息过滤

```typescript
// 解析日志时过滤敏感信息
function parseLogLine(line: string): HermesLog | null {
  const log = parseLine(line);
  if (log) {
    // 移除可能的敏感信息
    log.message = log.message.replace(/api[_-]?key[:\s=]+[^\s,]+/gi, 'api_key=***');
    log.message = log.message.replace(/token[:\s=]+[^\s,]+/gi, 'token=***');
  }
  return log;
}
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
