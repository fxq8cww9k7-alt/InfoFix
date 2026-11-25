import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import OrdenesPage from './pages/OrdenesPage';
import NuevaOrdenPage from './pages/NuevaOrdenPage';
import DetalleOrdenPage from './pages/DetalleOrdenPage';
import ClientesPage from './pages/ClientesPage';
import DispositivosPage from './pages/DispositivosPage';
import CertificadosPage from './pages/CertificadosPage';
import NotificacionesPage from './pages/NotificacionesPage';
import PublicStatusPage from './pages/PublicStatusPage';
import PublicVerifyPage from './pages/PublicVerifyPage';
import ImprimiblePage from './pages/ImprimiblePage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center text-slate-500 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#24529F]/20 border-t-[#24529F] rounded-full animate-spin" />
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

/**
 * Modal global de sesión expirada (P1 Variante: aviso de sesión expirada).
 * Se muestra sobre la vista actual sin perder el contexto hasta que el usuario reinicie sesión.
 */
function SesionExpiradaModal() {
  const { sesionExpirada, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const esRutaPublica =
    location.pathname.startsWith('/estatus') ||
    location.pathname.startsWith('/verificar') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/restablecer');

  if (!sesionExpirada || esRutaPublica) return null;

  const handleReiniciar = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#060F1F]/55 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-8 text-center text-[#0B0D12]">
        <div className="w-12 h-12 rounded-full bg-[#EFF4FB] text-[#24529F] flex items-center justify-center mx-auto mb-5">
          <Lock className="w-5 h-5" />
        </div>

        <h2 className="text-xl font-bold text-[#0B0D12] tracking-tight">Tu sesión expiró</h2>
        <p className="text-xs sm:text-sm text-[#5A6578] mt-2 mb-6 leading-relaxed">
          Por seguridad cerramos tu sesión después de un tiempo sin actividad. Vuelve a iniciar sesión para seguir trabajando.
        </p>

        <button
          type="button"
          onClick={handleReiniciar}
          className="w-full bg-[#0D1B3E] hover:bg-[#12284A] text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
        >
          Iniciar sesión de nuevo
        </button>

        <p className="text-[11px] text-slate-400 mt-3">Los cambios no se perdieron.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <SesionExpiradaModal />
        <Routes>
          {/* Rutas Públicas de Cliente (escaneo de QR) */}
          <Route path="/estatus/:token" element={<PublicStatusPage />} />
          <Route path="/verificar/:token" element={<PublicVerifyPage />} />

          {/* Autenticación y recuperación de contraseña (P1, P2, P3) */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/restablecer" element={<AuthPage modoInicial="restablecer" />} />

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
            path="/notificaciones"
            element={
              <ProtectedRoute>
                <NotificacionesPage />
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
