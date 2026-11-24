/**
 * @file App.jsx
 * @description Enrutador principal del frontend InfoFIX (rutas públicas QR y panel privado del taller).
 * @task T14 (RF-01, RF-12, RF-13)
 * @author Yahúm Adair Hernández Martínez
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import OrdenesPage from './pages/OrdenesPage';
import NuevaOrdenPage from './pages/NuevaOrdenPage';
import DetalleOrdenPage from './pages/DetalleOrdenPage';
import ClientesPage from './pages/ClientesPage';
import DispositivosPage from './pages/DispositivosPage';
import CertificadosPage from './pages/CertificadosPage';
import PublicStatusPage from './pages/PublicStatusPage';
import PublicVerifyPage from './pages/PublicVerifyPage';
import ImprimiblePage from './pages/ImprimiblePage';

/**
 * Envuelve las rutas internas del taller bloqueando el acceso si no hay sesión JWT activa (RF-01).
 *
 * @param {Object} props Propiedades del componente.
 * @param {React.ReactNode} props.children Vista protegida a renderizar.
 * @returns {JSX.Element} Hijos autorizados o redirección a /login.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Redirige la ruta raíz según el estado de autenticación actual.
 *
 * @returns {JSX.Element|null} Redirección a /dashboard o /login.
 */
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas de Cliente (escaneo de QR) */}
          <Route path="/estatus/:token" element={<PublicStatusPage />} />
          <Route path="/verificar/:token" element={<PublicVerifyPage />} />

          {/* Autenticación de Personal del Taller */}
          <Route path="/login" element={<AuthPage />} />

          {/* Panel Privado del Taller */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ordenes"
            element={
              <ProtectedRoute>
                <OrdenesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ordenes/nueva"
            element={
              <ProtectedRoute>
                <NuevaOrdenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ordenes/:id"
            element={
              <ProtectedRoute>
                <DetalleOrdenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <ClientesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispositivos"
            element={
              <ProtectedRoute>
                <DispositivosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificados"
            element={
              <ProtectedRoute>
                <CertificadosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificados/:token"
            element={
              <ProtectedRoute>
                <ImprimiblePage />
              </ProtectedRoute>
            }
          />

          {/* Redirección Raíz */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}