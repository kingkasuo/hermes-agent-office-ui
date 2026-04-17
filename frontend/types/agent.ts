// Agent type for frontend
export type AgentStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'IDLE' | 'ERROR';

export interface Agent {
  id: string;
  name: string;
  displayName: string;
  avatar?: string;
  status: AgentStatus;
  config?: string;
  createdAt: number;
  updatedAt: number;
  // Additional fields for display
  currentTask?: string;
  lastActivity?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  apiCalls?: number;
}

// Task type for frontend
export interface Task {
  id: string;
  agentId: string;
  type: string;
  status: string;
  payload?: string;
  result?: string;
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
}

// Activity type for frontend
export interface Activity {
  id: string;
  agentId: string;
  type: string;
  description: string;
  metadata?: string;
  createdAt: number;
}

// Agent metric for frontend
export interface AgentMetric {
  id: string;
  agentId: string;
  cpuUsage?: number;
  memoryUsage?: number;
  apiCalls: number;
  timestamp: number;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  payload: any;
}

// Agent update from WebSocket
export interface AgentUpdate {
  type: 'AGENT_UPDATE';
  payload: {
    agentId: string;
    status: AgentStatus;
    message?: string;
  };
}

// Task update from WebSocket  
export interface TaskUpdate {
  type: 'TASK_UPDATE';
  payload: {
    taskId: string;
    status: string;
    progress?: number;
  };
}

// Log entry from WebSocket
export interface LogEntry {
  type: 'LOG';
  payload: {
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: number;
    agentId?: string;
  };
}