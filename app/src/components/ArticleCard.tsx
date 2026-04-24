import { useState } from 'react'
import type { Article } from '../hooks/useArticleRegistry'
import { getExplorerUrl } from '../config'

interface ArticleCardProps {
  article: Article
  onEdit: (article: Article) => void
  onDelete: (article: Article) => void
}

function formatDate(unixTs: number): string {
  // Anchor returns i64 as a BN-like object; coerce to number safely
  const ms = Number(unixTs) * 1000
  if (!ms || isNaN(ms)) return '—'
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(ms),
  )
}

export function ArticleCard({ article, onEdit, onDelete }: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { title, description, content, references, publishedDate } = article.account

  const PREVIEW = 220
  const isLong = content.length > PREVIEW
  const displayContent = !expanded && isLong ? content.slice(0, PREVIEW) + '…' : content

  return (
    <article className="group relative flex flex-col bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:border-violet-500/40 hover:bg-slate-900/90 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Title + published date */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-white font-semibold text-base leading-snug">{title}</h3>
        <span className="shrink-0 text-slate-500 text-xs mt-0.5">{formatDate(publishedDate)}</span>
      </div>

      {/* Abstract / description */}
      <p className="text-slate-400 text-xs leading-relaxed mb-3 italic">{description}</p>

      {/* Content */}
      <div className="flex-1">
        <p className="text-slate-300 text-sm leading-relaxed">{displayContent}</p>
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-violet-400 hover:text-violet-300 text-xs mt-1.5 transition-colors"
          >
            {expanded ? '↑ Show less' : '↓ Show more'}
          </button>
        )}
      </div>

      {/* References */}
      {references.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          <p className="text-slate-500 text-xs font-medium mb-1.5">References</p>
          <ul className="space-y-1">
            {references.map((ref, i) => (
              <li key={i} className="text-xs">
                {ref.startsWith('http') ? (
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 truncate block transition-colors"
                  >
                    {ref}
                  </a>
                ) : (
                  <span className="text-slate-400">{ref}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-700/40">
        {/* PDA address badge */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] shadow-sm shadow-emerald-400/50" />
          <a
            href={getExplorerUrl('address', article.publicKey.toBase58())}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-emerald-400 text-xs font-mono tracking-tight transition-colors"
            title={article.publicKey.toBase58()}
          >
            {article.publicKey.toBase58().slice(0, 6)}…{article.publicKey.toBase58().slice(-4)}
          </a>
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
