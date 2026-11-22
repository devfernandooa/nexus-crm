/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import toast from 'react-hot-toast';

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
        setLoading(false); // Libera a tela se não houver usuário (tela de login)
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Escuta o documento do usuário em tempo real (COM TRATAMENTO DE ERRO)
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'usuarios', user.uid);

    // Adicionamos um pequeno delay para garantir que o Firebase atualizou o token
    const timeoutId = setTimeout(() => {
      const unsubscribeUser = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setDadosUsuario({ id: snapshot.id, ...snapshot.data() });
          } else {
            console.warn("Documento do usuário não encontrado no Firestore.");
            setDadosUsuario(null);
          }
          setLoading(false);
        },
        (error) => {
          // Se der erro (ex: permission-denied), não travamos a tela
          console.error("Erro ao buscar usuário:", error.message);
          setLoading(false);
        }
      );
      return unsubscribeUser;
    }, 500); // 500ms de delay para sincronização de token

    return () => clearTimeout(timeoutId);
  }, [user]);

  // 3. Escuta o documento da empresa em tempo real
  useEffect(() => {
    if (!dadosUsuario?.empresaId) return;

    const empresaRef = doc(db, 'empresas', dadosUsuario.empresaId);
    const unsubscribeEmpresa = onSnapshot(
      empresaRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setDadosEmpresa({ id: snapshot.id, ...snapshot.data() });
        }
      },
      (error) => {
        console.error("Erro ao buscar empresa:", error.message);
      }
    );

    return () => unsubscribeEmpresa();
  }, [dadosUsuario?.empresaId]);

  // Função de logout
  const handleLogout = async (isInatividade = false) => {
    try {
      await signOut(auth);
      if (isInatividade) {
        toast.error('Sua sessão expirou por inatividade. Faça login novamente.', { duration: 5000 });
      } else {
        toast.success('Você saiu da conta.');
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  useInactivityLogout(() => handleLogout(true), 30 * 60 * 1000);

  // Se o AuthContext estiver carregando, mostra a tela de carregamento
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando sessão...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, dadosUsuario, dadosEmpresa, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}