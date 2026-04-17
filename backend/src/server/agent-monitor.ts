// Agent 监控服务 - 模拟和监控 Agent 状态
import { memoryStore } from '../lib/memory-store';
import { prisma } from '../lib/prisma';
import { broadcast } from '../lib/websocket-server';
import type { AgentStatus } from '../../../shared/types/agent';
import { randomInt, getCurrentTimestamp } from '../lib/utils';

class AgentMonitor {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private mockAgents = [
    { name: 'researcher-1', displayName: '研究员 Alpha', color: '#e94560' },
    { name: 'coder-1', displayName: '程序员 Beta', color: '#0ea5e9' },
    { name: 'analyst-1', displayName: '分析师 Gamma', color: '#8b5cf6' },
    { name: 'assistant-1', displayName: '助手 Delta', color: '#10b981' },
  ];

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[AgentMonitor] Starting...');

    // 初始化模拟 Agent
    await this.initMockAgents();

    // 启动监控循环
    this.interval = setInterval(() => {
      this.updateAgentStatuses();
      this.generateMockMetrics();
      this.generateMockLogs();
    }, 5000);

    // 模拟任务更新
    setInterval(() => {
      this.updateMockTasks();
    }, 3000);
  }

  stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('[AgentMonitor] Stopped');
  }

  private async initMockAgents() {
    for (const agentData of this.mockAgents) {
      const existing = await prisma.agent.findUnique({
        where: { name: agentData.name }
      });

      if (!existing) {
        const agent = await prisma.agent.create({
          data: {
            name: agentData.name,
            displayName: agentData.displayName,
            status: 'OFFLINE',
            config: JSON.stringify({ color: agentData.color }),
          }
        });
        console.log(`[AgentMonitor] Created mock agent: ${agent.name}`);
      }
    }
  }

  private async updateAgentStatuses() {
    const agents = await prisma.agent.findMany();

    for (const agent of agents) {
      const statuses: AgentStatus[] = ['ONLINE', 'OFFLINE', 'BUSY', 'IDLE'];
      const weights = [0.3, 0.1, 0.3, 0.3]; // 加权概率

      const random = Math.random();
      let cumulative = 0;
      let newStatus: AgentStatus = 'OFFLINE';

      for (let i = 0; i < statuses.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
          newStatus = statuses[i];
          break;
        }
      }

      const currentStatus = memoryStore.getAgentStatus(agent.id);
      if (currentStatus !== newStatus) {
        memoryStore.setAgentStatus(agent.id, newStatus);

        // 更新数据库
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            status: newStatus,
            updatedAt: getCurrentTimestamp()
          }
        });

        // 广播状态变更
        broadcast({
          type: 'agent_status',
          data: {
            agentId: agent.id,
            status: newStatus,
            previousStatus: currentStatus || 'OFFLINE',
            timestamp: Date.now()
          },
          timestamp: Date.now()
        });

        // 记录活动
        await prisma.activity.create({
          data: {
            agentId: agent.id,
            type: newStatus === 'ONLINE' ? 'AGENT_ONLINE' : 'AGENT_OFFLINE',
            description: `Agent ${newStatus.toLowerCase()}`,
            createdAt: getCurrentTimestamp()
          }
        });
      }
    }
  }

  private generateMockMetrics() {
    const statuses = memoryStore.getAllAgentStatuses();

    for (const [agentId, status] of Object.entries(statuses)) {
      if (status === 'ONLINE' || status === 'BUSY') {
        const cpu = randomInt(10, 80);
        const memory = randomInt(100, 800);
        const apiCalls = randomInt(0, 50);

        memoryStore.setAgentMetrics(agentId, { cpu, memory, apiCalls });

        // 广播指标更新
        broadcast({
          type: 'metrics_update',
          data: {
            agentId,
            cpuUsage: cpu,
            memoryUsage: memory,
            apiCalls,
            timestamp: Date.now()
          },
          timestamp: Date.now()
        });
      }
    }
  }

  private generateMockLogs() {
    const statuses = memoryStore.getAllAgentStatuses();
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const;
    const messages = [
      'Task execution started',
      'Processing data batch',
      'API call completed',
      'Cache updated',
      'Connection established',
      'Resource limit approaching',
      'Retry attempt failed',
      'Task completed successfully'
    ];

    for (const agentId of Object.keys(statuses)) {
      if (Math.random() > 0.7) { // 30% 概率生成日志
        const level = levels[randomInt(0, levels.length - 1)];
        const message = messages[randomInt(0, messages.length - 1)];

        const logEntry = {
          id: crypto.randomUUID(),
          agentId,
          level,
          message,
          timestamp: Date.now(),
          source: 'agent'
        };

        memoryStore.addLog(logEntry);

        broadcast({
          type: 'new_log',
          data: { log: logEntry },
          timestamp: Date.now()
        });
      }
    }
  }

  private async updateMockTasks() {
    const runningTasks = await prisma.task.findMany({
      where: { status: 'RUNNING' }
    });

    for (const task of runningTasks) {
      if (Math.random() > 0.5) { // 50% 概率完成任务
        const newStatus = Math.random() > 0.2 ? 'COMPLETED' : 'FAILED';

        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: newStatus,
            completedAt: getCurrentTimestamp()
          }
        });

        broadcast({
          type: 'task_update',
          data: {
            taskId: task.id,
            agentId: task.agentId,
            status: newStatus,
            previousStatus: 'RUNNING'
          },
          timestamp: Date.now()
        });

        // 记录活动
        await prisma.activity.create({
          data: {
            agentId: task.agentId,
            type: newStatus === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_FAILED',
            description: `Task ${newStatus.toLowerCase()}: ${task.type}`,
            createdAt: getCurrentTimestamp()
          }
        });
      }
    }

    // 随机创建新任务
    if (Math.random() > 0.6) {
      const agents = await prisma.agent.findMany({
        where: { status: { in: ['ONLINE', 'IDLE'] } }
      });

      if (agents.length > 0) {
        const agent = agents[randomInt(0, agents.length - 1)];
        const types = ['RESEARCH', 'CODE_GENERATION', 'ANALYSIS', 'COMMUNICATION', 'MAINTENANCE'];

        const task = await prisma.task.create({
          data: {
            agentId: agent.id,
            type: types[randomInt(0, types.length - 1)],
            status: 'RUNNING',
            startedAt: getCurrentTimestamp(),
            payload: JSON.stringify({ mock: true, priority: randomInt(1, 5) })
          }
        });

        // 更新 Agent 状态为忙碌
        memoryStore.setAgentStatus(agent.id, 'BUSY');
        await prisma.agent.update({
          where: { id: agent.id },
          data: { status: 'BUSY' }
        });

        broadcast({
          type: 'task_started',
          data: { taskId: task.id, agentId: agent.id },
          timestamp: Date.now()
        });
      }
    }
  }
}

export const agentMonitor = new AgentMonitor();
