import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function RotaAdmin({ children }) {
    const { dadosUsuario, loading } = useAuth();

    // Enquanto o AuthContext está carregando os dados, mostramos um loader
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // Se o usuário logado NÃO for admin, redireciona de volta para o Dashboard
    if (dadosUsuario?.role !== 'admin') {
        return <Navigate to="/app" replace />;
    }

    // Se for admin, renderiza a tela solicitada (Equipe ou Configurações)
    return children;
}