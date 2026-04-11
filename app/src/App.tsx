import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ToastProvider } from './context/ToastContext'
import { useArticleRegistry } from './hooks/useArticleRegistry'
import { useNetworkStatus } from './hooks/useNetworkStatus'
import { Header } from './components/Header'
import { NetworkBanner } from './components/NetworkBanner'
import { ArticleCard } from './components/ArticleCard'
import { ArticleModal } from './components/ArticleModal'
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal'
import { OnboardingGuide } from './components/OnboardingGuide'
import { FaucetWidget } from './components/FaucetWidget'
import { Toasts } from './components/Toast'
import type { Article } from './hooks/useArticleRegistry'

function ArticleApp() {
  const { publicKey } = useWallet()
  const { articles, loading, txPending, createArticle, updateArticle, deleteArticle, fetchArticles } =
    useArticleRegistry()
  const { rpcStatus, balance } = useNetworkStatus()

  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Article | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null)
  const [showGuide, setShowGuide] = useState(false)

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#14F195]/5 blur-3xl" />
      </div>

      <Header
          onRefresh={fetchArticles}
          articleCount={articles.length}
          loading={loading}
          onGuide={() => setShowGuide(true)}
          balance={balance}
        />
        <NetworkBanner rpcStatus={rpcStatus} />

        {/* Mobile-only faucet bar (hidden on ≥sm where it lives in the header) */}
        {publicKey && (
          <div className="sm:hidden flex justify-center py-2 px-4 border-b border-slate-800/60">
            <FaucetWidget balance={balance} />
          </div>
        )}

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* ── Not connected ── */}
        {!publicKey ? (
          <div className="flex flex-col items-center justify-center min-h-[78vh] text-center pt-8">
            {/* Hero icon */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-violet-500/15 blur-3xl rounded-full scale-150" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-600 to-[#14F195] flex items-center justify-center shadow-2xl shadow-violet-500/30">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Your Articles,{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-[#14F195] bg-clip-text text-transparent">
                On-Chain
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md mb-10 leading-relaxed">
              Create, update, and delete articles stored permanently on the Solana blockchain. Connect
              your wallet to get started.
            </p>

            <WalletMultiButton />

            {/* Feature grid */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full">
              {[
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  ),
                  label: 'Create',
                  desc: 'Publish articles on-chain',
                  color: 'border-violet-500/20 bg-violet-500/5',
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  ),
                  label: 'Update',
                  desc: 'Edit content anytime',
                  color: 'border-amber-500/20 bg-amber-500/5',
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  ),
                  label: 'Delete',
                  desc: 'Reclaim your SOL rent',
                  color: 'border-red-500/20 bg-red-500/5',
                },
              ].map(f => (
                <div
                  key={f.label}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border ${f.color}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                    {f.icon}
                  </div>
                  <span className="text-white font-semibold text-sm">{f.label}</span>
                  <span className="text-slate-500 text-xs text-center">{f.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── Connected: articles view ── */
          <div className="pt-8">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-2xl font-bold text-white">My Articles</h2>
                {!loading && (
                  <p className="text-slate-500 text-sm mt-0.5">
                    {articles.length === 0
                      ? 'No articles yet'
                      : `${articles.length} article${articles.length !== 1 ? 's' : ''} on the Solana blockchain`}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Article
              </button>
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div
                    key={n}
                    className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 animate-pulse"
                  >
                    <div className="h-4 bg-slate-700/80 rounded-lg w-3/5 mb-4" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-800 rounded w-full" />
                      <div className="h-3 bg-slate-800 rounded w-11/12" />
                      <div className="h-3 bg-slate-800 rounded w-4/6" />
                    </div>
                    <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-700/30">
                      <div className="h-3 bg-slate-800 rounded w-20" />
                      <div className="flex gap-2">
                        <div className="h-6 bg-slate-800 rounded-lg w-12" />
                        <div className="h-6 bg-slate-800 rounded-lg w-14" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && articles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">No articles yet</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
                  Your on-chain articles will appear here. Write your first one now!
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/60 transition-all text-sm font-medium"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Write your first article
                </button>
              </div>
            )}

            {/* Article grid */}
            {!loading && articles.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map(article => (
                  <ArticleCard
                    key={article.publicKey.toBase58()}
                    article={article}
                    onEdit={a => setEditTarget(a)}
                    onDelete={a => setDeleteTarget(a)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <ArticleModal
        mode="create"
        isOpen={showCreate}
        txPending={txPending}
        onClose={() => setShowCreate(false)}
        onCreate={createArticle}
        onUpdate={updateArticle}
      />

      <ArticleModal
        mode="edit"
        article={editTarget}
        isOpen={!!editTarget}
        txPending={txPending}
        onClose={() => setEditTarget(null)}
        onCreate={createArticle}
        onUpdate={updateArticle}
      />

      <ConfirmDeleteModal
        article={deleteTarget}
        isOpen={!!deleteTarget}
        txPending={txPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteArticle}
      />

      <OnboardingGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <Toasts />
    </div>
  )
}

// Wrap at this level so useArticleRegistry (which uses useToast) has access to the provider
export default function App() {
  return (
    <ToastProvider>
      <ArticleApp />
    </ToastProvider>
  )
}
