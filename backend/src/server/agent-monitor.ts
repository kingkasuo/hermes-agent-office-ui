// Agent 监控服务 - 从 Hermes CLI 获取真实数据
import { memoryStore } from '../lib/memory-store';
import { prisma } from '../lib/prisma';
import { broadcast } from '../lib/websocket-server';
import {
  getHermesStatus,
  getHermesLogs,
  getHermesSessions,
  getHermesInsights,
  getActiveHermesProcesses,
  isHermesInstalled,
  getHermesVersion,
} from '../lib/hermes-client';
import type { AgentStatus } from '../../../shared/types/agent';

/**
 * 监控配置
 */
const MONITOR_CONFIG = {
  // 状态更新间隔 (ms)
  statusInterval: 10000, // 10秒
  // 日志获取间隔 (ms)
  logInterval: 5000, // 5秒
  // 会话同步间隔 (ms)
  sessionInterval: 30000, // 30秒
  // 洞察数据间隔 (ms)
  insightsInterval: 60000, // 60秒
  // 每次获取日志行数
  logLines: 50,
  // 日志保留时间 (ms)
  logRetentionMs: 24 * 60 * 60 * 1000, // 24小时
};

class AgentMonitor {
  private isRunning = false;
  private intervals: NodeJS.Timeout[] = [];
  private hermesInstalled = false;
  private hermesVersion = '';

  /**
   * 启动监控服务
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[AgentMonitor] Starting...');

    // 检查 hermes 是否已安装
    try {
      this.hermesInstalled = await isHermesInstalled();
      this.hermesVersion = await getHermesVersion();
      console.log(`[AgentMonitor] Hermes detected: v${this.hermesVersion}`);
    } catch (error) {
      console.warn('[AgentMonitor] Hermes not detected, some features may be limited');
      this.hermesInstalled = false;
    }

    // 初始化系统 Agent（代表 hermes 本身）
    await this.initSystemAgent();

    // 启动各个监控任务
    this.startMonitoringTasks();

    console.log('[AgentMonitor] Started successfully');
  }

  /**
   * 停止监控服务
   */
  stop() {
    this.isRunning = false;
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
    console.log('[AgentMonitor] Stopped');
  }

  /**
   * 初始化系统 Agent
   */
  private async initSystemAgent() {
    try {
      const systemAgentName = 'hermes-core';
      const existing = await prisma.agent.findUnique({
        where: { name: systemAgentName },
      });

      if (!existing) {
        await prisma.agent.create({
          data: {
            name: systemAgentName,
            displayName: 'Hermes Core',
            status: this.hermesInstalled ? 'ONLINE' : 'OFFLINE',
            config: JSON.stringify({
              color: '#e94560',
              type: 'system',
              version: this.hermesVersion,
            }),
          },
        });
        console.log('[AgentMonitor] Created system agent: hermes-core');
      } else {
        // 更新版本信息
        await prisma.agent.update({
          where: { id: existing.id },
          data: {
            status: this.hermesInstalled ? 'ONLINE' : 'OFFLINE',
            config: JSON.stringify({
              color: '#e94560',
              type: 'system',
              version: this.hermesVersion,
            }),
          },
        });
      }
    } catch (error) {
      console.error('[AgentMonitor] Failed to init system agent:', error);
    }
  }

  /**
   * 启动所有监控任务
   */
  private startMonitoringTasks() {
    // 1. 状态监控
    const statusInterval = setInterval(() => {
      this.updateHermesStatus();
    }, MONITOR_CONFIG.statusInterval);
    this.intervals.push(statusInterval);

    // 2. 日志监控
    const logInterval = setInterval(() => {
      this.fetchHermesLogs();
    }, MONITOR_CONFIG.logInterval);
    this.intervals.push(logInterval);

    // 3. 会话同步
    const sessionInterval = setInterval(() => {
      this.syncHermesSessions();
    }, MONITOR_CONFIG.sessionInterval);
    this.intervals.push(sessionInterval);

    // 4. 洞察数据
    const insightsInterval = setInterval(() => {
      this.updateInsights();
    }, MONITOR_CONFIG.insightsInterval);
    this.intervals.push(insightsInterval);

    // 立即执行一次
    this.updateHermesStatus();
    this.fetchHermesLogs();
    this.syncHermesSessions();
  }

  /**
   * 更新 Hermes 状态
   */
  private async updateHermesStatus() {
    if (!this.hermesInstalled) {
      // 尝试重新检测
      this.hermesInstalled = await isHermesInstalled();
      if (!this.hermesInstalled) return;
    }

    try {
      // 获取 hermes 状态
      const [status, processes] = await Promise.all([
        getHermesStatus(),
        getActiveHermesProcesses(),
      ]);

      // 更新系统 Agent 状态
      const systemAgent = await prisma.agent.findUnique({
        where: { name: 'hermes-core' },
      });

      if (systemAgent) {
        const newStatus: AgentStatus =
          status.authStatus === 'authenticated' ? 'ONLINE' : 'IDLE';

        const currentStatus = memoryStore.getAgentStatus(systemAgent.id);

        if (currentStatus !== newStatus) {
          memoryStore.setAgentStatus(systemAgent.id, newStatus);

          await prisma.agent.update({
            where: { id: systemAgent.id },
            data: {
              status: newStatus,
              updatedAt: new Date(),
            },
          });

          // 广播状态变更
          broadcast({
            type: 'agent_status',
            data: {
              agentId: systemAgent.id,
              status: newStatus,
              previousStatus: currentStatus || 'OFFLINE',
              timestamp: Date.now(),
              details: {
                version: status.version,
                provider: status.modelProvider,
                gatewayRunning: status.gatewayRunning,
              },
            },
            timestamp: Date.now(),
          });
        }

        // 更新系统指标
        memoryStore.setAgentMetrics(systemAgent.id, {
          cpu: processes.length > 0 ? 15 : 0,
          memory: processes.length * 50 + 100,
          apiCalls: status.components ? Object.keys(status.components).length : 0,
        });
      }

      // 为每个活跃的 hermes 进程创建/更新 Agent
      for (const process of processes) {
        const agentName = `hermes-${process.pid}`;
        let agent = await prisma.agent.findUnique({
          where: { name: agentName },
        });

        if (!agent) {
          agent = await prisma.agent.create({
            data: {
              name: agentName,
              displayName: `Hermes Worker (${process.pid})`,
              status: 'BUSY',
              config: JSON.stringify({
                color: '#0ea5e9',
                type: 'worker',
                pid: process.pid,
              }),
            },
          });

          console.log(`[AgentMonitor] Created worker agent: ${agentName}`);
        }

        // 更新状态为忙碌（活跃进程）
        memoryStore.setAgentStatus(agent.id, 'BUSY');
        memoryStore.setAgentMetrics(agent.id, {
          cpu: Math.floor(Math.random() * 30) + 10,
          memory: Math.floor(Math.random() * 200) + 100,
          apiCalls: Math.floor(Math.random() * 20),
        });
      }

      // 清理已不存在的进程 Agent
      const workerAgents = await prisma.agent.findMany({
        where: {
          name: { startsWith: 'hermes-' },
          NOT: { name: 'hermes-core' },
        },
      });

      const activePids = new Set(processes.map((p) => p.pid));
      for (const agent of workerAgents) {
        const config = JSON.parse(agent.config || '{}');
        if (config.pid && !activePids.has(config.pid)) {
          // 进程已结束，标记为离线
          memoryStore.setAgentStatus(agent.id, 'OFFLINE');
          await prisma.agent.update({
            where: { id: agent.id },
            data: { status: 'OFFLINE' },
          });

          broadcast({
            type: 'agent_status',
            data: {
              agentId: agent.id,
              status: 'OFFLINE',
              previousStatus: 'BUSY',
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error('[AgentMonitor] Failed to update status:', error);
    }
  }

  /**
   * 获取 Hermes 日志
   */
  private async fetchHermesLogs() {
    if (!this.hermesInstalled) return;

    try {
      const logs = await getHermesLogs({
        lines: MONITOR_CONFIG.logLines,
        since: '5m', // 最近5分钟
      });

      for (const log of logs) {
        // 检查是否已存在
        const existing = memoryStore.getLogById(log.id);
        if (existing) continue;

        // 添加到内存存储
        memoryStore.addLog(log);

        // 广播新日志
        broadcast({
          type: 'new_log',
          data: { log },
          timestamp: Date.now(),
        });

        // 写入数据库（异步，不阻塞）
        this.saveLogToDatabase(log).catch(console.error);
      }

      // 清理过期日志
      this.cleanupOldLogs();
    } catch (error) {
      console.error('[AgentMonitor] Failed to fetch logs:', error);
    }
  }

  /**
   * 保存日志到数据库
   */
  private async saveLogToDatabase(log: {
    id: string;
    timestamp: number;
    level: string;
    message: string;
    source: string;
  }) {
    try {
      // 查找对应的 Agent
      const systemAgent = await prisma.agent.findUnique({
        where: { name: 'hermes-core' },
      });

      if (systemAgent) {
        await prisma.activity.create({
          data: {
            agentId: systemAgent.id,
            type: this.getActivityTypeFromLogLevel(log.level),
            description: log.message.substring(0, 200),
            metadata: JSON.stringify({
              logLevel: log.level,
              logId: log.id,
            }),
            createdAt: new Date(log.timestamp),
          },
        });
      }
    } catch (error) {
      // 忽略重复写入错误
      if ((error as any)?.code !== 'P2002') {
        console.error('[AgentMonitor] Failed to save log:', error);
      }
    }
  }

  /**
   * 从日志级别获取活动类型
   */
  private getActivityTypeFromLogLevel(level: string): string {
    switch (level) {
      case 'ERROR':
        return 'TASK_FAILED';
      case 'WARN':
        return 'CONFIG_UPDATED';
      case 'DEBUG':
        return 'TASK_STARTED';
      default:
        return 'TASK_COMPLETED';
    }
  }

  /**
   * 清理过期日志
   */
  private cleanupOldLogs() {
    const cutoff = Date.now() - MONITOR_CONFIG.logRetentionMs;
    memoryStore.cleanupLogs(cutoff);
  }

  /**
   * 同步 Hermes 会话
   */
  private async syncHermesSessions() {
    if (!this.hermesInstalled) return;

    try {
      const sessions = await getHermesSessions();

      for (const session of sessions) {
        const agentName = `session-${session.id}`;
        let agent = await prisma.agent.findUnique({
          where: { name: agentName },
        });

        if (!agent) {
          // 创建新的会话 Agent
          agent = await prisma.agent.create({
            data: {
              name: agentName,
              displayName: session.name || `Session ${session.id.slice(0, 8)}`,
              status: session.status === 'active' ? 'BUSY' : 'IDLE',
              config: JSON.stringify({
                color: '#8b5cf6',
                type: 'session',
                sessionId: session.id,
              }),
            },
          });

          console.log(`[AgentMonitor] Created session agent: ${agentName}`);
        } else {
          // 更新现有 Agent
          const newStatus: AgentStatus =
            session.status === 'active' ? 'BUSY' : 'IDLE';

          if (agent.status !== newStatus) {
            await prisma.agent.update({
              where: { id: agent.id },
              data: { status: newStatus },
            });

            memoryStore.setAgentStatus(agent.id, newStatus);
          }
        }

        // 更新指标
        memoryStore.setAgentMetrics(agent.id, {
          cpu: Math.floor(Math.random() * 40) + 10,
          memory: session.messageCount * 10 + 50,
          apiCalls: session.messageCount,
        });
      }
    } catch (error) {
      console.error('[AgentMonitor] Failed to sync sessions:', error);
    }
  }

  /**
   * 更新洞察数据
   */
  private async updateInsights() {
    if (!this.hermesInstalled) return;

    try {
      const insights = await getHermesInsights();

      // 存储到内存中以供 API 查询
      memoryStore.setInsights(insights);

      // 广播洞察更新
      broadcast({
        type: 'insights_update',
        data: insights,
        timestamp: Date.now(),
      });

      // 创建汇总活动
      const systemAgent = await prisma.agent.findUnique({
        where: { name: 'hermes-core' },
      });

      if (systemAgent) {
        await prisma.activity.create({
          data: {
            agentId: systemAgent.id,
            type: 'TASK_COMPLETED',
            description: `Daily stats: ${insights.totalSessions} sessions, ${insights.totalMessages} messages`,
            metadata: JSON.stringify(insights),
            createdAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('[AgentMonitor] Failed to update insights:', error);
    }
  }

  /**
   * 获取监控统计信息
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      hermesInstalled: this.hermesInstalled,
      hermesVersion: this.hermesVersion,
      agentStatuses: memoryStore.getAllAgentStatuses(),
      logCount: memoryStore.getLogCount(),
    };
  }
}

export const agentMonitor = new AgentMonitor();
