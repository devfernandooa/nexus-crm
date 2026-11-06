import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, children, title }) {
  // Se não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  return (
    // Fundo escuro (overlay) que cobre a tela toda
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Caixa do Modal */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header do Modal (Título e botão de fechar) */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo do Modal (O formulário vai aqui dentro) */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}