import { useEffect } from 'react'

export default function Drawer({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="h-[calc(100%-65px)] overflow-y-auto p-5">
          {children}
        </div>
      </aside>
    </div>
  )
}

