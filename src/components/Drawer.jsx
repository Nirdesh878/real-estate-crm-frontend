import { useEffect } from 'react'
import { X } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-dark-900/40 backdrop-blur-sm transition-opacity duration-300"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl transition-transform duration-500 ease-in-out transform flex flex-col border-l border-dark-200">
        <div className="flex items-center justify-between gap-3 border-b border-dark-100 px-6 py-5 bg-dark-50/50">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-heading font-semibold text-dark-900">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-dark-500 hover:bg-dark-200 hover:text-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {children}
        </div>
      </aside>
    </div>
  )
}
