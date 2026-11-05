import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, dadosUsuario } = useAuth();

  if (!dadosUsuario) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Carregando dados da empresa...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Bem-vindo ao Dashboard
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Visão geral da sua conta no Nexus.
      </p>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card de E-mail */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Usuário Logado</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white truncate">
            {user?.email}
          </p>
        </div>

        {/* Card de Empresa */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ID da Empresa (Tenant)</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white truncate">
            {dadosUsuario?.empresaId}
          </p>
        </div>

        {/* Card de Cargo */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Seu Cargo (Role)</p>
          <p className="mt-2 text-lg font-semibold text-orange-500 uppercase">
            {dadosUsuario?.role}
          </p>
        </div>
      </div>
    </div>
  );
}