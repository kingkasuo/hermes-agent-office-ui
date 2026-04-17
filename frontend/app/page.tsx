'use client';

import Link from 'next/link';
import { useI18n } from '@/components/providers/ThemeProvider';
import { Settings } from '@/components/ui/Settings';

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--pixel-bg)' }}>
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2 glow-text" style={{ color: 'var(--foreground)' }}>
            {t('app.title')}
          </h1>
          <p style={{ color: 'var(--pixel-text-secondary)' }}>{t('app.subtitle')}</p>
        </div>
        <Settings />
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats Cards */}
        <Link href="/dashboard" className="glass-card p-6 hover:scale-105 transition-all cursor-pointer">
          <div className="text-3xl font-bold" style={{ color: 'var(--pixel-online)' }}>4</div>
          <div className="text-sm mt-1" style={{ color: 'var(--pixel-text-secondary)' }}>{t('stats.online')} Agents</div>
        </Link>

        <Link href="/dashboard" className="glass-card p-6 hover:scale-105 transition-all cursor-pointer">
          <div className="text-3xl font-bold" style={{ color: 'var(--pixel-busy)' }}>12</div>
          <div className="text-sm mt-1" style={{ color: 'var(--pixel-text-secondary)' }}>{t('stats.busy')} Tasks</div>
        </Link>

        <Link href="/dashboard" className="glass-card p-6 hover:scale-105 transition-all cursor-pointer">
          <div className="text-3xl font-bold" style={{ color: 'var(--pixel-accent)' }}>98%</div>
          <div className="text-sm mt-1" style={{ color: 'var(--pixel-text-secondary)' }}>Success Rate</div>
        </Link>

        <Link href="/dashboard" className="glass-card p-6 hover:scale-105 transition-all cursor-pointer">
          <div className="text-3xl font-bold" style={{ color: 'var(--pixel-secondary)' }}>24ms</div>
          <div className="text-sm mt-1" style={{ color: 'var(--pixel-text-secondary)' }}>Avg Response</div>
        </Link>
      </main>

      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          {t('dashboard.officeFloor')}
        </h2>
        <Link href="/dashboard" className="glass-card p-6 block hover:scale-[1.02] transition-all">
          <div className="flex items-center justify-center gap-4 py-8">
            <div className="text-4xl">🏢</div>
            <div style={{ color: 'var(--pixel-text-secondary)' }}>
              <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>→</span>
              <span className="ml-2">{t('app.subtitle')} →</span>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}