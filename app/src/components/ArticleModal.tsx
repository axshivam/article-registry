import { useEffect, useRef, useState } from 'react'
import type { Article } from '../hooks/useArticleRegistry'

interface ArticleModalProps {
  mode: 'create' | 'edit'
  article?: Article | null
  isOpen: boolean
  txPending: boolean
  onClose: () => void
  onCreate: (title: string, description: string, content: string, references: string[]) => Promise<void>
  onUpdate: (title: string, description: string, content: string, references: string[]) => Promise<void>
}

export function ArticleModal({
  mode,
  article,
  isOpen,
  txPending,
  onClose,
  onCreate,
  onUpdate,
}: ArticleModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [refsText, setRefsText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) return
    if (mode === 'edit' && article) {
      setTitle(article.account.title)
      setDescription(article.account.description)
      setContent(article.account.content)
      setRefsText(article.account.references.join('\n'))
      setTimeout(() => descRef.current?.focus(), 60)
    } else {
      setTitle('')
      setDescription('')
      setContent('')
      setRefsText('')
      setTimeout(() => titleRef.current?.focus(), 60)
    }
  }, [isOpen, mode, article])

  const parseReferences = (): string[] =>
    refsText
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0)
      .slice(0, 5)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const refs = parseReferences()
    try {
      if (mode === 'create') {
        await onCreate(title.trim(), description.trim(), content.trim(), refs)
      } else {
        await onUpdate(title.trim(), description.trim(), content.trim(), refs)
      }
      onClose()
    } catch {
      // Error already handled in hook via toast
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !txPending && !submitting) onClose()
  }

  const isPending = txPending || submitting
  const isCreate = mode === 'create'
  const refCount = parseReferences().length

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92dvh] flex flex-col animate-slide-up">
        {/* Drag indicator (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:pt-6 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isCreate ? 'bg-violet-500/20' : 'bg-amber-500/20'
              }`}
            >
              {isCreate ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isCreate ? '#a78bfa' : '#fbbf24'} strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              )}
            </div>
            <h2 className="text-white font-semibold text-base">
              {isCreate ? 'New Article' : 'Edit Article'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 disabled:opacity-30 transition-all text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {/* Title field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 text-sm font-medium">
                Title <span className="text-red-400">*</span>
              </label>
              <span className={`text-xs ${title.length > 44 ? 'text-amber-400' : 'text-slate-500'}`}>
                {title.length}/50
              </span>
            </div>
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={mode === 'edit'}
              placeholder="Enter a concise article title…"
              maxLength={50}
              required
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600/70 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            {mode === 'edit' && (
              <p className="text-slate-500 text-xs mt-1">Title is immutable — it's part of the on-chain PDA seed.</p>
            )}
          </div>

          {/* Description field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 text-sm font-medium">
                Abstract / Summary <span className="text-red-400">*</span>
              </label>
              <span className={`text-xs ${description.length > 1900 ? 'text-amber-400' : 'text-slate-500'}`}>
                {description.length}/2000
              </span>
            </div>
            <textarea
              ref={descRef}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A brief summary of the article…"
              maxLength={2000}
              required
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600/70 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 resize-none transition-all"
            />
          </div>

          {/* Content field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 text-sm font-medium">
                Content <span className="text-red-400">*</span>
              </label>
              <span className={`text-xs ${content.length > 4700 ? 'text-amber-400' : 'text-slate-500'}`}>
                {content.length}/5000
              </span>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Full article body / content…"
              maxLength={5000}
              required
              rows={7}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600/70 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 resize-none transition-all"
            />
          </div>

          {/* References field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 text-sm font-medium">References</label>
              <span className={`text-xs ${refCount >= 5 ? 'text-amber-400' : 'text-slate-500'}`}>
                {refCount}/5
              </span>
            </div>
            <textarea
              value={refsText}
              onChange={e => setRefsText(e.target.value)}
              placeholder={"One reference per line (URL or citation)…\nhttps://example.com/paper\nhttps://solana.com/docs"}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600/70 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 resize-none transition-all"
            />
            <p className="text-slate-500 text-xs mt-1">Up to 5 references, each max 200 characters.</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600/70 text-slate-300 hover:bg-white/5 hover:border-slate-500 disabled:opacity-40 transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim() || !description.trim() || !content.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing…
                </>
              ) : isCreate ? (
                'Publish Article'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
