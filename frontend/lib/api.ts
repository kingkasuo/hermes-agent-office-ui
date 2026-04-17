import { Agent, AgentWithStatus, CreateAgentRequest, UpdateAgentRequest } from "@shared/types/agent";
import { Task, TaskStats, CreateTaskRequest } from "@shared/types/task";
import { LogEntry, LogFilter, LogQueryResult, LogStats } from "@shared/types/log";
import { API_ROUTES } from "@shared/constants/api-routes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Helper function for API calls
async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Agent API
export const agentAPI = {
  getAll: () => fetchAPI<{ agents: AgentWithStatus[] }>(API_ROUTES.AGENTS),

  getById: (id: string) => fetchAPI<{ agent: AgentWithStatus }>(API_ROUTES.AGENT_BY_ID(id)),

  create: (data: CreateAgentRequest) =>
    fetchAPI<{ agent: Agent }>(API_ROUTES.AGENTS, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateAgentRequest) =>
    fetchAPI<{ agent: Agent }>(API_ROUTES.AGENT_BY_ID(id), {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchAPI<{ success: boolean }>(API_ROUTES.AGENT_BY_ID(id), {
      method: "DELETE",
    }),

  getMetrics: (id: string) => fetchAPI(API_ROUTES.AGENT_METRICS(id)),

  getActivities: (id: string) => fetchAPI(API_ROUTES.AGENT_ACTIVITIES(id)),
};

// Task API
export const taskAPI = {
  getAll: () => fetchAPI<{ tasks: Task[] }>(API_ROUTES.TASKS),

  getById: (id: string) => fetchAPI<{ task: Task }>(API_ROUTES.TASK_BY_ID(id)),

  create: (data: CreateTaskRequest) =>
    fetchAPI<{ task: Task }>(API_ROUTES.TASKS, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Task>) =>
    fetchAPI<{ task: Task }>(API_ROUTES.TASK_BY_ID(id), {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getStats: () => fetchAPI<TaskStats>(API_ROUTES.TASK_STATS),
};

// Log API
export const logAPI = {
  getAll: (filter?: LogFilter) => {
    const params = new URLSearchParams();
    if (filter?.agentId) params.append("agentId", filter.agentId);
    if (filter?.level) params.append("level", filter.level);
    if (filter?.search) params.append("search", filter.search);
    if (filter?.startTime) params.append("startTime", filter.startTime.toString());
    if (filter?.endTime) params.append("endTime", filter.endTime.toString());

    return fetchAPI<LogQueryResult>(`${API_ROUTES.LOGS}?${params}`);
  },

  getStats: () => fetchAPI<LogStats>(API_ROUTES.LOG_STATS),
};

// Stats API
export const statsAPI = {
  getDashboard: () => fetchAPI(API_ROUTES.STATS),
};

// Health API
export const healthAPI = {
  check: () => fetchAPI(API_ROUTES.HEALTH),
};
