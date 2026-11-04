import { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 1. O estado inicial: Verifica se já tem algo no localStorage, caso contrário, define como "light"
    const [theme, setTheme] = useState(() => {
        const salvo = localStorage.getItem('nexus-theme');
        return salvo ? salvo : 'light';
    });


    // 2. O useEffect: Sempre que o tema mudar, atualiza o HTML e o localStorage
    useEffect(() => {
        /**
         *  Setando a classe no elemento root do HTML para que o Tailwind possa aplicar os estilos corretos
         *  Se o tema for "dark", adiciona a classe "dark", caso contrário, remove a classe "dark"
         */
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        // Salvando o tema no localStorage para que ele persista entre as sessões
        localStorage.setItem('nexus-theme', theme);
    }, [theme]);

    // 3. Função para alternar entre os temas
    function toggleTheme() {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    }

    //4. O Provedor de contexto: entrega o tema e a função para alternar o tema no restante da aplicação
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
    
}
    // 5. Hook personalizado para consumir o contexto de tema
    export function useTheme() {
        return useContext(ThemeContext);;
    };
