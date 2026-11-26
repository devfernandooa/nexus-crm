import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase-config';
import { useAuth } from '@/hooks/useAuth';
import { Bell, UserPlus, ShoppingBag, CheckCheck, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

function tocarSomNotificacao() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const agora = ctx.currentTime;

    const tocarNota = (frequencia, inicio, duracao) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequencia, inicio);

      gain.gain.setValueAtTime(0.001, inicio);
      gain.gain.exponentialRampToValueAtTime(0.18, inicio + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, inicio + duracao);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(inicio);
      osc.stop(inicio + duracao);
    };

    tocarNota(659.25, agora, 0.25);
    tocarNota(987.77, agora + 0.14, 0.35);
  } catch (err) {
    console.warn('Som bloqueado pelo navegador até primeira interação:', err);
  }
}

function extrairCanalEDetalhes(lead) {
  const obs = lead.observacoes || '';
  const origemBruta = String(lead.origem || '').toLowerCase();

  let canal = 'CRM';
  if (origemBruta === 'telegram' || /^Telegram\b/i.test(obs)) {
    canal = 'Telegram';
  } else if (origemBruta === 'whatsapp' || /WhatsApp/i.test(obs)) {
    canal = 'WhatsApp';
  }

  const detalhesLimpos = obs
    .replace(/^Interesse via WhatsApp:\s*/i, '')
    .replace(/^Telegram\s*\([^)]+\):\s*/i, '')
    .replace(/^Telegram\s*—\s*/i, '')
    .trim();

  return { canal, detalhesLimpos };
}

export default function NotificacoesLeads() {
  const { dadosUsuario } = useAuth();
  const navigate = useNavigate();

  const [notificacoes, setNotificacoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const dropdownRef = useRef(null);
  const primeiraCargaLeadsRef = useRef(true);
  const primeiraCargaComprasRef = useRef(true);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  useEffect(() => {
    function handleClickFora(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  // Listener 1: Novos Leads em contatos
  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;

    primeiraCargaLeadsRef.current = true;
    const q = query(
      collection(db, 'contatos'),
      where('empresaId', '==', dadosUsuario.empresaId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (primeiraCargaLeadsRef.current) {
          const iniciais = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.dataCriacao?.seconds || 0) - (a.dataCriacao?.seconds || 0))
            .slice(0, 5)
            .map((c) => {
              const { canal, detalhesLimpos } = extrairCanalEDetalhes(c);
              const ehCliente = String(c.tipo || '').toLowerCase() === 'cliente';
              return {
                id: `lead-${c.id}`,
                docId: c.id,
                categoria: ehCliente ? 'cliente' : 'lead',
                nome: c.nome || 'Novo Contato',
                telefone: c.telefone || '',
                canal,
                interesse: detalhesLimpos,
                timestamp: c.dataCriacao?.seconds || 0,
                hora: c.dataCriacao?.toDate
                  ? c.dataCriacao.toDate().toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '',
                lida: true,
              };
            });

          setNotificacoes((prev) =>
            [...iniciais, ...prev]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 15)
          );
          primeiraCargaLeadsRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const lead = { id: change.doc.id, ...change.doc.data() };
            const ehLead =
              !lead.tipo ||
              String(lead.tipo).toLowerCase() === 'lead' ||
              String(lead.status || '').toLowerCase() === 'lead';

            if (!ehLead) return;

            const { canal, detalhesLimpos } = extrairCanalEDetalhes(lead);
            const novaNotif = {
              id: `lead-${lead.id}`,
              docId: lead.id,
              categoria: 'lead',
              nome: lead.nome || 'Novo Lead',
              telefone: lead.telefone || '',
              canal,
              interesse: detalhesLimpos,
              timestamp: Math.floor(Date.now() / 1000),
              hora: new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              lida: false,
            };

            setNotificacoes((prev) => [novaNotif, ...prev.slice(0, 14)]);
            tocarSomNotificacao();
            dispararToast(novaNotif);
          }
        });
      },
      (error) => console.error('Erro no listener de leads:', error)
    );

    return () => unsubscribe();
  }, [dadosUsuario?.empresaId]);

  // Listener 2: Solicitações de compra de Clientes já cadastrados
  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;

    primeiraCargaComprasRef.current = true;
    const qCompras = query(
      collection(db, 'solicitacoes_compra'),
      where('empresaId', '==', dadosUsuario.empresaId)
    );

    const unsubscribe = onSnapshot(
      qCompras,
      (snapshot) => {
        if (primeiraCargaComprasRef.current) {
          const comprasIniciais = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
            .slice(0, 5)
            .map((item) => ({
              id: `compra-${item.id}`,
              docId: item.id,
              colecao: 'solicitacoes_compra',
              categoria: 'recompra',
              nome: item.clienteNome || 'Cliente',
              telefone: item.telefone || '',
              canal: item.canal === 'telegram' ? 'Telegram' : 'WhatsApp',
              interesse: `Deseja adquirir: ${item.produto || item.mensagemOriginal}`,
              timestamp: item.criadoEm?.seconds || 0,
              hora: item.criadoEm?.toDate
                ? item.criadoEm.toDate().toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '',
              lida: Boolean(item.lida),
            }));

          setNotificacoes((prev) =>
            [...comprasIniciais, ...prev]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 15)
          );
          primeiraCargaComprasRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const item = { id: change.doc.id, ...change.doc.data() };
            const novaCompra = {
              id: `compra-${item.id}`,
              docId: item.id,
              colecao: 'solicitacoes_compra',
              categoria: 'recompra',
              nome: item.clienteNome || 'Cliente',
              telefone: item.telefone || '',
              canal: item.canal === 'telegram' ? 'Telegram' : 'WhatsApp',
              interesse: `Deseja adquirir: ${item.produto || item.mensagemOriginal}`,
              timestamp: Math.floor(Date.now() / 1000),
              hora: new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              lida: false,
            };

            setNotificacoes((prev) => [novaCompra, ...prev.slice(0, 14)]);
            tocarSomNotificacao();
            dispararToast(novaCompra);
          }
        });
      },
      (error) => console.error('Erro no listener de solicitações de compra:', error)
    );

    return () => unsubscribe();
  }, [dadosUsuario?.empresaId]);

  function dispararToast(notif) {
    const ehRecompra = notif.categoria === 'recompra';

    toast.custom(
      (t) => (
        <div
          onClick={() => {
            toast.dismiss(t.id);
            marcarComoLida(notif);
            navigate(ehRecompra ? '/app/contatos?tipo=clientes' : '/app/contatos?tipo=leads');
          }}
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white dark:bg-[#0b192c] shadow-2xl rounded-xl pointer-events-auto flex ring-1 ${
            ehRecompra
              ? 'ring-amber-500/60 border border-amber-300 dark:border-amber-500/40'
              : 'ring-emerald-500/50 border border-emerald-200 dark:border-emerald-500/40'
          } cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/90 transition-all p-4 gap-3.5`}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              ehRecompra
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
            }`}
          >
            {ehRecompra ? <ShoppingBag size={22} /> : <UserPlus size={22} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    ehRecompra
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {ehRecompra ? 'Cliente Quer Comprar!' : 'Novo Lead!'}
                </p>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    notif.canal === 'Telegram'
                      ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                  }`}
                >
                  {notif.canal}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">{notif.hora}</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
              {notif.nome}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
              {notif.interesse || notif.telefone || 'Clique para ver detalhes'}
            </p>
          </div>
        </div>
      ),
      { duration: 8000, position: 'top-right' }
    );
  }

  async function marcarComoLida(notif) {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, lida: true } : n))
    );
    if (notif.colecao === 'solicitacoes_compra' && notif.docId) {
      try {
        await updateDoc(doc(db, 'solicitacoes_compra', notif.docId), { lida: true });
      } catch (e) {
        console.warn('Não foi possível marcar solicitação como lida:', e);
      }
    }
  }

  function marcarTodasComoLidas() {
    notificacoes.forEach((n) => {
      if (!n.lida && n.colecao === 'solicitacoes_compra' && n.docId) {
        updateDoc(doc(db, 'solicitacoes_compra', n.docId), { lida: true }).catch(() => {});
      }
    });
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        title="Notificações de leads e pedidos"
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="fixed inset-x-3 top-16 md:absolute md:inset-auto md:left-0 md:top-full md:mt-2 md:w-[400px] bg-white dark:bg-[#0b192c] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl ring-1 ring-black/5 z-[70] overflow-hidden">
          <div className="px-4 py-3.5 bg-slate-50/80 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Notificações
              </span>
              {naoLidas > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                  {naoLidas} nova{naoLidas > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {naoLidas > 0 && (
              <button
                type="button"
                onClick={marcarTodasComoLidas}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck size={15} /> Marcar lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notificacoes.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma notificação ainda.
              </div>
            ) : (
              notificacoes.map((item) => {
                const ehRecompra = item.categoria === 'recompra';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      marcarComoLida(item);
                      setAberto(false);
                      navigate(
                        ehRecompra
                          ? '/app/contatos?tipo=clientes'
                          : '/app/contatos?tipo=leads'
                      );
                    }}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors ${
                      !item.lida
                        ? ehRecompra
                          ? 'bg-amber-50/70 dark:bg-amber-500/15'
                          : 'bg-emerald-50/70 dark:bg-emerald-500/15'
                        : ''
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        ehRecompra
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          : item.canal === 'Telegram'
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      }`}
                    >
                      {ehRecompra ? (
                        <ShoppingBag size={16} />
                      ) : item.canal === 'Telegram' ? (
                        <Send size={16} />
                      ) : (
                        <MessageSquare size={16} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.nome}
                          </p>
                          {ehRecompra && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 shrink-0">
                              Cliente
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                              item.canal === 'Telegram'
                                ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                                : item.canal === 'WhatsApp'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {item.canal}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-400 shrink-0">
                          {item.hora}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                        {item.interesse || item.telefone || 'Novo contato cadastrado'}
                      </p>
                    </div>

                    {!item.lida && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 mt-2 ${
                          ehRecompra ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}