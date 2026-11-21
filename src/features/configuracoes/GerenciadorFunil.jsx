import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buscarConfiguracoesEmpresa, atualizarFunilVendas } from '@/services/empresaService';
import toast from 'react-hot-toast';
import { GripVertical, Plus, Trash2, Save } from 'lucide-react';

export default function GerenciadorFunil() {
    const { dadosUsuario } = useAuth();
    const [etapas, setEtapas] = useState([]);
    const [novaEtapa, setNovaEtapa] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(true);

    // Carrega as etapas atuais ao montar
    useEffect(() => {
        if (!dadosUsuario?.empresaId) return;

        const carregar = async () => {
            const res = await buscarConfiguracoesEmpresa(dadosUsuario.empresaId);
            if (res.sucesso && res.dados.etapasFunil) {
                setEtapas(res.dados.etapasFunil);
            } else {
                // Valor padrão inicial se não houver configuração
                setEtapas(['Prospecção', 'Qualificação', 'Proposta']);
            }
            setCarregando(false);
        };
        carregar();
    }, [dadosUsuario?.empresaId]);

    const adicionarEtapa = () => {
        if (!novaEtapa.trim()) return;
        if (etapas.includes(novaEtapa)) {
            toast.error('Esta etapa já existe!');
            return;
        }
        setEtapas([...etapas, novaEtapa.trim()]);
        setNovaEtapa('');
    };

    const removerEtapa = (index) => {
        const novasEtapas = etapas.filter((_, i) => i !== index);
        setEtapas(novasEtapas);
    };

    const salvarFunil = async () => {
        if (etapas.length === 0) {
            toast.error('O funil precisa ter pelo menos uma etapa!');
            return;
        }
        setSalvando(true);
        const res = await atualizarFunilVendas(dadosUsuario.empresaId, etapas);
        if (res.sucesso) {
            toast.success('Funil de vendas atualizado com sucesso!');
        } else {
            toast.error('Erro ao salvar: ' + res.erro);
        }
        setSalvando(false);
    };

    if (carregando) return <p className="text-slate-500">Carregando configurações...</p>;

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Etapas do Funil</h3>
            <p className="text-sm text-slate-500 mb-6">Defina as etapas do seu processo de vendas. A ordem aqui define a ordem no Kanban.</p>

            {/* Lista de Etapas Atuais */}
            <div className="space-y-2 mb-6">
                {etapas.map((etapa, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <GripVertical size={16} className="text-slate-400 cursor-grab" />
                        <span className="flex-1 font-medium text-slate-700 dark:text-slate-200">{etapa}</span>
                        <button
                            onClick={() => removerEtapa(index)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remover etapa"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Adicionar Nova Etapa */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={novaEtapa}
                    onChange={(e) => setNovaEtapa(e.target.value)}
                    placeholder="Nome da nova etapa..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && adicionarEtapa()}
                />
                <button
                    onClick={adicionarEtapa}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> Adicionar
                </button>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={salvarFunil}
                    disabled={salvando}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar Funil'}
                </button>
            </div>
        </div>
    );
}