
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RotaProtegida({ children }) {
    const { user } = useAuth();

    if (!user) {
        // Redireciona para a Landing Page (Index)
        return <Navigate to="/" replace />;
    }

    return children;
}