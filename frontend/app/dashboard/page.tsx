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
  { id: '1', name: 'Hermes Alpha', status: 'ONLINE', color: '#27a644', task: 'Researching' },
  { id: '2', name: 'Hermes Beta', status: 'BUSY', color: '#f59e0b', task: 'Coding' },
  { id: '3', name: 'Hermes Gamma', status: 'IDLE', color: '#8a8f98', task: 'Waiting' },
  { id: '4', name: 'Hermes Delta', status: 'OFFLINE', color: '#62666d', task: 'Offline' },
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--linear-bg)' }}>
      {/* Linear Header */}
      <header className="border-b sticky top-0 z-50" style={{ 
        borderColor: 'var(--linear-border-subtle)',
        backgroundColor: 'var(--linear-surface)'
      }}>
        <div className="container flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            {/* Logo Mark */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--linear-brand), var(--linear-brand-light))' }}>
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <div>
              <h1 className="text-lg font-medium" style={{ color: 'var(--linear-text-primary)' }}>
                {t('app.title')}
              </h1>
              <p className="text-xs" style={{ color: 'var(--linear-text-tertiary)' }}>
                {t('app.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md"
              style={{ backgroundColor: 'var(--linear-button-bg)', border: '1px solid var(--linear-border-standard)' }}>
              <span className="status-dot status-online animate-pulse-soft"></span>
              <span className="text-xs font-medium" style={{ color: 'var(--linear-text-secondary)' }}>
                {t('app.live')}
              </span>
            </div>
            <Settings />
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Stats Grid - Linear style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard 
            label={t('stats.online')} 
            value={stats.online} 
            color="var(--linear-success)" 
            icon={<span className="status-dot status-online"></span>}
          />
          <StatCard 
            label={t('stats.busy')} 
            value={stats.busy} 
            color="var(--linear-warning)" 
            icon={<span className="status-dot status-busy"></span>}
          />
          <StatCard 
            label={t('stats.idle')} 
            value={stats.idle} 
            color="var(--linear-text-tertiary)" 
            icon={<span className="status-dot status-idle"></span>}
          />
          <StatCard 
            label={t('stats.offline')} 
            value={stats.offline} 
            color="var(--linear-text-quaternary)" 
            icon={<span className="status-dot status-offline"></span>}
          />
        </div>

        {/* Charts Row - Linear grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* System Metrics */}
          <div className="linear-card p-5">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--linear-text-primary)' }}>
              {t('dashboard.systemMetrics')}
            </h3>
            <div className="space-y-4">
              <PixelChart 
                data={metrics.cpu} 
                color="var(--linear-brand-light)" 
                height={40} 
                label={t('metrics.cpu')} 
                maxValue={100}
              />
              <PixelChart 
                data={metrics.memory} 
                color="var(--linear-text-tertiary)" 
                height={40} 
                label={t('metrics.memory')}
                maxValue={100}
              />
            </div>
          </div>

          {/* Task Distribution */}
          <div className="linear-card p-5">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--linear-text-primary)' }}>
              {t('dashboard.taskDistribution')}
            </h3>
            <div className="flex justify-center mb-4">
              <DonutChart
                data={[
                  { label: t('tasks.completed'), value: metrics.tasks.completed, color: 'var(--linear-success)' },
                  { label: t('tasks.pending'), value: metrics.tasks.pending, color: 'var(--linear-warning)' },
                  { label: t('tasks.running'), value: metrics.tasks.running, color: 'var(--linear-text-tertiary)' },
                  { label: t('tasks.failed'), value: metrics.tasks.failed, color: 'var(--linear-error)' },
                ]}
                size={100}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded" style={{ backgroundColor: 'var(--linear-success)' }} />
                <span style={{ color: 'var(--linear-text-secondary)' }}>{t('tasks.completed')} ({metrics.tasks.completed})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded" style={{ backgroundColor: 'var(--linear-warning)' }} />
                <span style={{ color: 'var(--linear-text-secondary)' }}>{t('tasks.pending')} ({metrics.tasks.pending})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded" style={{ backgroundColor: 'var(--linear-text-tertiary)' }} />
                <span style={{ color: 'var(--linear-text-secondary)' }}>{t('tasks.running')} ({metrics.tasks.running})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded" style={{ backgroundColor: 'var(--linear-error)' }} />
                <span style={{ color: 'var(--linear-text-secondary)' }}>{t('tasks.failed')} ({metrics.tasks.failed})</span>
              </div>
            </div>
          </div>

          {/* Live Statistics */}
          <div className="linear-card p-5">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--linear-text-primary)' }}>
              {t('dashboard.liveStatistics')}
            </h3>
            <MetricsDisplay
              cpuUsage={Math.round(liveMetrics.cpu)}
              memoryUsage={Math.round(liveMetrics.memory)}
              apiCalls={liveMetrics.calls}
            />
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--linear-border-subtle)' }}>
              <div className="text-xs" style={{ color: 'var(--linear-text-tertiary)' }}>
                <span className="mono">{t('metrics.totalCalls')}: </span>
                <span style={{ color: 'var(--linear-brand-light)' }}>{metrics.totalApiCalls.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Office Grid - Agent Cards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium flex items-center gap-2" style={{ 
              color: 'var(--linear-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <span className="status-dot status-online animate-pulse-soft"></span>
              {t('dashboard.officeFloor')}
            </h2>
            <span className="text-xs" style={{ color: 'var(--linear-text-quaternary)' }}>5 agents</span>
          </div>
          
          <div className="linear-card p-5">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {demoAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all hover:bg-[var(--linear-hover)]"
                  style={{ 
                    backgroundColor: agent.status === 'ONLINE' ? 'rgba(39, 166, 68, 0.05)' : 'transparent',
                  }}
                >
                  <AgentAvatar
                    name={agent.name}
                    status={agent.status}
                    color={agent.color}
                    size={64}
                    showName={false}
                  />
                  <div className="mt-3 text-center w-full">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--linear-text-primary)' }}>
                      {agent.name.replace('Hermes ', '')}
                    </div>
                    <div className={`text-xs mt-1 flex items-center justify-center gap-1.5 ${
                      agent.status === 'ONLINE' ? 'status-online' :
                      agent.status === 'BUSY' ? 'status-busy' :
                      agent.status === 'ERROR' ? 'status-error' :
                      agent.status === 'IDLE' ? 'text-[var(--linear-text-tertiary)]' :
                      'status-offline'
                    }`}>
                      <span className={`status-dot ${
                        agent.status === 'ONLINE' ? 'status-online' :
                        agent.status === 'BUSY' ? 'status-busy' :
                        agent.status === 'ERROR' ? 'status-error' :
                        agent.status === 'IDLE' ? 'status-idle' :
                        'status-offline'
                      }`}></span>
                      {agent.status}
                    </div>
                    <div className="text-xs mt-1 truncate" style={{ color: 'var(--linear-text-quaternary)' }}>
                      {agent.task}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Activity Feed */}
        <section>
          <h2 className="text-sm font-medium mb-4" style={{ 
            color: 'var(--linear-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {t('dashboard.recentActivity')}
          </h2>
          <div className="linear-card p-4 max-h-64 overflow-y-auto">
            <ActivityFeed activities={activities} />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="linear-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--linear-text-secondary)' }}>{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}