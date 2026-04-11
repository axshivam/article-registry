import { useToast } from '../context/ToastContext'
import type { Toast } from '../context/ToastContext'

const STYLES: Record<Toast['type'], string> = {
  success: 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100',
  error: 'bg-red-950/95 border-red-500/40 text-red-100',
  info: 'bg-violet-950/95 border-violet-500/40 text-violet-100',
}

const ICONS: Record<Toast['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'i',
}

const ICON_COLORS: Record<Toast['type'], string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-violet-400',
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast()

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-2xl shadow-2xl
        animate-slide-up ${STYLES[toast.type]} max-w-sm w-full`}
    >
      <span className={`text-base font-bold mt-0.5 w-4 shrink-0 text-center ${ICON_COLORS[toast.type]}`}>
        {ICONS[toast.type]}
      </span>
      <p className="flex-1 text-sm leading-relaxed break-words">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 ml-1 text-lg leading-none opacity-50 hover:opacity-100 transition-opacity mt-0.5"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export function Toasts() {
  const { toasts } = useToast()
  if (!toasts.length) return null

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[60] flex flex-col gap-2.5 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
