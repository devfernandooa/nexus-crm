import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext'; // Importa o contexto exportado

export function useAuth() {
    return useContext(AuthContext);
}