import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Hermes Agent Office Backend
        </h1>
        <p className="text-slate-400 mb-8">
          Backend API Server is running
        </p>
        <div className="space-x-4">
          <Link
            href="/api/health"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Health Check
          </Link>
          <Link
            href="/api/agents"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Agents API
          </Link>
        </div>
      </div>
    </main>
  )
}
