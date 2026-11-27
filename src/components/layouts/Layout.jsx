import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Clock, ShieldAlert } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase-config';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import BannerNovaVersao from '@/components/ui/BannerNovaVersao';

const TEMPO_INATIVIDADE_MS = 30 * 60 * 1000; // 30 minutos (para teste rápido use ex: 15 * 1000)
const AVISO_RESTANTE_MS = 60 * 1000;         // Último 1 minuto (para teste rápido use ex: 8 * 1000)

export default function Layout() {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mostrarAvisoSessao, setMostrarAvisoSessao] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(60);

  const ultimaAtividadeRef = useRef(Date.now());
  const expirouRef = useRef(false);
  const avisoAbertoRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    avisoAbertoRef.current = mostrarAvisoSessao;
  }, [mostrarAvisoSessao]);

  const encerrarPorInatividade = useCallback(async () => {
    if (expirouRef.current) return;
    expirouRef.current = true;
    avisoAbertoRef.current = false;
    setMostrarAvisoSessao(false);

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao encerrar sessão por inatividade:', error);
    } finally {
      toast.error('Sua sessão foi encerrada por inatividade.');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const renovarSessao = useCallback(() => {
    ultimaAtividadeRef.current = Date.now();
    expirouRef.current = false;
    avisoAbertoRef.current = false;
    setMostrarAvisoSessao(false);
    setSegundosRestantes(Math.ceil(AVISO_RESTANTE_MS / 1000));
  }, []);

  useEffect(() => {
    expirouRef.current = false;
    ultimaAtividadeRef.current = Date.now();
    let ultimoReset = Date.now();

    const registrarAtividade = () => {
      // Enquanto o modal de aviso estiver visível, exige clicar em "Continuar sessão"
      if (avisoAbertoRef.current || expirouRef.current) return;

      const agora = Date.now();
      if (agora - ultimoReset < 1000) return;

      ultimoReset = agora;
      ultimaAtividadeRef.current = agora;
    };

    const eventos = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    eventos.forEach((ev) => window.addEventListener(ev, registrarAtividade, { passive: true }));

    const intervalo = setInterval(() => {
      if (expirouRef.current) return;

      const inativoMs = Date.now() - ultimaAtividadeRef.current;
      const restanteMs = TEMPO_INATIVIDADE_MS - inativoMs;

      if (restanteMs <= 0) {
        clearInterval(intervalo);
        encerrarPorInatividade();
        return;
      }

      if (restanteMs <= AVISO_RESTANTE_MS) {
        avisoAbertoRef.current = true;
        setMostrarAvisoSessao(true);
        setSegundosRestantes(Math.max(1, Math.ceil(restanteMs / 1000)));
      } else if (avisoAbertoRef.current) {
        avisoAbertoRef.current = false;
        setMostrarAvisoSessao(false);
      }
    }, 500);

    return () => {
      eventos.forEach((ev) => window.removeEventListener(ev, registrarAtividade));
      clearInterval(intervalo);
    };
  }, [encerrarPorInatividade]);

  return (

    <div className="flex w-full h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-200 overflow-hidden">

      {/* Overlay escuro para mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out shrink-0`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Header apenas no Mobile (Desktop fica limpo) */}
        <header className="grid grid-cols-[40px_1fr_40px] items-center px-4 h-16 shrink-0 bg-white dark:bg-[#0b192c] border-b border-slate-200/90 dark:border-slate-800 md:hidden">
          <div aria-hidden="true" className="w-10 h-10" />

          <div className="flex items-center justify-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center text-white dark:text-slate-950 font-extrabold text-lg shadow-2xs shrink-0">
              N
            </div>
            <span className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Nexus <span className="text-emerald-600 dark:text-emerald-400">Hub</span>
            </span>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Área de Conteúdo */}
        <main className="flex-1 min-h-0 w-full overflow-y-auto md:overflow-hidden flex flex-col">
          <Outlet />
        </main>

        {/* Banner de notificação de nova versão (aparece em qualquer rota para Admin e Vendedor) */}
        <BannerNovaVersao />

        {/* Rodapé Mobile-First */}
        <footer className="py-2 shrink-0 text-center text-[11px] text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800 md:hidden bg-white dark:bg-[#0b192c]">
          Nexus Hub v1.0 • Pro
        </footer>
      </div>

      {/* Modal de Aviso (exibido quando faltar o tempo de aviso por inatividade) */}
      {mostrarAvisoSessao && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50">
              <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <ShieldAlert size={18} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Sessão prestes a expirar
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Detectamos inatividade no sistema
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Por segurança, sua sessão será encerrada em{' '}
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  <Clock size={14} /> {segundosRestantes}s
                </span>{' '}
                caso não haja interação.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={encerrarPorInatividade}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/70 bg-white dark:bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  Sair agora
                </button>
                <button
                  type="button"
                  onClick={renovarSessao}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors"
                >
                  Continuar sessão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}