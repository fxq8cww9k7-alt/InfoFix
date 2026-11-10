import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import NuevaOrdenPage from './pages/NuevaOrdenPage';
import DetalleOrdenPage from './pages/DetalleOrdenPage';
import PublicStatusPage from './pages/PublicStatusPage';
import PublicVerifyPage from './pages/PublicVerifyPage';
import ImprimiblePage from './pages/ImprimiblePage';

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
