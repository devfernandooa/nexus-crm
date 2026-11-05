import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, dadosUsuario } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
          Bem-vindo ao Dashboard!
        </h1>
        
        <div className="space-y-4 text-slate-700 dark:text-slate-300">
          <p>
            <strong>E-mail logado:</strong> {user?.email}
          </p>
          <p>
            <strong>ID da Empresa (Tenant):</strong> {dadosUsuario?.empresaId || 'Carregando...'}
          </p>
          <p>
            <strong>Seu Cargo (Role):</strong> {dadosUsuario?.role || 'Carregando...'}
          </p>
        </div>
      </div>
    </div>
  );
}

