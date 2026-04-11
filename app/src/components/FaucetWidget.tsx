import { cluster, isTestNet, CLUSTER_META, FAUCET_URL } from '../config'

interface FaucetWidgetProps {
  balance: number | null
}

export function FaucetWidget({ balance }: FaucetWidgetProps) {
  if (!isTestNet) return null

  const meta = CLUSTER_META[cluster]
  const faucetUrl = FAUCET_URL[cluster]

  return (
    <div className={`flex items-center gap-2 pl-3 pr-1 py-1 rounded-xl border ${meta.borderColor} ${meta.color}`}>
      {/* Balance display */}
      <div className="flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={meta.textColor}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        {balance !== null ? (
          <span className={`text-xs font-medium ${meta.textColor}`}>
            {balance.toFixed(2)} SOL
          </span>
        ) : (
          <span className="text-xs text-slate-500">— SOL</span>
        )}
      </div>

      {/* External faucet link (devnet/testnet) */}
      {faucetUrl && (
        <a
          href={faucetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border ${meta.borderColor} ${meta.textColor} hover:bg-white/5 transition-all text-xs font-medium`}
          title={`Get free ${meta.label} SOL from the official faucet`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Get SOL →
        </a>
      )}
    </div>
  )
}
