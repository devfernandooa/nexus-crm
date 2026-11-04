import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../firebase-config.js'

const AuthContext =  createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() =>{
        // Aqui o firebase avisa se o usuário logou ou deslogou
        const unsubscribe = onAuthStateChanged(auth, (usuario) => {
            setUser(usuario);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if(loading) {
        return <div>Carregando sessão...</div>
    }

    return (
        <AuthContext.Provider value={{user}}>
            {children}
        </AuthContext.Provider>
    );

}

// Hook personalizado para usar em outras telas
export function useAuth() {
    return useContext(AuthContext);
}

