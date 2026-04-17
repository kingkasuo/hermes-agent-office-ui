// Hermes Agent 监控系统 - 共享类型定义

/**
 * Hermes 系统状态
 */
export interface HermesSystemStatus {
  version: string;
  configLoaded: boolean;
  authStatus: 'authenticated' | 'not_authenticated' | 'unknown' | 'error';
  timestamp: number;
  components: {
    cli: boolean;
    gateway: boolean;
    cron: boolean;
    memory: boolean;
  };
}

/**
 * Hermes 配置
 */
export interface HermesConfig {
  model: {
    provider: string;
    modelName: string;
    maxTokens: number;
    temperature?: number;
  };
  toolsets: string[];
  features: {
    voiceMode: boolean;
    compression: boolean;
    promptCaching: boolean;
  };
  personalities: string[];
}

/**
 * Gateway 状态
 */
export interface GatewayStatus {
  running: boolean;
  serviceType: 'systemd' | 'launchd' | 'foreground' | 'none';
  uptime?: number;
  connectedPlatforms: string[];
}

export interface Gateway {
  id: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'error';
  webhookUrl?: string;
  lastActivity: number;
}

/**
 * Hermes 会话
 */
export interface HermesSession {
  id: string;
  name: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  status: 'active' | 'paused' | 'completed';
  source: 'cli' | 'telegram' | 'discord' | 'slack' | 'whatsapp';
  parentId?: string;
  skillNames?: string[];
}

/**
 * 会话详情
 */
export interface HermesSessionDetail extends HermesSession {
  messages: HermesMessage[];
}

/**
 * Hermes 消息
 */
export interface HermesMessage {
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

/**
 * 工具调用
 */
export interface ToolCall {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp: number;
}

/**
 * Hermes 日志
 */
export interface HermesLog {
  id: string;
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component: 'agent' | 'gateway' | 'cli' | 'tools' | 'cron' | 'system';
  message: string;
  sessionId?: string;
  raw?: string;
}

/**
 * 日志流选项
 */
export interface LogStreamOptions {
  follow?: boolean;
  lines?: number;
  since?: string;
  level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component?: string;
}

/**
 * Hermes 洞察数据
 */
export interface HermesInsights {
  totalSessions: number;
  totalMessages: number;
  totalTokens: number;
  usageByProvider: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  topSkills: Array<{
    name: string;
    usageCount: number;
  }>;
  period: string;
  timestamp: number;
}

/**
 * 认证提供商
 */
export interface AuthProvider {
  name: string;
  type: 'api_key' | 'oauth';
  status: 'active' | 'expired' | 'error';
  lastUsed?: number;
}

/**
 * 模型信息
 */
export interface ModelInfo {
  provider: string;
  modelName: string;
  maxTokens: number;
  temperature?: number;
}

/**
 * 像素办公室 Agent
 */
export interface PixelAgent {
  id: string;
  name: string;
  displayName: string;
  type: 'cli' | 'gateway' | 'session' | 'worker';
  position: {
    x: number;
    y: number;
    workstationId: string;
  };
  status: 'idle' | 'working' | 'busy' | 'offline' | 'error';
  currentActivity?: {
    type: 'typing' | 'thinking' | 'tool_call' | 'reading' | 'waiting';
    description: string;
    progress?: number;
    startedAt: number;
  };
  appearance: {
    color: string;
    avatar: string;
    effects: string[];
  };
  metrics: {
    totalMessages: number;
    totalTasks: number;
    avgResponseTime: number;
    lastActivity: number;
  };
  sessionId?: string;
}

/**
 * 办公室布局
 */
export interface OfficeLayout {
  rows: number;
  cols: number;
  cellSize: number;
  spacing: number;
  workstations: Workstation[];
}

export interface Workstation {
  id: string;
  x: number;
  y: number;
  type: 'desk' | 'gateway' | 'server';
  agentId?: string;
}

/**
 * 系统状态
 */
export interface SystemState {
  hermesVersion: string;
  model: ModelInfo;
  authStatus: string;
  components: Record<string, boolean>;
  gatewayStatus: GatewayStatus;
  timestamp: number;
}

/**
 * Agent 变化
 */
export interface AgentChange {
  agentId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

/**
 * 任务更新
 */
export interface TaskUpdateData {
  agentId: string;
  taskType: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  description: string;
  progress?: number;
  toolCall?: ToolCall;
}

/**
 * WebSocket 消息
 */
export interface ServerMessage {
  type: 'system_update' | 'agents_update' | 'log' | 'task_update' | 'session_messages' | 'error';
  timestamp: number;
  data: unknown;
}

export interface AgentsUpdateData {
  agents: PixelAgent[];
  changes: AgentChange[];
}

export interface SessionMessagesData {
  sessionId: string;
  messages: HermesMessage[];
  newMessage?: HermesMessage;
}
