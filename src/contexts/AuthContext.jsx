import { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';
import { buscarDadosUsuario } from '@/services/usuarioService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [dadosEmpresa, setDadosEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Escuta o estado de autenticação
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        const dadosUser = await buscarDadosUsuario(usuario.uid);
        setUser(usuario);
        setDadosUsuario(dadosUser);
      } else {
        setUser(null);
        setDadosUsuario(null);
        setDadosEmpresa(null);
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Escuta os dados da empresa quando o usuário estiver carregado
  useEffect(() => {
    if (!dadosUsuario?.empresaId) {
      setDadosEmpresa(null);
      return;
    }

    const empresaRef = doc(db, 'empresas', dadosUsuario.empresaId);
    const unsubscribeEmpresa = onSnapshot(empresaRef, (snapshot) => {
      if (snapshot.exists()) {
        setDadosEmpresa({ id: snapshot.id, ...snapshot.data() });
      }
    });

    return () => unsubscribeEmpresa();
  }, [dadosUsuario?.empresaId]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando sessão...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, dadosUsuario, dadosEmpresa }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}