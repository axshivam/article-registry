import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { FaucetWidget } from './FaucetWidget'

interface HeaderProps {
  onRefresh: () => void
  articleCount: number
  loading: boolean
  onGuide: () => void
  // faucet props (forwarded from useNetworkStatus)
  balance: number | null
}

export function Header({ onRefresh, articleCount, loading, onGuide, balance }: HeaderProps) {
  const { publicKey } = useWallet()

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-[#14F195] flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">Solana Articles</h1>
              <p className="text-slate-500 text-xs mt-0.5">On-chain ARTICLE REGISTRY dApp</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Getting started guide button — always visible */}
            <button
              onClick={onGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all text-xs font-medium"
              title="Getting started guide"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="hidden sm:inline">Guide</span>
            </button>

            {/* Faucet widget — visible when wallet connected + test network */}
            {publicKey && (
              <div className="hidden sm:block">
                <FaucetWidget balance={balance} />
              </div>
            )}

            {/* Refresh button */}
            {publicKey && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 disabled:opacity-40 transition-all text-xs font-medium"
                title="Refresh articles"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={loading ? 'animate-spin' : ''}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {loading ? 'Syncing…' : `${articleCount} article${articleCount !== 1 ? 's' : ''}`}
              </button>
            )}
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>
  )
}

