import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';
import { getCurrentTimestamp, safeJsonStringify } from '@/lib/utils';

// GET /api/agents/[id] - 获取单个 Agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const realTimeStatus = memoryStore.getAgentStatus(agent.id);
    const metrics = memoryStore.getAgentMetrics(agent.id);

    return NextResponse.json({
      ...agent,
      currentStatus: realTimeStatus || agent.status,
      metrics
    });
  } catch (error) {
    console.error('Failed to fetch agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/[id] - 更新 Agent
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const existingAgent = await prisma.agent.findUnique({
      where: { id: params.id }
    });

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        displayName: body.displayName,
        avatar: body.avatar ? safeJsonStringify(body.avatar) : undefined,
        status: body.status,
        config: body.config ? safeJsonStringify(body.config) : undefined,
        updatedAt: getCurrentTimestamp()
      }
    });

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    console.error('Failed to update agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id] - 删除 Agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingAgent = await prisma.agent.findUnique({
      where: { id: params.id }
    });

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    await prisma.agent.delete({
      where: { id: params.id }
    });

    // 清理内存中的状态
    memoryStore.setAgentStatus(params.id, 'OFFLINE');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
