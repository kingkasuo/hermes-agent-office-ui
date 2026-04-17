import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TaskType, TaskStatus } from '@shared/types/task';

// GET /api/tasks/stats - 获取任务统计
export async function GET() {
  try {
    const [
      total,
      completed,
      failed,
      running,
      pending,
      cancelled,
      byType,
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.task.count({ where: { status: 'FAILED' } }),
      prisma.task.count({ where: { status: 'RUNNING' } }),
      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.task.count({ where: { status: 'CANCELLED' } }),
      prisma.task.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
    ]);

    const byTypeRecord: Record<string, number> = {};
    byType.forEach((item) => {
      byTypeRecord[item.type] = item._count.type;
    });

    const byAgent = await prisma.task.groupBy({
      by: ['agentId'],
      _count: { agentId: true },
    });

    const byAgentRecord: Record<string, number> = {};
    byAgent.forEach((item) => {
      byAgentRecord[item.agentId] = item._count.agentId;
    });

    return NextResponse.json({
      total,
      completed,
      failed,
      running,
      pending,
      cancelled,
      byType: byTypeRecord,
      byAgent: byAgentRecord,
    });
  } catch (error) {
    console.error('Failed to fetch task stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task stats' },
      { status: 500 }
    );
  }
}
