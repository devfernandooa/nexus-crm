import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, children, title, icon, footer, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',   // Pequeno (Confirmações)
    md: 'max-w-2xl',  // Médio (Formulários simples)
    lg: 'max-w-5xl',  // Grande (Formulários complexos)
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} overflow-visible border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] my-auto`}
      >
        {/* Cabeçalho Fixo em Verde Claro */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                {icon}
              </span>
            )}
            <h2 className="text-lg font-bold !text-slate-900 dark:!text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/15 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo sem cortar dropdowns */}
        <div className="p-6 overflow-y-auto overflow-x-visible custom-scrollbar flex-1">
          {children}
        </div>

        {/* Rodapé Fixo */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl shrink-0 [&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:border [&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:border-emerald-300 dark:[&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:border-emerald-700/70 [&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:text-emerald-700 dark:[&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:text-emerald-300 [&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:bg-white dark:[&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:bg-transparent [&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:rounded-xl [&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:px-4 [&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:py-2 [&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:font-semibold hover:[&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:bg-emerald-50 dark:hover:[&_button:not([class*='bg-emerald']):not([class*='bg-red']):not([class*='bg-rose'])]:bg-emerald-500/10">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}