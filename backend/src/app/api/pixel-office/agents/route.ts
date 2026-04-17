import { NextResponse } from 'next/server';
import { memoryStore } from '../../../../lib/memory-store';
import { getSessions } from '../../../../lib/hermes-client';

export async function GET() {
  try {
    // Get agents from memory store
    const agents = memoryStore.getAllAgents();

    // If no agents in memory, fetch from CLI
    if (agents.length === 0) {
      const sessions = await getSessions();
      return NextResponse.json({
        agents: [],
        sessions: sessions.map(s => ({
          ...s,
          agentId: `session-${s.id}`,
        })),
        layout: generateOfficeLayout(sessions.length),
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      agents,
      layout: generateOfficeLayout(agents.filter(a => a.type === 'session').length),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Failed to get pixel office agents:', error);
    return NextResponse.json(
      { error: 'Failed to get agents' },
      { status: 500 }
    );
  }
}

function generateOfficeLayout(sessionCount: number) {
  const cols = 4;
  const rows = Math.ceil((sessionCount + 1) / cols); // +1 for Gateway

  return {
    rows,
    cols,
    cellSize: 120,
    spacing: 20,
    workstations: [
      // Gateway at position (0, 0)
      {
        id: 'gateway',
        x: 0,
        y: 0,
        type: 'gateway',
        agentId: 'gateway-main',
      },
      // Sessions fill the rest
      ...Array.from({ length: sessionCount }, (_, i) => ({
        id: `desk-${i}`,
        x: ((i + 1) % cols),
        y: Math.floor((i + 1) / cols),
        type: 'desk' as const,
        agentId: `session-${i}`,
      })),
    ],
  };
}
