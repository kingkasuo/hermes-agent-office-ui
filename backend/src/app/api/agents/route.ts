import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';
import { getCurrentTimestamp, safeJsonStringify } from '@/lib/utils';

// GET /api/agents - 获取所有 Agent
export async function GET() {
  try {
    console.log('[API /agents] Fetching agents...');
    const agents = await prisma.agent.findMany({
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`[API /agents] Found ${agents.length} agents`);

    // 合并实时状态
    const agentsWithStatus = agents.map((agent) => {
      const realTimeStatus = memoryStore.getAgentStatus(agent.id);
      const metrics = memoryStore.getAgentMetrics(agent.id);
      return {
        ...agent,
        currentStatus: realTimeStatus || agent.status,
        metrics: metrics || null,
        taskCount: agent._count.tasks
      };
    });

    return NextResponse.json({ agents: agentsWithStatus });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - 创建新 Agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.displayName) {
      return NextResponse.json(
        { error: 'Name and displayName are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.agent.findUnique({
      where: { name: body.name }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Agent with this name already exists' },
        { status: 409 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name: body.name,
        displayName: body.displayName,
        avatar: body.avatar ? safeJsonStringify(body.avatar) : null,
        status: 'OFFLINE',
        config: body.config ? safeJsonStringify(body.config) : null,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      }
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}