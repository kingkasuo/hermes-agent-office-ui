// GET /api/hermes/status - 获取 Hermes 状态
import { NextResponse } from 'next/server';
import { getHermesStatus, isHermesInstalled } from '@/lib/hermes-client';
import { memoryStore } from '@/lib/memory-store';

export async function GET() {
  try {
    const installed = await isHermesInstalled();

    if (!installed) {
      return NextResponse.json({
        installed: false,
        message: 'Hermes is not installed',
      });
    }

    const [status, monitorStats] = await Promise.all([
      getHermesStatus(),
      Promise.resolve({
        agentStatuses: memoryStore.getAllAgentStatuses(),
        agentMetrics: memoryStore.getAllAgentMetrics(),
      }),
    ]);

    return NextResponse.json({
      installed: true,
      status,
      monitorStats,
    });
  } catch (error) {
    console.error('[API /hermes/status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get Hermes status' },
      { status: 500 }
    );
  }
}
