'use client';

import { useState, useEffect } from 'react';
import { AgentAvatar } from '@/components/pixel-office/AgentAvatar';
import { PixelChart, DonutChart, MetricsDisplay, ActivityFeed, ActivityItem } from '@/components/pixel-office/Charts';
import { useTheme, useI18n } from '@/components/providers/ThemeProvider';
import { Settings } from '@/components/ui/Settings';

// Activity item type
interface Activity {
  id: string;
  time: string;
  agent: string;
  action: string;
  level: 'info' | 'warn' | 'error' | 'idle';
}

// Demo agent data
type AgentStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'IDLE' | 'ERROR';

const demoAgents: Array<{id: string; name: string; status: AgentStatus; color: string; task: string}> = [
  { id: '1', name: 'Hermes Alpha', status: 'ONLINE', color: '#e94560', task: 'Researching' },
  { id: '2', name: 'Hermes Beta', status: 'BUSY', color: '#4ade80', task: 'Coding' },
  { id: '3', name: 'Hermes Gamma', status: 'IDLE', color: '#ffd700', task: 'Waiting' },
  { id: '4', name: 'Hermes Delta', status: 'OFFLINE', color: '#0f3460', task: 'Offline' },
  { id: '5', name: 'Hermes Epsilon', status: 'ERROR', color: '#ef4444', task: 'Error' },
];

// Generate fixed historical data for SSR consistency
function generateHistoricalData(base: number, variance: number, points: number): number[] {
  return Array.from({ length: points }, (_, i) => {
    const seed = (i * 17 + base * 7) % 100;
    return Math.max(0, Math.min(100, seed));
  });
}

// Initial activities
const initialActivities: ActivityItem[] = [
  { id: '1', time: '14:32', agent: 'Hermes Alpha', action: 'completed research task', level: 'info' },
  { id: '2', time: '14:28', agent: 'Hermes Beta', action: 'started code generation', level: 'info' },
  { id: '3', time: '14:15', agent: 'Hermes Gamma', action: 'is idle', level: 'idle' },
  { id: '4', time: '14:02', agent: 'Hermes Alpha', action: 'error: API rate limit', level: 'error' },
  { id: '5', time: '13:45', agent: 'Hermes Delta', action: 'went offline', level: 'idle' },
];

function DashboardContent() {
  const { t } = useI18n();
  const { theme } = useTheme();
  
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

  // Simulate real-time updates (client-only)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics((prev) => ({
        cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() - 0.5) * 20)),
        memory: Math.max(30, Math.min(90, prev.memory + (Math.random() - 0.5) * 10)),
        calls: prev.calls + Math.floor(Math.random() * 5),
      }));

      setMetrics((prev) => ({
        ...prev,
        cpu: [...prev.cpu.slice(1), Math.round(liveMetrics.cpu)],
        memory: [...prev.memory.slice(1), Math.round(liveMetrics.memory)],
        totalApiCalls: liveMetrics.calls,
      }));

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
  }, [liveMetrics.cpu, liveMetrics.memory, liveMetrics.calls]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--pixel-bg)' }}>
      {/* Header */}
      <header className="p-6 border-b" style={{ borderColor: 'var(--pixel-border)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{t('app.title')}</h1>
            <p className="mt-1" style={{ color: 'var(--pixel-text-secondary)' }}>{t('app.subtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <Settings />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--pixel-online)' }} />
              <span className="text-sm" style={{ color: 'var(--pixel-text-secondary)' }}>{t('app.live')}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t('stats.online')} value={stats.online} color="var(--pixel-online)" />
          <StatCard label={t('stats.busy')} value={stats.busy} color="var(--pixel-busy)" />
          <StatCard label={t('stats.idle')} value={stats.idle} color="var(--pixel-secondary)" />
          <StatCard label={t('stats.offline')} value={stats.offline} color="var(--pixel-offline)" />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* System Metrics */}
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              {t('dashboard.systemMetrics')}
            </h3>
            <PixelChart 
              data={metrics.cpu} 
              color="var(--pixel-online)" 
              height={50} 
              label={t('metrics.cpu')} 
              maxValue={100}
            />
            <div className="mt-2" />
            <PixelChart 
              data={metrics.memory} 
              color="var(--pixel-secondary)" 
              height={50} 
              label={t('metrics.memory')}
              maxValue={100}
            />
          </div>

          {/* Task Distribution */}
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              {t('dashboard.taskDistribution')}
            </h3>
            <div className="flex justify-center">
              <DonutChart
                data={[
                  { label: t('tasks.completed'), value: metrics.tasks.completed, color: 'var(--pixel-online)' },
                  { label: t('tasks.pending'), value: metrics.tasks.pending, color: 'var(--pixel-busy)' },
                  { label: t('tasks.running'), value: metrics.tasks.running, color: 'var(--pixel-secondary)' },
                  { label: t('tasks.failed'), value: metrics.tasks.failed, color: 'var(--pixel-error)' },
                ]}
                size={120}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--pixel-online)' }} />
                <span>{t('tasks.completed')} ({metrics.tasks.completed})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--pixel-busy)' }} />
                <span>{t('tasks.pending')} ({metrics.tasks.pending})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--pixel-secondary)' }} />
                <span>{t('tasks.running')} ({metrics.tasks.running})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--pixel-error)' }} />
                <span>{t('tasks.failed')} ({metrics.tasks.failed})</span>
              </div>
            </div>
          </div>

          {/* Live Statistics */}
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              {t('dashboard.liveStatistics')}
            </h3>
            <MetricsDisplay
              cpuUsage={Math.round(liveMetrics.cpu)}
              memoryUsage={Math.round(liveMetrics.memory)}
              apiCalls={liveMetrics.calls}
            />
            <div className="mt-4 pt-4" style={{ borderColor: 'var(--pixel-border)', borderTopWidth: 1 }}>
              <div className="text-sm" style={{ color: 'var(--pixel-text-secondary)' }}>
                {t('metrics.totalCalls')}: <span style={{ color: 'var(--pixel-accent)' }}>{metrics.totalApiCalls}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Office Grid */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <span className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--pixel-online)' }} />
            {t('dashboard.officeFloor')}
          </h2>
          
          <div className="glass-card p-6">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
              {demoAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: 'var(--pixel-card)',
                  }}
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
                      agent.status === 'ONLINE' ? 'status-online' :
                      agent.status === 'BUSY' ? 'status-busy' :
                      agent.status === 'ERROR' ? 'status-error' :
                      agent.status === 'IDLE' ? 'text-cyan-400' :
                      'status-offline'
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
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {t('dashboard.recentActivity')}
          </h2>
          <div className="glass-card p-4 max-h-64 overflow-y-auto">
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
      <div className="text-3xl font-bold glow-text" style={{ color }}>{value}</div>
      <div className="text-sm" style={{ color: 'var(--pixel-text-secondary)' }}>{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}