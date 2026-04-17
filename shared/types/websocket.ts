// WebSocket 消息类型定义

export type WebSocketMessageType =
  | 'agent_status'
  | 'agent_connected'
  | 'agent_disconnected'
  | 'new_log'
  | 'task_update'
  | 'task_started'
  | 'task_completed'
  | 'metrics_update'
  | 'system_health'
  | 'ping'
  | 'pong';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  data: T;
  timestamp: number;
}

export interface AgentStatusMessage {
  agentId: string;
  status: string;
  previousStatus: string;
  timestamp: number;
}

export interface NewLogMessage {
  log: {
    id: string;
    agentId?: string;
    level: string;
    message: string;
    timestamp: number;
  };
}

export interface TaskUpdateMessage {
  taskId: string;
  agentId: string;
  status: string;
  previousStatus: string;
  progress?: number;
}

export interface MetricsUpdateMessage {
  agentId: string;
  cpuUsage: number;
  memoryUsage: number;
  apiCalls: number;
  timestamp: number;
}

export interface SystemHealthMessage {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: number;
  connections: number;
}
