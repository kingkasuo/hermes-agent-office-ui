import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';
import { getWebSocketServer } from '@/lib/websocket-server';

// GET /api/stats - 获取仪表盘统计
export async function GET() {
  try {
    const [
      totalAgents,
      onlineAgents,
      totalTasks,
      completedTasks,
      runningTasks,
      recentActivities,
    ] = await Promise.all([
      prisma.agent.count(),
      prisma.agent.count({
        where: { status: { in: ['ONLINE', 'BUSY', 'IDLE'] } },
      }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.task.count({ where: { status: 'RUNNING' } }),
      prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          agent: {
            select: {
              name: true,
              displayName: true,
            },
          },
        },
      }),
    ]);

    // Get system health
    const agentStatuses = memoryStore.getAllAgentStatuses();
    const agentMetrics = memoryStore.getAllAgentMetrics();

    // Calculate average CPU and memory
    const metrics = Object.values(agentMetrics);
    const avgCpu = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length
      : 0;
    const avgMemory = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length
      : 0;

    return NextResponse.json({
      agents: {
        total: totalAgents,
        online: onlineAgents,
        offline: totalAgents - onlineAgents,
        busy: Object.values(agentStatuses).filter((s) => s === 'BUSY').length,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        running: runningTasks,
        pending: totalTasks - completedTasks - runningTasks,
      },
      system: {
        avgCpu: Math.round(avgCpu),
        avgMemory: Math.round(avgMemory),
        uptime: process.uptime(),
      },
      recentActivities,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
