import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [dadosEmpresa, setDadosEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Escuta o estado de autenticação
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (usuario) => {
      setUser(usuario);
      if (!usuario) {
        setDadosUsuario(null);
        setDadosEmpresa(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Escuta o documento do usuário em tempo real
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'usuarios', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setDadosUsuario({ id: snapshot.id, ...snapshot.data() });
      } else {
        setDadosUsuario(null);
      }
      setLoading(false);
    });

    return () => unsubscribeUser();
  }, [user]);

  // 3. Escuta o documento da empresa em tempo real
  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;


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

