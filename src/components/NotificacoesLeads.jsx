import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase-config';
import { useAuth } from '@/hooks/useAuth';
import { Bell, UserPlus, CheckCheck, MessageSquare } from 'lucide-react';
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

export default function NotificacoesLeads() {
  const { dadosUsuario } = useAuth();
  const navigate = useNavigate();

  const [notificacoes, setNotificacoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const dropdownRef = useRef(null);
  const primeiraCargaRef = useRef(true);

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

  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;

    primeiraCargaRef.current = true;
    const q = query(
      collection(db, 'contatos'),
      where('empresaId', '==', dadosUsuario.empresaId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (primeiraCargaRef.current) {
          const iniciais = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const tA = a.dataCriacao?.seconds || 0;
              const tB = b.dataCriacao?.seconds || 0;
              return tB - tA;
            })
            .slice(0, 5)
            .map((c) => ({
              id: c.id,
              nome: c.nome || 'Novo Lead',
              telefone: c.telefone || '',
              interesse: (c.observacoes || '').replace(/^Interesse via WhatsApp:\s*/i, ''),
              hora: c.dataCriacao?.toDate
                ? c.dataCriacao.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '',
              lida: true,
            }));

          setNotificacoes(iniciais);
          primeiraCargaRef.current = false;
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

            const interesseLimpo = (lead.observacoes || '').replace(/^Interesse via WhatsApp:\s*/i, '');

            const novaNotif = {
              id: lead.id,
              nome: lead.nome || 'Novo Lead',
              telefone: lead.telefone || '',
              interesse: interesseLimpo,
              hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              lida: false,
            };

            setNotificacoes((prev) => [novaNotif, ...prev.slice(0, 14)]);
            tocarSomNotificacao();

            toast.custom(
              (t) => (
                <div
                  onClick={() => {
                    toast.dismiss(t.id);
                    marcarComoLida(lead.id);
                    navigate('/app/contatos?tipo=leads');
                  }}
                  className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-sm w-full bg-white dark:bg-[#0b192c] shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-emerald-500/40 border border-emerald-200 dark:border-emerald-500/30 cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-slate-800/80 transition-all p-3.5 gap-3`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <UserPlus size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Novo Lead Recebido!
                      </p>
                      <span className="text-[11px] text-slate-400">{novaNotif.hora}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {novaNotif.nome}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {novaNotif.interesse || novaNotif.telefone || 'Clique para ver detalhes'}
                    </p>
                  </div>
                </div>
              ),
              { duration: 6000, position: 'top-right' }
            );
          }
        });
      },
      (error) => {
        console.error('Erro no listener de notificações de leads:', error);
      }
    );

    return () => unsubscribe();
  }, [dadosUsuario?.empresaId, navigate]);

  function marcarComoLida(id) {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  }

  function marcarTodasComoLidas() {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        title="Notificações de novos leads"
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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0b192c] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Notificações
              </span>
              {naoLidas > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
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
                <CheckCheck size={14} /> Marcar lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {notificacoes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Nenhuma notificação de lead ainda.
              </div>
            ) : (
              notificacoes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    marcarComoLida(item.id);
                    setAberto(false);
                    navigate('/app/contatos?tipo=leads');
                  }}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!item.lida ? 'bg-emerald-50/40 dark:bg-emerald-500/10' : ''
                    }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.nome}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {item.hora}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                      {item.interesse || item.telefone || 'Novo contato cadastrado'}
                    </p>
                  </div>
                  {!item.lida && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}