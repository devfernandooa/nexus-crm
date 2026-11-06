import clsx from "clsx";
import { useTheme } from "./ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    // Exemplo simples dentro do seu ThemeToggle.jsx
    <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}


export default ThemeToggle;