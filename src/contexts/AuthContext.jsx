import { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase-config';
import { buscarDadosUsuario } from '../services/usuarioService'; // Importa o serviço


const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dadosUsuario, setDadosUsuario] = useState(null); // Novo estado global
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      console.log('1. Usuário logado no Auth:', usuario);
      setUser(usuario);

      if (usuario) {
        console.log('2.Buscandoo dados do usuário no Firestore para o UID:', usuario.uid);
        // Se logou, busca os dados da empresa e role
        const dados = await buscarDadosUsuario(usuario.uid);
        console.log('3. Dados do usuário encontrados:', dados);
        setDadosUsuario(dados);
      } else {
        // Se deslogou, limpa os dados
        setDadosUsuario(null);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando sessão...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, dadosUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}