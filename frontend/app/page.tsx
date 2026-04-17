'use client';

import Link from 'next/link';
import { useI18n } from '@/components/providers/ThemeProvider';
import { Settings } from '@/components/ui/Settings';

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--linear-bg)' }}>
      {/* Linear-style Header */}
      <header className="border-b" style={{ 
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
            <Settings />
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="linear-card p-8" style={{ 
            background: 'linear-gradient(135deg, var(--linear-elevated), var(--linear-surface))',
            borderColor: 'var(--linear-border-standard)'
          }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl mb-2" style={{ color: 'var(--linear-text-primary)' }}>
                  AI Agent Monitoring Platform
                </h2>
                <p className="text-sm mb-4" style={{ color: 'var(--linear-text-secondary)' }}>
                  Real-time agent status, task distribution, and system metrics
                </p>
                <div className="flex gap-3">
                  <Link href="/dashboard" className="linear-btn-primary">
                    Open Dashboard →
                  </Link>
                  <a href="#" className="linear-btn">
                    Documentation
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-8">
                {/* Mini stats */}
                <div className="text-center">
                  <div className="text-2xl font-semibold" style={{ color: 'var(--linear-brand-light)' }}>4</div>
                  <div className="text-xs" style={{ color: 'var(--linear-text-tertiary)' }}>Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold" style={{ color: 'var(--linear-success)' }}>12</div>
                  <div className="text-xs" style={{ color: 'var(--linear-text-tertiary)' }}>Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold" style={{ color: 'var(--linear-text-primary)' }}>98%</div>
                  <div className="text-xs" style={{ color: 'var(--linear-text-tertiary)' }}>Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="mb-8">
          <h3 className="text-sm font-medium mb-4" style={{ 
            color: 'var(--linear-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard" className="linear-card p-5 hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="status-dot status-online"></span>
                <span className="text-sm font-medium" style={{ color: 'var(--linear-text-primary)' }}>
                  {t('stats.online')}
                </span>
              </div>
              <div className="text-3xl font-semibold" style={{ color: 'var(--linear-success)' }}>4</div>
              <div className="text-xs mt-1" style={{ color: 'var(--linear-text-tertiary)' }}>Active agents</div>
            </Link>

            <Link href="/dashboard" className="linear-card p-5 hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="status-dot status-busy"></span>
                <span className="text-sm font-medium" style={{ color: 'var(--linear-text-primary)' }}>
                  {t('stats.busy')}
                </span>
              </div>
              <div className="text-3xl font-semibold" style={{ color: 'var(--linear-warning)' }}>12</div>
              <div className="text-xs mt-1" style={{ color: 'var(--linear-text-tertiary)' }}>Running tasks</div>
            </Link>

            <Link href="/dashboard" className="linear-card p-5 hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="status-dot status-idle"></span>
                <span className="text-sm font-medium" style={{ color: 'var(--linear-text-primary)' }}>
                  {t('stats.idle')}
                </span>
              </div>
              <div className="text-3xl font-semibold" style={{ color: 'var(--linear-text-tertiary)' }}>2</div>
              <div className="text-xs mt-1" style={{ color: 'var(--linear-text-tertiary)' }}>Waiting</div>
            </Link>

            <Link href="/dashboard" className="linear-card p-5 hover:translate-y-[-2px] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="status-dot status-error"></span>
                <span className="text-sm font-medium" style={{ color: 'var(--linear-text-primary)' }}>
                  Errors
                </span>
              </div>
              <div className="text-3xl font-semibold" style={{ color: 'var(--linear-error)' }}>1</div>
              <div className="text-xs mt-1" style={{ color: 'var(--linear-text-tertiary)' }}>Needs attention</div>
            </Link>
          </div>
        </section>

        {/* Office Floor Section */}
        <section>
          <h3 className="text-sm font-medium mb-4" style={{ 
            color: 'var(--linear-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {t('dashboard.officeFloor')}
          </h3>
          <Link href="/dashboard" className="linear-card p-6 block hover:translate-y-[-2px] transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--linear-elevated)' }}>
                  <span className="text-xl">🏢</span>
                </div>
                <div>
                  <div className="font-medium" style={{ color: 'var(--linear-text-primary)' }}>
                    {t('dashboard.officeFloor')}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--linear-text-tertiary)' }}>
                    View all agents and their current status
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="linear-badge linear-badge-success">
                  <span className="status-dot status-online w-2 h-2"></span>
                  4 online
                </span>
                <span style={{ color: 'var(--linear-text-tertiary)' }}>→</span>
              </div>
            </div>
          </Link>
        </section>

        {/* API Stats Footer */}
        <section className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--linear-border-subtle)' }}>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="mono text-xs" style={{ color: 'var(--linear-text-quaternary)' }}>API</span>
              <span style={{ color: 'var(--linear-text-secondary)' }}>1,247 calls today</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="mono text-xs" style={{ color: 'var(--linear-text-quaternary)' }}>Latency</span>
              <span style={{ color: 'var(--linear-text-secondary)' }}>24ms avg</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="status-dot status-online"></span>
              <span style={{ color: 'var(--linear-success)' }}>All systems operational</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}