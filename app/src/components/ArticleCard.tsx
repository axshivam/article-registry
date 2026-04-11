import { useState } from 'react'
import type { Article } from '../hooks/useCrudApp'

interface ArticleCardProps {
  article: Article
  onEdit: (article: Article) => void
  onDelete: (article: Article) => void
}

export function ArticleCard({ article, onEdit, onDelete }: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { title, description } = article.account
  const isLong = description.length > 220
  const displayText = !expanded && isLong ? description.slice(0, 220) + '…' : description

  return (
    <article className="group relative flex flex-col bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:border-violet-500/40 hover:bg-slate-900/90 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Title */}
      <h3 className="text-white font-semibold text-base leading-snug mb-2.5 pr-2">{title}</h3>

      {/* Description */}
      <div className="flex-1">
        <p className="text-slate-400 text-sm leading-relaxed">{displayText}</p>
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-violet-400 hover:text-violet-300 text-xs mt-1.5 transition-colors"
          >
            {expanded ? '↑ Show less' : '↓ Show more'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-700/40">
        {/* PDA address badge */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] shadow-sm shadow-emerald-400/50" />
          <span className="text-slate-500 text-xs font-mono tracking-tight">
            {article.publicKey.toBase58().slice(0, 6)}…{article.publicKey.toBase58().slice(-4)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(article)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-violet-400 border border-violet-500/25 hover:bg-violet-500/12 hover:border-violet-500/50 transition-all text-xs font-medium"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => onDelete(article)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-400 border border-red-500/25 hover:bg-red-500/12 hover:border-red-500/50 transition-all text-xs font-medium"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}
