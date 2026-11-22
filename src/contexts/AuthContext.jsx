/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // <-- Importante: signOut
import { auth, db } from '@/firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import toast from 'react-hot-toast'; // <-- Importante: toast

export const AuthContext = createContext({});

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


  // Função de logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.error('Sua sessão expirou por inatividade. Faça login novamente.', { duration: 5000 });
    } catch (error) {
      console.error('Erro ao fazer logout por inatividade:', error);
    }
  };

  /* Hook de inatividade (30 minutos = 30 * 60 * 1000 ms)
  Só ativa o timer se o usuário estiver logado*/
  useInactivityLogout(handleLogout, 30 * 60 * 1000);
  //useInactivityLogout(handleLogout, 10 * 1000);



  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando sessão...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, dadosUsuario, dadosEmpresa }}>
      {children}
    </AuthContext.Provider>
  );
}

