import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { use } from 'react';

export default function RotaProtegida({ children }) {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/landing" replace />
    }

    return children;
}