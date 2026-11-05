import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { escutarContatos } from '../services/contatoService';

export default function Contatos() {
  const { dadosUsuario } = useAuth();
  const [contatos, setContatos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se ainda não carregou os dados da empresa, espera.
    if (!dadosUsuario?.empresaId) return;

    // Escuta os contatos apenas da empresa atual
    const unsubscribe = escutarContatos(dadosUsuario.empresaId, (lista) => {
      setContatos(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dadosUsuario]);

  if (loading) {
    return <div className="text-slate-500">Carregando contatos...</div>;
  }

  return (
    <div className="w-full">
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Contatos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie os leads e clientes da sua empresa.</p>
        </div>
        
        {/* Botão de Adicionar (Vamos implementar depois) */}
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + Novo Contato
        </button>
      </div>

      {/* Tabela de Contatos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Nome</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">E-mail</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Telefone</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {contatos.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  Nenhum contato cadastrado ainda.
                </td>
              </tr>
            ) : (
              contatos.map((contato) => (
                <tr key={contato.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">{contato.nome}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{contato.email}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{contato.telefone}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
                      {contato.status || 'Novo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}