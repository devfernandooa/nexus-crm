import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import RotaProtegida from './components/RotaProtegida';
import Layout from './components/layouts/Layout'; // <-- O nome mudou aqui!

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import Contatos from './pages/Contatos';
import Negocios from './pages/Negocios';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            <Route 
              path="/app" 
              element={
                <RotaProtegida>
                  <Layout /> {/* <-- E o nome mudou aqui também! */}
                </RotaProtegida>
              } 
            >
              <Route index element={<Dashboard />} /> {/* O Dashboard.jsx que você já tem */}
              <Route path="contatos" element={<Contatos />} />
              <Route path="negocios" element={<Negocios />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}