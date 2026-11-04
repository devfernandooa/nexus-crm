import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RotaProtegida from './components/RotaProtegida';

import { ThemeProvider } from './contexts/ThemeContext';
import { useTheme } from './contexts/ThemeContext';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Cadastro } from './pages/Cadastro';
import ThemeToggle from './contexts/ThemeToggle';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider >
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Rota Protegida (O Dashboard/CRM) */}
            <Route
              path="/app"
              element={
                <RotaProtegida>
                  <Dashboard />
                </RotaProtegida>
              }
            />
          </Routes>
          <ThemeToggle />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}