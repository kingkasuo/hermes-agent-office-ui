// 任务相关类型定义

export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type TaskType =
  | 'RESEARCH'
  | 'CODE_GENERATION'
  | 'ANALYSIS'
  | 'COMMUNICATION'
  | 'MAINTENANCE';

export interface Task {
  id: string;
  agentId: string;
  type: TaskType;
  status: TaskStatus;
  payload?: Record<string, unknown>;
  result?: Record<string, unknown>;
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
}

export interface TaskWithAgent extends Task {
  agent: {
    id: string;
    name: string;
    displayName: string;
  };
}

export interface CreateTaskRequest {
  agentId: string;
  type: TaskType;
  payload?: Record<string, unknown>;
}

export interface UpdateTaskRequest {
  status?: TaskStatus;
  result?: Record<string, unknown>;
}

export interface TaskStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  cancelled: number;
  byType: Record<TaskType, number>;
  byAgent: Record<string, number>;
}

export interface TaskTimelineItem {
  id: string;
  agentId: string;
  agentName: string;
  type: TaskType;
  status: TaskStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
}
