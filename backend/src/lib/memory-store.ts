// 内存缓存组件 - 零依赖架构
import type { WebSocket } from 'ws';
import type { LogEntry } from '../../../shared/types/log';
import type { AgentStatus } from '../../../shared/types/agent';
import type { HermesInsights } from '../../../shared/types/hermes';

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

  // Agent 实时状态
  setAgentStatus(agentId: string, status: AgentStatus) {
    this.agentStatuses.set(agentId, status);
  }

  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agentStatuses.get(agentId);
  }

  getAllAgentStatuses(): Record<string, AgentStatus> {
    return Object.fromEntries(this.agentStatuses);
  }

  // Agent 实时指标
  setAgentMetrics(agentId: string, metrics: { cpu: number; memory: number; apiCalls: number }) {
    this.agentMetrics.set(agentId, { ...metrics, timestamp: Date.now() });
  }

  getAgentMetrics(agentId: string) {
    return this.agentMetrics.get(agentId);
  }

  getAllAgentMetrics() {
    return Object.fromEntries(this.agentMetrics);
  }

  // 通用缓存
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

  // 日志缓存
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

  // WebSocket 客户端管理
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

  // 清理过期缓存
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    // 清理过期的 metrics (超过5分钟)
    for (const [agentId, metrics] of this.agentMetrics.entries()) {
      if (now - metrics.timestamp > 5 * 60 * 1000) {
        this.agentMetrics.delete(agentId);
      }
    }
  }

  // 日志高级操作
  getLogById(id: string): LogEntry | undefined {
    return this.logs.find(log => log.id === id);
  }

  cleanupLogs(cutoff: number) {
    this.logs = this.logs.filter(log => log.timestamp >= cutoff);
  }

  getLogCount(): number {
    return this.logs.length;
  }

  // Hermes 洞察数据
  setInsights(insights: HermesInsights) {
    this.insights = insights;
  }

  getInsights(): HermesInsights | null {
    return this.insights;
  }
}

// 单例模式
export const memoryStore = new MemoryStore();

// 定期清理
setInterval(() => memoryStore.cleanup(), 60000);
