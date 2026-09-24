import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-slide-up ${
            t.type === 'error'
              ? 'bg-rose-950/90 border-rose-800/80 text-rose-100'
              : t.type === 'info'
              ? 'bg-zinc-900/90 border-zinc-700 text-zinc-100'
              : 'bg-[#12141c]/95 border-[#d4af37]/40 text-zinc-100'
          }`}
        >
          {t.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : t.type === 'info' ? (
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs leading-relaxed font-medium">
            {t.message}
          </div>

          <button
            onClick={() => dismissToast(t.id)}
            className="text-zinc-400 hover:text-white p-0.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
