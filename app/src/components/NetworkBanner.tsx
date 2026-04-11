import { useState } from 'react'
import { cluster, CLUSTER_META, PHANTOM_NETWORK_STEPS, endpoint } from '../config'
import type { RpcStatus } from '../hooks/useNetworkStatus'

interface NetworkBannerProps {
  rpcStatus: RpcStatus
}

export function NetworkBanner({ rpcStatus }: NetworkBannerProps) {
  const [showSteps, setShowSteps] = useState(false)
  const meta = CLUSTER_META[cluster]
  const phantomSteps = PHANTOM_NETWORK_STEPS[cluster]

  // Only show the actionable banner for non-mainnet clusters, or if RPC is down
  const showRpcError = rpcStatus === 'error'
  const showSetupNote = cluster !== 'mainnet-beta'

  if (!showRpcError && !showSetupNote) return null

  return (
    <>
      {/* ── RPC-down error banner ─────────────────────────────────────────── */}
      {showRpcError && (
        <div className="border-b border-red-500/30 bg-red-950/60 backdrop-blur-sm px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-2.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
            <span className="text-red-300 font-medium">
              Cannot reach the {meta.label} RPC node.
            </span>
          </div>
        </div>
      )}

      {/* ── Network + wallet setup note ───────────────────────────────────── */}
      {showSetupNote && (
        <div className={`border-b ${meta.borderColor} ${meta.color} backdrop-blur-sm px-4 py-2`}>
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {/* Cluster pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${meta.borderColor} ${meta.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${rpcStatus === 'ok' ? 'bg-emerald-400' : rpcStatus === 'error' ? 'bg-red-400' : 'bg-slate-500'} ${rpcStatus === 'ok' ? 'shadow-[0_0_4px_#34d399]' : ''}`} />
              <span className={`font-semibold ${meta.textColor}`}>{meta.label}</span>
              <span className="text-slate-500 font-mono hidden sm:inline truncate max-w-[180px]">{endpoint}</span>
            </div>

            <span className="text-slate-400">
              Make sure your Phantom wallet is also set to{' '}
              <strong className={meta.textColor}>{meta.label}</strong>.
            </span>

            <button
              onClick={() => setShowSteps(s => !s)}
              className={`underline underline-offset-2 ${meta.textColor} hover:opacity-80 transition-opacity font-medium`}
            >
              {showSteps ? 'Hide steps ↑' : 'How to configure Phantom ↓'}
            </button>
          </div>

          {/* Expandable step-by-step instructions */}
          {showSteps && (
            <div className="max-w-7xl mx-auto mt-3 mb-1">
              <div className={`rounded-xl border ${meta.borderColor} bg-slate-900/70 p-4`}>
                <p className={`text-xs font-semibold mb-3 ${meta.textColor} uppercase tracking-wide`}>
                  {phantomSteps.title}
                </p>
                <ol className="flex flex-col gap-2">
                  {phantomSteps.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-slate-300">
                      <span className={`shrink-0 w-5 h-5 rounded-full border ${meta.borderColor} ${meta.color} flex items-center justify-center text-[10px] font-bold ${meta.textColor}`}>
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>

                {/* Solflare note */}
                <p className="text-slate-500 text-xs mt-4 pt-3 border-t border-slate-700/50">
                  <strong className="text-slate-400">Using Solflare?</strong> Go to Settings → Network and select{' '}
                  {meta.label}.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
