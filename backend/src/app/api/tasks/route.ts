import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';
import { getCurrentTimestamp, safeJsonStringify, safeJsonParse } from '@/lib/utils';
import type { TaskStatus, TaskType } from '@shared/types/task';

// GET /api/tasks - 获取所有任务
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - 创建新任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.agentId || !body.type) {
      return NextResponse.json(
        { error: 'agentId and type are required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { id: body.agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const task = await prisma.task.create({
      data: {
        agentId: body.agentId,
        type: body.type,
        status: 'PENDING',
        payload: body.payload ? safeJsonStringify(body.payload) : null,
        createdAt: getCurrentTimestamp(),
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
