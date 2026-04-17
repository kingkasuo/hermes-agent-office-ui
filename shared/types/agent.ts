// Agent 相关类型定义

export type AgentStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'IDLE' | 'ERROR';

export interface Agent {
  id: string;
  name: string;
  displayName: string;
  avatar?: string;
  status: AgentStatus;
  config?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface AgentWithStatus extends Agent {
  currentStatus: AgentStatus;
  isOnline: boolean;
}

export interface AgentMetric {
  id: string;
  agentId: string;
  cpuUsage?: number;
  memoryUsage?: number;
  apiCalls: number;
  timestamp: number;
}

export interface AgentActivity {
  id: string;
  agentId: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export type ActivityType =
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'AGENT_ONLINE'
  | 'AGENT_OFFLINE'
  | 'CONFIG_UPDATED';

export interface AgentConfig {
  color: string;
  pixelArt: PixelArtConfig;
  capabilities: string[];
  maxConcurrentTasks: number;
}

export interface PixelArtConfig {
  baseColor: string;
  accentColor: string;
  eyeType: 'normal' | 'focused' | 'sleepy' | 'excited';
  accessory?: 'glasses' | 'headphones' | 'hat' | 'none';
}

export interface CreateAgentRequest {
  name: string;
  displayName: string;
  config?: AgentConfig;
}

export interface UpdateAgentRequest {
  displayName?: string;
  status?: AgentStatus;
  config?: AgentConfig;
}
