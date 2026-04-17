// Agent status types
export type AgentStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'IDLE' | 'ERROR';

// Task type
export type TaskType = 'RESEARCH' | 'CODE_GENERATION' | 'ANALYSIS' | 'COMMUNICATION' | 'MAINTENANCE';

// Task status
export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Activity type
export type ActivityType = 'TASK_STARTED' | 'TASK_COMPLETED' | 'TASK_FAILED' | 'AGENT_ONLINE' | 'AGENT_OFFLINE' | 'CONFIG_UPDATED';

// Agent interface
export interface Agent {
  id: string;
  name: string;
  displayName: string;
  avatar?: string;
  status: AgentStatus;
  config?: string;
  createdAt: number;
  updatedAt: number;
}

// Task interface
export interface Task {
  id: string;
  agentId: string;
  type: TaskType;
  status: TaskStatus;
  payload?: string;
  result?: string;
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
}

// Activity interface
export interface Activity {
  id: string;
  agentId: string;
  type: ActivityType;
  description: string;
  metadata?: string;
  createdAt: number;
}

// AgentMetric interface
export interface AgentMetric {
  id: string;
  agentId: string;
  cpuUsage?: number;
  memoryUsage?: number;
  apiCalls: number;
  timestamp: number;
}

// WebSocket message types
export interface WSAgentUpdate {
  type: 'AGENT_UPDATE';
  payload: {
    agentId: string;
    status: AgentStatus;
    message?: string;
  };
}

export interface WSTaskUpdate {
  type: 'TASK_UPDATE';
  payload: {
    taskId: string;
    status: TaskStatus;
    progress?: number;
  };
}

export interface WSLogEntry {
  type: 'LOG';
  payload: {
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: number;
    agentId?: string;
  };
}

export type WSMessage = WSAgentUpdate | WSTaskUpdate | WSLogEntry;

// Re-export from individual files
export * from './agent';
export * from './task';
export * from './log';
export * from './websocket';