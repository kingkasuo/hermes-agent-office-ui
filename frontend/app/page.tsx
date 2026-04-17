import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Hermes Agent Office
        </h1>
        <p className="text-gray-400">Pixel-style AI Agent Monitoring Dashboard</p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats Cards */}
        <Link href="/agents" className="glass-card p-6 hover:border-[#e94560] transition-colors cursor-pointer">
          <div className="text-[#4ade80] text-3xl font-bold">4</div>
          <div className="text-gray-400 text-sm mt-1">Online Agents</div>
        </Link>

        <Link href="/tasks" className="glass-card p-6 hover:border-[#f59e0b] transition-colors cursor-pointer">
          <div className="text-[#f59e0b] text-3xl font-bold">12</div>
          <div className="text-gray-400 text-sm mt-1">Active Tasks</div>
        </Link>

        <Link href="/logs" className="glass-card p-6 hover:border-[#0f3460] transition-colors cursor-pointer">
          <div className="text-[#ffd700] text-3xl font-bold">98%</div>
          <div className="text-gray-400 text-sm mt-1">Success Rate</div>
        </Link>

        <Link href="/analytics" className="glass-card p-6 hover:border-[#8b5cf6] transition-colors cursor-pointer">
          <div className="text-[#06b6d4] text-3xl font-bold">24ms</div>
          <div className="text-gray-400 text-sm mt-1">Avg Response</div>
        </Link>
      </main>

      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Office Overview</h2>
        <div className="glass-card p-6">
          <p className="text-gray-400">Pixel office visualization coming soon...</p>
        </div>
      </section>
    </div>
  );
}