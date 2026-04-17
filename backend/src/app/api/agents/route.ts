import { NextRequest, NextResponse } from 'next/server';

// In-memory store for agents (simulates database)
const agentsStore = new Map();

// Initialize with demo agents
const demoAgents = [
  { id: '1', name: 'hermes-1', displayName: 'Hermes Alpha', status: 'ONLINE', color: '#e94560' },
  { id: '2', name: 'hermes-2', displayName: 'Hermes Beta', status: 'BUSY', color: '#4ade80' },
  { id: '3', name: 'hermes-3', displayName: 'Hermes Gamma', status: 'IDLE', color: '#ffd700' },
  { id: '4', name: 'hermes-4', displayName: 'Hermes Delta', status: 'OFFLINE', color: '#0f3460' },
];

// Initialize store
demoAgents.forEach(agent => {
  agentsStore.set(agent.id, {
    ...agent,
    avatar: agent.color,
    config: '{}',
    createdAt: Date.now() / 1000,
    updatedAt: Date.now() / 1000,
  });
});

// GET /api/agents - Get all agents
export async function GET() {
  const agents = Array.from(agentsStore.values());
  return NextResponse.json({ agents });
}

// POST /api/agents - Create new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newAgent = {
      id: crypto.randomUUID(),
      name: body.name || `agent-${Date.now()}`,
      displayName: body.displayName || body.name || 'New Agent',
      status: 'OFFLINE',
      avatar: body.color || '#e94560',
      config: body.config || '{}',
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    };
    
    agentsStore.set(newAgent.id, newAgent);
    
    return NextResponse.json({ agent: newAgent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 400 }
    );
  }
}