import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, children, title, icon, footer }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

      {/* Modal com altura de 90% da tela no desktop */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] md:h-[85vh]">

        {/* Cabeçalho Fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-blue-600 dark:text-blue-400">{icon}</span>}
            <h2 className="text-lg font-bold !text-slate-900 dark:!text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo com Scroll (agora com flex-1 para ocupar o espaço disponível) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {/* Rodapé Fixo */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}