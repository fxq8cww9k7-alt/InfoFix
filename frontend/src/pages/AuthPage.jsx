/**
 * @file AuthPage.jsx
 * @description Pantallas de Inicio de sesión (P1), Registro de usuario (P2) y Recuperación de contraseña (P3).
 * @task T07 (RF-01)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Check, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';

/**
 * Calcula el nivel de seguridad de la contraseña según las reglas de negocio (mín. 8 caracteres y 1 número).
 *
 * @param {string} password Contraseña a evaluar.
 * @returns {{ nivel: number, etiqueta: string, cumpleMinimo: boolean }}
 */
function evaluarSeguridadPassword(password) {
  if (!password) return { nivel: 0, etiqueta: 'Sin contraseña', cumpleMinimo: false };
  const tieneOcho = password.length >= 8;
  const tieneNumero = /\d/.test(password);
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneSimbolo = /[^A-Za-z0-9]/.test(password);

  const cumpleMinimo = tieneOcho && tieneNumero;
  let puntos = 0;
  if (tieneOcho) puntos++;
  if (tieneNumero) puntos++;
  if (tieneMayuscula) puntos++;
  if (tieneSimbolo || password.length >= 12) puntos++;

  const etiquetas = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente'];
  return {
    nivel: puntos,
    etiqueta: etiquetas[puntos] || 'Buena',
    cumpleMinimo,
  };
}

export default function AuthPage() {
  // Modos: 'login' (P1) | 'registro' (P2) | 'cuenta_creada' (P2 variante) | 'recuperar' (P3) | 'correo_enviado' (P3 variante)
  const [modo, setModo] = useState('login');
  const [mantenerSesion, setMantenerSesion] = useState(true);

  const { login, registro } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmar_password: '',
    codigo_taller: 'TALLER-EL-FIX', // Valor por defecto en caso de que el backend lo requiera
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usuarioCreado, setUsuarioCreado] = useState(null);

  const seguridad = evaluarSeguridadPassword(formData.password);
  const passwordsNoCoinciden =
    modo === 'registro' &&
    formData.confirmar_password.length > 0 &&
    formData.password !== formData.confirmar_password;

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError(null);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  /**
   * Procesa el inicio de sesión del personal del taller (RF-01).
   * Limpia los campos en caso de error según especifica la ERS.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(formData.email.trim(), formData.password);
      navigate('/dashboard');
    } catch (err) {
      // RF-01: Limpiar campos de contraseña al fallar y mostrar mensaje estándar
      setFormData((prev) => ({ ...prev, password: '' }));
      setError(err.message || 'Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Procesa el registro de un nuevo técnico o encargado del taller (P2).
   */
  const handleRegistro = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmar_password) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!seguridad.cumpleMinimo) {
      setError('La contraseña debe tener mínimo 8 caracteres y al menos 1 número');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await registro({
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmar_password: formData.confirmar_password,
        codigo_taller: formData.codigo_taller,
      });
      setUsuarioCreado(user || { nombre: formData.nombre, rol: 'Técnico' });
      setModo('cuenta_creada');
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envía solicitud de enlace de recuperación de contraseña (P3).
   */
  const handleRecuperar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.recuperar(formData.email.trim());
      setModo('correo_enviado');
    } catch (err) {
      setError(err.message || 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  // Textos dinámicos del panel izquierdo según la pantalla activa (P1, P2, P3)
  const obtenerTituloLateral = () => {
    if (modo === 'registro' || modo === 'cuenta_creada') {
      return (
        <>
          Únete al <span className="text-[#5B9BD5]">equipo de tu taller.</span>
        </>
      );
    }
    if (modo === 'recuperar' || modo === 'correo_enviado') {
      return (
        <>
          Recupera el <span className="text-[#5B9BD5]">acceso a tu panel.</span>
        </>
      );
    }
    return (
      <>
        Cada reparación,{' '}
        <span className="text-[#5B9BD5] block mt-1">registrada y verificable.</span>
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans text-[#0B0D12]">
      {/* COLUMNA IZQUIERDA: Identidad visual de InfoFIX (Navy 950 -> Navy 800) */}
      <div className="lg:w-[46%] bg-gradient-to-br from-[#0A0F1F] via-[#0D1B3E] to-[#12284A] text-white p-8 lg:p-14 flex flex-col justify-center relative overflow-hidden">
        <div>
          {/* Logo InfoFIX */}
          <div className="flex items-center gap-3 mb-12 lg:mb-20">
            <div className="w-9 h-9 rounded-lg bg-[#24529F] flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">InfoFIX</span>
          </div>

          {/* Mensaje principal */}
          <h1 className="text-3xl lg:text-[40px] font-bold leading-[1.15] tracking-tight max-w-md">
            {obtenerTituloLateral()}
          </h1>

          {modo === 'login' && (
            <p className="mt-5 text-sm lg:text-base text-slate-300/90 leading-relaxed max-w-md">
              Registra el equipo, documenta cada etapa con fotos y entrega un certificado con QR que tu
              cliente puede comprobar sin crear cuenta.
            </p>
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA: Formularios sobre fondo blanco */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-[420px]">
          {/* ==================== P1: INICIAR SESIÓN ==================== */}
          {modo === 'login' && (
            <div>
              <h2 className="text-2xl lg:text-[28px] font-bold text-[#0B0D12] tracking-tight">
                Iniciar sesión
              </h2>
              <p className="text-sm text-[#5A6578] mt-1.5 mb-7">
                Acceso exclusivo para el personal del taller.
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#1E2430] mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tecnico@tallerelfix.mx"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0B0D12] placeholder-slate-400 focus:outline-none focus:border-[#24529F] focus:ring-2 focus:ring-[#24529F]/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E2430] mb-1.5">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0B0D12] placeholder-slate-400 focus:outline-none focus:border-[#24529F] focus:ring-2 focus:ring-[#24529F]/15 transition-all"
                  />
                </div>

                {/* Mantener sesión y ¿Olvidaste tu contraseña? */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 text-[#1E2430] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mantenerSesion}
                      onChange={(e) => setMantenerSesion(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0D1B3E] focus:ring-[#24529F]"
                    />
                    <span>Mantener sesión</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => cambiarModo('recuperar')}
                    className="text-[#5A6578] hover:text-[#0D1B3E] font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0D1B3E] hover:bg-[#12284A] text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'Verificando acceso...' : 'Entrar al panel'}
                </button>

                {/* Alerta de error RF-01 */}
                {error && (
                  <div className="p-3.5 rounded-xl bg-[#FDECEC] border border-[#F8B4B4] flex items-start gap-2.5 text-[#C53030] text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Correo o contraseña incorrectos</p>
                      <p className="text-[#C53030]/80 mt-0.5">
                        Revisa tus datos e inténtalo de nuevo. Los campos se limpiaron por seguridad.
                      </p>
                    </div>
                  </div>
                )}
              </form>

              <p className="mt-8 text-xs text-[#5A6578]">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => cambiarModo('registro')}
                  className="font-semibold text-[#0D1B3E] hover:underline cursor-pointer"
                >
                  Crear cuenta
                </button>
              </p>
            </div>
          )}

          {/* ==================== P2: REGISTRO DE USUARIO ==================== */}
          {modo === 'registro' && (
            <div>
              <h2 className="text-2xl lg:text-[28px] font-bold text-[#0B0D12] tracking-tight">
                Crear cuenta
              </h2>
              <p className="text-sm text-[#5A6578] mt-1.5 mb-7">
                Registra al personal del taller para que pueda entrar al panel.
              </p>

              <form onSubmit={handleRegistro} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E2430] mb-1.5">
                    Nombre completo <span className="text-[#C53030]">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Marco Yahir Guzmán Gasca"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0B0D12] placeholder-slate-400 focus:outline-none focus:border-[#24529F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E2430] mb-1.5">
                    Correo electrónico <span className="text-[#C53030]">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="marco.guzman@tallerelfix.mx"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0B0D12] placeholder-slate-400 focus:outline-none focus:border-[#24529F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1E2430] mb-1.5">
                      Contraseña <span className="text-[#C53030]">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••••"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0B0D12] focus:outline-none focus:border-[#24529F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E2430] mb-1.5">
                      Confirmar contraseña <span className="text-[#C53030]">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmar_password"
                      required
                      value={formData.confirmar_password}
                      onChange={handleChange}
                      placeholder="••••••••••"
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-[#0B0D12] focus:outline-none ${
                        passwordsNoCoinciden
                          ? 'border-[#C53030] bg-[#FDECEC]/30'
                          : 'border-slate-300 focus:border-[#24529F]'
                      }`}
                    />
                  </div>
                </div>

                {/* Error en vivo si las contraseñas no coinciden */}
                {passwordsNoCoinciden && (
                  <p className="text-xs text-[#C53030] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Las contraseñas no coinciden
                  </p>
                )}

                {/* Medidor de seguridad de contraseña (P2 Figma) */}
                <div className="pt-1">
                  <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                    {[1, 2, 3, 4].map((barra) => (
                      <div
                        key={barra}
                        className={`h-1 rounded-full transition-colors ${
                          seguridad.nivel >= barra ? 'bg-[#1F8A4C]' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] text-[#5A6578]">
                    <span>Seguridad: {seguridad.etiqueta.toLowerCase()}</span>
                    <span>Mín. 8 caracteres, 1 número</span>
                  </div>
                </div>

                {error && !passwordsNoCoinciden && (
                  <div className="p-3 rounded-xl bg-[#FDECEC] border border-[#F8B4B4] flex items-center gap-2 text-[#C53030] text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0D1B3E] hover:bg-[#12284A] text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-sm disabled:opacity-60 cursor-pointer mt-2"
                >
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>

              <p className="mt-6 text-xs text-[#5A6578]">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => cambiarModo('login')}
                  className="font-semibold text-[#0D1B3E] hover:underline cursor-pointer"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          )}

          {/* ==================== P2 VARIANTE: CUENTA CREADA ==================== */}
          {modo === 'cuenta_creada' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#E3F4EC] text-[#1F8A4C] flex items-center justify-center mx-auto mb-5">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>

              <h2 className="text-2xl font-bold text-[#0B0D12]">Cuenta creada</h2>
              <p className="text-sm text-[#5A6578] mt-1 mb-6">Bienvenido a InfoFIX</p>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center gap-3 text-left mb-6">
                <div className="w-8 h-8 rounded-full bg-[#1F8A4C] text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B0D12]">Cuenta creada</p>
                  <p className="text-xs text-[#5A6578]">
                    {usuarioCreado?.nombre || formData.nombre} · Técnico
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full border border-slate-300 hover:bg-slate-50 text-[#0B0D12] font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                Ir al panel / Volver a iniciar sesión
              </button>
            </div>
          )}

          {/* ==================== P3: RECUPERAR CONTRASEÑA ==================== */}
          {modo === 'recuperar' && (
            <div>
              <button
                type="button"
                onClick={() => cambiarModo('login')}
                className="inline-flex items-center gap-1.5 text-xs text-[#5A6578] hover:text-[#0D1B3E] font-medium mb-6 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a iniciar sesión
              </button>

              <h2 className="text-2xl lg:text-[28px] font-bold text-[#0B0D12] tracking-tight">
                Recuperar contraseña
              </h2>
              <p className="text-sm text-[#5A6578] mt-1.5 mb-7">
                Escribe el correo con el que te registraste y te enviaremos un enlace para crear una
                nueva contraseña.
              </p>

              <form onSubmit={handleRecuperar} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#1E2430] mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tecnico@tallerelfix.mx"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0B0D12] placeholder-slate-400 focus:outline-none focus:border-[#24529F]"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-[#FDECEC] border border-[#F8B4B4] flex items-center gap-2 text-[#C53030] text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0D1B3E] hover:bg-[#12284A] text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'Enviando enlace...' : 'Enviar enlace'}
                </button>

                <div className="p-3.5 rounded-xl bg-[#F4F7FB] border border-slate-200/80 text-xs text-[#5A6578]">
                  <p className="font-semibold text-[#1E2430]">El enlace caduca en 30 minutos</p>
                  <p className="mt-0.5">
                    Solo funciona una vez. Si no te llega, revisa tu carpeta de spam.
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ==================== P3 VARIANTE: CORREO ENVIADO ==================== */}
          {modo === 'correo_enviado' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#E3F4EC] text-[#1F8A4C] flex items-center justify-center mx-auto mb-5">
                <Mail className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-bold text-[#0B0D12]">Revisa tu correo</h2>
              <p className="text-sm text-[#5A6578] mt-2 mb-6 leading-relaxed">
                Enviamos un enlace de recuperación a{' '}
                <span className="font-semibold text-[#0B0D12]">{formData.email}</span>. Ábrelo para
                crear una nueva contraseña.
              </p>

              <button
                type="button"
                onClick={() => cambiarModo('login')}
                className="text-xs font-semibold text-[#0D1B3E] hover:underline cursor-pointer"
              >
                ← Volver a iniciar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}