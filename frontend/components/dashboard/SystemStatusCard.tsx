'use client';

import type { SystemState } from '../../../shared/types/hermes';

interface SystemStatusCardProps {
  systemState: SystemState | null;
  isConnected: boolean;
}

export function SystemStatusCard({ systemState, isConnected }: SystemStatusCardProps) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-200">系统状态</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-slate-400">{isConnected ? '已连接' : '断开'}</span>
        </div>
      </div>

      {systemState ? (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Hermes 版本</span>
            <span className="text-slate-200">{systemState.hermesVersion || 'unknown'}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-400">模型提供商</span>
            <span className="text-slate-200">{systemState.model?.provider || 'unknown'}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-400">当前模型</span>
            <span className="text-slate-200 truncate max-w-[150px]">{systemState.model?.modelName || 'unknown'}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-400">认证状态</span>
            <span className={systemState.authStatus === 'authenticated' ? 'text-green-400' : 'text-yellow-400'}>
              {systemState.authStatus === 'authenticated' ? '已认证' : systemState.authStatus}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-500 mb-2">组件状态</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(systemState.components || {}).map(([name, status]) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 capitalize">{name}</span>
                  <span className={status ? 'text-green-400' : 'text-slate-600'}>
                    {status ? '●' : '○'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500 text-center py-4">加载中...</div>
      )}
    </div>
  );
}
