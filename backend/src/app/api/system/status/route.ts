import { NextResponse } from 'next/server';
import { memoryStore } from '../../../../lib/memory-store';
import { monitorService } from '../../../../server/monitor-service';

export async function GET() {
  try {
    const systemState = memoryStore.getSystemState();
    const config = memoryStore.getHermesConfig();
    const gatewayStatus = memoryStore.getGatewayStatus();
    const stats = monitorService.getStats();

    return NextResponse.json({
      system: systemState,
      config,
      gateway: gatewayStatus,
      stats: {
        ...stats,
        memory: memoryStore.getStats(),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Failed to get system status:', error);
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}
