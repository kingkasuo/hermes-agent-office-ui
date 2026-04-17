// 内存状态缓存 - 零依赖实时数据存储
import type { WebSocket } from 'ws';
import type { LogEntry } from '../../../shared/types/log';
import type { AgentStatus } from '../../../shared/types/agent';
import type {
  HermesSystemStatus,
  HermesConfig,
  GatewayStatus,
  HermesSession,
  HermesLog,
  HermesInsights,
  PixelAgent,
  SystemState,
  AgentChange,
} from '../../../shared/types/hermes';

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

class MemoryStore {
  private cache = new Map<string, CacheEntry<unknown>>();
  private agentStatuses = new Map<string, AgentStatus>();
  private agentMetrics = new Map<string, { cpu: number; memory: number; apiCalls: number; timestamp: number }>();
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private wsClients = new Set<WebSocket>();
  private insights: HermesInsights | null = null;

  // ===== 新架构数据 =====
  private agents = new Map<string, PixelAgent>();
  private sessions = new Map<string, HermesSession>();
  private hermesLogs: HermesLog[] = [];
  private systemState: SystemState | null = null;
  private hermesConfig: HermesConfig | null = null;
  private gatewayStatus: GatewayStatus | null = null;

  // ========== 系统状态 (新架构) ==========

  setSystemState(state: SystemState) {
    this.systemState = state;
  }

  getSystemState(): SystemState | null {
    return this.systemState;
  }

  setHermesConfig(config: HermesConfig) {
    this.hermesConfig = config;
  }

  getHermesConfig(): HermesConfig | null {
    return this.hermesConfig;
  }

  setGatewayStatus(status: GatewayStatus) {
    this.gatewayStatus = status;
  }

  getGatewayStatus(): GatewayStatus | null {
    return this.gatewayStatus;
  }

  // ========== Pixel Agent 管理 (新架构) ==========

  setAgent(agent: PixelAgent) {
    this.agents.set(agent.id, agent);
  }

  getAgent(id: string): PixelAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): PixelAgent[] {
    return Array.from(this.agents.values());
  }

  removeAgent(id: string) {
    this.agents.delete(id);
  }

  detectAgentChanges(newAgents: PixelAgent[]): AgentChange[] {
    const changes: AgentChange[] = [];

    for (const newAgent of newAgents) {
      const oldAgent = this.agents.get(newAgent.id);

      if (!oldAgent) {
        changes.push({
          agentId: newAgent.id,
          field: 'created',
          oldValue: null,
          newValue: newAgent,
          timestamp: Date.now(),
        });
      } else {
        if (oldAgent.status !== newAgent.status) {
          changes.push({
            agentId: newAgent.id,
            field: 'status',
            oldValue: oldAgent.status,
            newValue: newAgent.status,
            timestamp: Date.now(),
          });
        }

        if (oldAgent.currentActivity?.type !== newAgent.currentActivity?.type) {
          changes.push({
            agentId: newAgent.id,
            field: 'currentActivity',
            oldValue: oldAgent.currentActivity,
            newValue: newAgent.currentActivity,
            timestamp: Date.now(),
          });
        }
      }
    }

    const newAgentIds = new Set(newAgents.map(a => a.id));
    for (const [id, agent] of this.agents) {
      if (!newAgentIds.has(id)) {
        changes.push({
          agentId: id,
          field: 'deleted',
          oldValue: agent,
          newValue: null,
          timestamp: Date.now(),
        });
      }
    }

    return changes;
  }

  // ========== 会话管理 (新架构) ==========

  setSession(session: HermesSession) {
    this.sessions.set(session.id, session);
  }

  getSession(id: string): HermesSession | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(): HermesSession[] {
    return Array.from(this.sessions.values());
  }

  removeSession(id: string) {
    this.sessions.delete(id);
  }

  // ========== Hermes 日志 (新架构) ==========

  addHermesLog(log: HermesLog) {
    const exists = this.hermesLogs.some(l => l.id === log.id);
    if (exists) return;

    this.hermesLogs.unshift(log);
    if (this.hermesLogs.length > this.maxLogs) {
      this.hermesLogs = this.hermesLogs.slice(0, this.maxLogs);
    }
  }

  getRecentHermesLogs(limit = 100): HermesLog[] {
    return this.hermesLogs.slice(0, limit);
  }

  getHermesLogsByComponent(component: string, limit = 100): HermesLog[] {
    return this.hermesLogs
      .filter(log => log.component === component)
      .slice(0, limit);
  }

  // ========== 兼容旧架构 ==========

  setAgentStatus(agentId: string, status: AgentStatus) {
    this.agentStatuses.set(agentId, status);
  }

  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agentStatuses.get(agentId);
  }

  getAllAgentStatuses(): Record<string, AgentStatus> {
    return Object.fromEntries(this.agentStatuses);
  }

  setAgentMetrics(agentId: string, metrics: { cpu: number; memory: number; apiCalls: number }) {
    this.agentMetrics.set(agentId, { ...metrics, timestamp: Date.now() });
  }

  getAgentMetrics(agentId: string) {
    return this.agentMetrics.get(agentId);
  }

  getAllAgentMetrics() {
    return Object.fromEntries(this.agentMetrics);
  }

  setInsights(insights: HermesInsights) {
    this.insights = insights;
  }

  getInsights(): HermesInsights | null {
    return this.insights;
  }

  // ========== 通用缓存 ==========

  set<T>(key: string, value: T, ttlSeconds?: number) {
    this.cache.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
    });
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  // ========== 日志缓存 (旧架构兼容) ==========

  addLog(log: LogEntry) {
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  getRecentLogs(limit = 100): LogEntry[] {
    return this.logs.slice(0, limit);
  }

  getLogsByAgent(agentId: string, limit = 100): LogEntry[] {
    return this.logs.filter(log => log.agentId === agentId).slice(0, limit);
  }

  getLogById(id: string): LogEntry | undefined {
    return this.logs.find(log => log.id === id);
  }

  cleanupLogs(cutoff: number) {
    this.logs = this.logs.filter(log => log.timestamp >= cutoff);
  }

  getLogCount(): number {
    return this.logs.length;
  }

  // ========== WebSocket 管理 ==========

  addWsClient(ws: WebSocket) {
    this.wsClients.add(ws);
  }

  removeWsClient(ws: WebSocket) {
    this.wsClients.delete(ws);
  }

  getWsClients(): WebSocket[] {
    return Array.from(this.wsClients);
  }

  broadcast(message: unknown) {
    const messageStr = JSON.stringify(message);
    this.wsClients.forEach(ws => {
      if (ws.readyState === 1) { // OPEN
        ws.send(messageStr);
      }
    });
  }

  // ========== 清理 ==========

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    for (const [agentId, metrics] of this.agentMetrics.entries()) {
      if (now - metrics.timestamp > 5 * 60 * 1000) {
        this.agentMetrics.delete(agentId);
      }
    }
  }

  // ========== 统计 ==========

  getStats() {
    return {
      agents: this.agents.size,
      sessions: this.sessions.size,
      hermesLogs: this.hermesLogs.length,
      cache: this.cache.size,
      wsClients: this.wsClients.size,
    };
  }
}

// 单例模式
export const memoryStore = new MemoryStore();

// 定期清理
setInterval(() => memoryStore.cleanup(), 60000);
