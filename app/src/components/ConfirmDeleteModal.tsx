import { useState } from 'react'
import type { Article } from '../hooks/useArticleRegistry'

interface ConfirmDeleteModalProps {
  article: Article | null
  isOpen: boolean
  txPending: boolean
  onClose: () => void
  onConfirm: (title: string) => Promise<void>
}

export function ConfirmDeleteModal({
  article,
  isOpen,
  txPending,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    if (!article) return
    setDeleting(true)
    try {
      await onConfirm(article.account.title)
      onClose()
    } catch {
      // Error handled in hook via toast
    } finally {
      setDeleting(false)
    }
  }

  const isPending = txPending || deleting

  if (!isOpen || !article) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget && !isPending) onClose() }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm animate-slide-up">
        {/* Drag indicator (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        <div className="px-6 py-6 text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <h2 className="text-white font-semibold text-lg mb-1">Delete Article?</h2>
          <p className="text-slate-400 text-sm mb-1">You're about to permanently delete</p>
          <p className="text-white font-medium text-sm mb-3">
            "{article.account.title}"
          </p>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            The on-chain account will be closed and the rent SOL will be returned to your wallet.
            This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600/70 text-slate-300 hover:bg-white/5 disabled:opacity-40 transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
