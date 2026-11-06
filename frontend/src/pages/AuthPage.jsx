import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Shield, Lock, Mail, User, KeyRound, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'registro' | 'recuperar'
  const { login, registro } = useAuth();
  const navigate = useNavigate();

  // Estados de formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmar_password: '',
    codigo_taller: '',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registro(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.recuperar(formData.email);
      setSuccess(res.mensaje || 'Si la cuenta existe, se enviaron las instrucciones a tu correo.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Fondo técnico sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.12),rgba(255,255,255,0))] pointer-events-none" />

      {/* Tarjeta principal con acabado industrial */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl relative z-10 overflow-hidden">
        {/* Cabecera / Identidad */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold tracking-tight text-lg text-white">InfoFIX</span>
                  <span className="text-[9px] uppercase font-mono font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                    TALLER
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Control y Trazabilidad de Reparaciones</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="block text-[10px] font-mono text-slate-500 mt-0.5">ONLINE</span>
            </div>
          </div>

          {/* Selector de pestañas */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl mt-6 border border-slate-800/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); setSuccess(null); }}
              className={`py-2 rounded-lg transition-all active:scale-[0.98] ${
                tab === 'login'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => { setTab('registro'); setError(null); setSuccess(null); }}
              className={`py-2 rounded-lg transition-all active:scale-[0.98] ${
                tab === 'registro'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Registro
            </button>
            <button
              type="button"
              onClick={() => { setTab('recuperar'); setError(null); setSuccess(null); }}
              className={`py-2 rounded-lg transition-all active:scale-[0.98] ${
                tab === 'recuperar'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ayuda
            </button>
          </div>
        </div>

        {/* Notificaciones de error o éxito */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-300 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Formularios */}
        <div className="p-6">
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tecnico@infofix.local"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setTab('recuperar')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? 'Validando...' : 'Iniciar Sesión'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {tab === 'registro' && (
            <form onSubmit={handleRegistro} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Yahúm Hernández"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="usuario@dominio.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="≥ 8 caracteres"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Confirmar
                  </label>
                  <input
                    type="password"
                    name="confirmar_password"
                    required
                    value={formData.confirmar_password}
                    onChange={handleChange}
                    placeholder="Repetir"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-amber-400/90 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Código del Taller
                </label>
                <input
                  type="text"
                  name="codigo_taller"
                  required
                  value={formData.codigo_taller}
                  onChange={handleChange}
                  placeholder="Proporcionado por el administrador"
                  className="w-full bg-slate-950 border border-amber-500/30 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-50 text-sm"
              >
                {loading ? 'Creando cuenta...' : 'Registrar Técnico'}
              </button>
            </form>
          )}

          {tab === 'recuperar' && (
            <form onSubmit={handleRecuperar} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingresa tu correo institucional registrado. Si existe en el sistema, recibirás un enlace de un solo uso que expira en 30 minutos.
              </p>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tecnico@infofix.local"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition-all active:scale-[0.98] text-sm"
              >
                {loading ? 'Enviando solicitud...' : 'Enviar Enlace de Recuperación'}
              </button>
            </form>
          )}
        </div>

        {/* Pie con nota de privacidad */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 text-center">
          <span className="text-[10px] text-slate-500 font-mono">
            InfoFIX Security Protocol • LFPDPPP & NOM-174-SCFI-2007
          </span>
        </div>
      </div>
    </div>
  );
}
