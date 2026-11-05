import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext'; // Se você tiver o ThemeProvider
import RotaProtegida from './components/RotaProtegida';

// Importe todas as páginas
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard'; // <-- Importe o Dashboard

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Rota Protegida (Dashboard) */}
            <Route 
              path="/app" 
              element={
                <RotaProtegida>
                  <Dashboard />
                </RotaProtegida>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}