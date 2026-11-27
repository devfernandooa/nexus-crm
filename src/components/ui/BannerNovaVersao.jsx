import { RefreshCw, Sparkles, X } from 'lucide-react';
import { useVersionCheck } from '@/hooks/useVersionCheck';

export default function BannerNovaVersao() {
    const { novaVersao, exibirAviso, dispensarAviso, aplicarAtualizacao } = useVersionCheck();

    if (!exibirAviso || !novaVersao) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100%-2rem)] rounded-2xl bg-white dark:bg-[#0b192c] border border-emerald-300 dark:border-emerald-700/70 shadow-xl p-4 text-left">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <Sparkles size={18} />
                    </span>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            Nova versão disponível (v{novaVersao.version})
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Clique em <strong>Atualizar agora</strong> para carregar as melhorias. Seus dados salvos não serão perdidos.
                        </p>
                    </div>
                </div>

                {!novaVersao.obrigatoria && (
                    <button
                        type="button"
                        onClick={dispensarAviso}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                        title="Lembrar depois"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {Array.isArray(novaVersao.destaques) && novaVersao.destaques.length > 0 && (
                <ul className="mt-3 space-y-1 rounded-xl bg-slate-50 dark:bg-slate-900/75 border border-slate-200/70 dark:border-slate-800 p-2.5 text-xs text-slate-600 dark:text-slate-300">
                    {novaVersao.destaques.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                    ))}
                </ul>
            )}

            <div className="mt-3 flex items-center justify-end gap-2">
                {!novaVersao.obrigatoria && (
                    <button
                        type="button"
                        onClick={dispensarAviso}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Depois
                    </button>
                )}
                <button
                    type="button"
                    onClick={aplicarAtualizacao}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                    <RefreshCw size={13} /> Atualizar agora
                </button>
            </div>
        </div>
    );
}