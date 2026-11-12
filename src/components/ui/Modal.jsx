import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, children, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">

        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          {/* Correção: Forçando a cor escura no Light Mode */}
          <h2 className="text-xl font-bold !text-slate-900 dark:!text-white">
            {title}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}