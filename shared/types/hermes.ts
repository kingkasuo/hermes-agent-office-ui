// Hermes CLI 相关类型定义

/**
 * Hermes 状态信息
 */
export interface HermesStatus {
  version: string;
  configLoaded: boolean;
  authStatus: 'authenticated' | 'not_authenticated' | 'unknown' | 'error';
  modelProvider: string;
  gatewayRunning: boolean;
  components: Record<string, boolean>;
  timestamp: number;
  error?: string;
}

/**
 * Hermes 日志条目
 */
export interface HermesLog {
  id: string;
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  source: string;
  raw?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Hermes 会话信息
 */
export interface HermesSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  status: 'active' | 'paused' | 'completed' | 'error';
  parentId?: string;
  skillNames?: string[];
}

/**
 * Hermes 使用洞察
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
  period: string; // e.g., '7d', '30d', '24h'
  timestamp: number;
}

/**
 * Hermes Agent 运行时状态
 */
export interface HermesAgentRuntime {
  id: string;
  name: string;
  displayName: string;
  status: 'online' | 'offline' | 'busy' | 'idle' | 'error';
  currentSession?: string;
  activeSkills: string[];
  uptime: number;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    apiCalls: number;
  };
  lastActivity: number;
}

/**
 * 会话详情
 */
export interface HermesSessionDetail extends HermesSession {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }>;
  toolCalls: Array<{
    tool: string;
    input: Record<string, unknown>;
    output?: unknown;
    timestamp: number;
  }>;
}
