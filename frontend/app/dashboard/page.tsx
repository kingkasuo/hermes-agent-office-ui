'use client';

import { useState, useEffect, useMemo } from 'react';
import { AgentAvatar } from '@/components/pixel-office/AgentAvatar';
import { PixelChart, DonutChart, MetricsDisplay, ActivityFeed, ActivityItem } from '@/components/pixel-office/Charts';

// Activity item type
interface Activity {
  id: string;
  time: string;
  agent: string;
  action: string;
  level: 'info' | 'warn' | 'error' | 'idle';
}

// Demo agent data (simulating API response)
type AgentStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'IDLE' | 'ERROR';

const demoAgents: Array<{id: string; name: string; status: AgentStatus; color: string; task: string}> = [
  { id: '1', name: 'Hermes Alpha', status: 'ONLINE', color: '#e94560', task: 'Researching' },
  { id: '2', name: 'Hermes Beta', status: 'BUSY', color: '#4ade80', task: 'Coding' },
  { id: '3', name: 'Hermes Gamma', status: 'IDLE', color: '#ffd700', task: 'Waiting' },
  { id: '4', name: 'Hermes Delta', status: 'OFFLINE', color: '#0f3460', task: 'Offline' },
  { id: '5', name: 'Hermes Epsilon', status: 'ERROR', color: '#ef4444', task: 'Error' },
];

// Generate random historical data
function generateHistoricalData(base: number, variance: number, points: number): number[] {
  return Array.from({ length: points }, () => 
    Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance))
  );
}

// Initial activities
const initialActivities: ActivityItem[] = [
  { id: '1', time: '14:32', agent: 'Hermes Alpha', action: 'completed research task', level: 'info' },
  { id: '2', time: '14:28', agent: 'Hermes Beta', action: 'started code generation', level: 'info' },
  { id: '3', time: '14:15', agent: 'Hermes Gamma', action: 'is idle', level: 'idle' },
  { id: '4', time: '14:02', agent: 'Hermes Alpha', action: 'error: API rate limit', level: 'error' },
  { id: '5', time: '13:45', agent: 'Hermes Delta', action: 'went offline', level: 'idle' },
];

export default function DashboardPage() {
  const [agents, setAgents] = useState(demoAgents);
  const [stats, setStats] = useState({ online: 2, busy: 1, idle: 1, offline: 1 });
  
  // Real-time metrics state
  const [metrics, setMetrics] = useState({
    cpu: generateHistoricalData(45, 30, 20),
    memory: generateHistoricalData(60, 20, 20),
    tasks: { completed: 12, pending: 5, failed: 1, running: 2 },
    totalApiCalls: 1247,
  });
  
  // Live metrics
  const [liveMetrics, setLiveMetrics] = useState({ cpu: 45, memory: 62, calls: 1247 });
  const [activities, setActivities] = useState(initialActivities);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update live metrics with small variations
      setLiveMetrics((prev) => ({
        cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() - 0.5) * 20)),
        memory: Math.max(30, Math.min(90, prev.memory + (Math.random() - 0.5) * 10)),
        calls: prev.calls + Math.floor(Math.random() * 5),
      }));

      // Update historical data
      setMetrics((prev) => ({
        ...prev,
        cpu: [...prev.cpu.slice(1), liveMetrics.cpu],
        memory: [...prev.memory.slice(1), liveMetrics.memory],
        totalApiCalls: liveMetrics.calls,
      }));

      // Randomly add new activity occasionally
      if (Math.random() > 0.7) {
        const agentsList = ['Hermes Alpha', 'Hermes Beta', 'Hermes Gamma'];
        const actionTypes = [
          { action: 'processing request', level: 'info' as const },
          { action: 'API call completed', level: 'info' as const },
          { action: 'memory usage high', level: 'warn' as const },
          { action: 'task completed', level: 'info' as const },
        ];
        const agent = agentsList[Math.floor(Math.random() * agentsList.length)];
        const selected = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        
        const newActivity: ActivityItem = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          agent,
          action: selected.action,
          level: selected.level,
        };
        setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Header */}
      <header className="p-6 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Hermes Agent Office</h1>
            <p className="text-gray-400 mt-1">Pixel-style AI Agent Monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">Live</span>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Online" value={stats.online} color="#4ade80" />
          <StatCard label="Busy" value={stats.busy} color="#f59e0b" />
          <StatCard label="Idle" value={stats.idle} color="#06b6d4" />
          <StatCard label="Offline" value={stats.offline} color="#6b7280" />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* CPU & Memory Charts */}
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold mb-4">System Metrics</h3>
            <PixelChart 
              data={metrics.cpu} 
              color="#4ade80" 
              height={50} 
              label="CPU Usage %" 
              maxValue={100}
            />
            <div className="mt-2" />
            <PixelChart 
              data={metrics.memory} 
              color="#06b6d4" 
              height={50} 
              label="Memory Usage %"
              maxValue={100}
            />
          </div>

          {/* Task Distribution */}
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold mb-4">Task Distribution</h3>
            <div className="flex justify-center">
              <DonutChart
                data={[
                  { label: 'Completed', value: metrics.tasks.completed, color: '#4ade80' },
                  { label: 'Pending', value: metrics.tasks.pending, color: '#f59e0b' },
                  { label: 'Running', value: metrics.tasks.running, color: '#06b6d4' },
                  { label: 'Failed', value: metrics.tasks.failed, color: '#ef4444' },
                ]}
                size={120}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#4ade80]" />
                <span>Completed ({metrics.tasks.completed})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#f59e0b]" />
                <span>Pending ({metrics.tasks.pending})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#06b6d4]" />
                <span>Running ({metrics.tasks.running})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#ef4444]" />
                <span>Failed ({metrics.tasks.failed})</span>
              </div>
            </div>
          </div>

          {/* Live Metrics */}
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold mb-4">Live Statistics</h3>
            <MetricsDisplay
              cpuUsage={Math.round(liveMetrics.cpu)}
              memoryUsage={Math.round(liveMetrics.memory)}
              apiCalls={liveMetrics.calls}
            />
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="text-sm text-gray-400">
                Total API Calls: <span className="text-[#ffd700]">{metrics.totalApiCalls}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Office Grid */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-[#4ade80] rounded-full animate-pulse" />
            Office Floor
          </h2>
          
          <div className="glass-card p-6">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <AgentAvatar
                    name={agent.name}
                    status={agent.status}
                    color={agent.color}
                    size={80}
                    showName={false}
                  />
                  <div className="mt-2 text-center">
                    <div className="font-medium text-sm">{agent.name}</div>
                    <div className={`text-xs mt-1 ${
                      agent.status === 'ONLINE' ? 'text-[#4ade80]' :
                      agent.status === 'BUSY' ? 'text-[#f59e0b]' :
                      agent.status === 'ERROR' ? 'text-[#ef4444]' :
                      agent.status === 'IDLE' ? 'text-[#06b6d4]' :
                      'text-gray-500'
                    }`}>
                      {agent.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Activity Feed */}
        <section>
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="glass-card p-4">
            <ActivityFeed activities={activities} />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass-card p-4">
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}