/**
 * @file AuthPage.jsx
 * @description Pantallas de Inicio de sesión (P1), Registro de usuario (P2) y Recuperación/Restablecimiento de contraseña (P3).
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Check, Mail, ArrowLeft, Lock, Clock } from 'lucide-react';
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

export default function AuthPage({ modoInicial = 'login' }) {
  const [searchParams] = useSearchParams();
  const tokenRecuperacion = searchParams.get('token') || '';
  const modoQuery = searchParams.get('modo');

  // Modos: 'login' | 'registro' | 'cuenta_creada' | 'recuperar' | 'correo_enviado' | 'restablecer' | 'contrasena_actualizada' | 'enlace_caducado'
  const [modo, setModo] = useState(() => {
    if (modoInicial === 'restablecer') {
      return tokenRecuperacion ? 'restablecer' : 'enlace_caducado';
    }
    if (modoQuery === 'recuperar' || modoQuery === 'registro') {
      return modoQuery;
    }
    return modoInicial;
  });
  const [mantenerSesion, setMantenerSesion] = useState(true);
  const [segundosReenvio, setSegundosReenvio] = useState(0);

  const { login, registro } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmar_password: '',
    codigo_taller: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usuarioCreado, setUsuarioCreado] = useState(null);

  useEffect(() => {
    if (modoInicial === 'restablecer') {
      setModo(tokenRecuperacion ? 'restablecer' : 'enlace_caducado');
    } else if (modoQuery === 'recuperar' || modoQuery === 'registro') {
      setModo(modoQuery);
    } else {
      setModo(modoInicial);
    }
    setError(null);
  }, [modoInicial, modoQuery, tokenRecuperacion]);

  // Cuenta regresiva para reenviar correo de recuperación (P3)
  useEffect(() => {
    if (segundosReenvio <= 0) return;
    const timer = setTimeout(() => setSegundosReenvio((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [segundosReenvio]);

  const seguridad = evaluarSeguridadPassword(formData.password);
  const passwordsNoCoinciden =
    (modo === 'registro' || modo === 'restablecer') &&
    formData.confirmar_password.length > 0 &&
    formData.password !== formData.confirmar_password;

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError(null);
    if (nuevoModo === 'login') {
      setFormData((prev) => ({ ...prev, password: '', confirmar_password: '' }));
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  /**
   * Procesa el inicio de sesión del personal del taller (RF-01).
   * Limpia los campos en caso de error.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    const emailLimpio = formData.email.trim();
    if (!emailLimpio || !formData.password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(emailLimpio, formData.password, mantenerSesion);
      navigate('/dashboard');
    } catch (err) {
      // RF-01: Limpiar campos al fallar las credenciales y mostrar error
      setFormData((prev) => ({ ...prev, email: '', password: '' }));
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
    if (!formData.nombre.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }
    if (!formData.email.trim()) {
      setError('El correo electrónico es obligatorio.');
      return;
    }
    if (!formData.codigo_taller.trim()) {
      setError('Por favor ingresa el código del taller.');
      return;
    }
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
        codigo_taller: formData.codigo_taller.trim(),
      });
      setUsuarioCreado(user || { nombre: formData.nombre.trim() });
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
  const enviarSolicitudRecuperacion = async () => {
    const emailLimpio = formData.email.trim();
    if (!emailLimpio) {
      setError('Por favor escribe tu correo electrónico.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.recuperar(emailLimpio);
      setSegundosReenvio(60);
      setModo('correo_enviado');
    } catch (err) {
      setError(err.message || 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    await enviarSolicitudRecuperacion();
  };

  /**
   * Guarda la nueva contraseña usando el token de recuperación (P3 paso 2).
   */
  const handleRestablecer = async (e) => {
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
      await authApi.restablecer({
        token: tokenRecuperacion,
        password: formData.password,
        confirmar_password: formData.confirmar_password,
      });
      setFormData((prev) => ({ ...prev, password: '', confirmar_password: '' }));
      setModo('contrasena_actualizada');
    } catch (err) {
      if (err.data?.codigo === 'ENLACE_CADUCADO' || err.status === 400) {
        setModo('enlace_caducado');
      } else {
        setError(err.message || 'No se pudo actualizar la contraseña.');
      }
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
    if (
      modo === 'recuperar' ||
      modo === 'correo_enviado' ||
      modo === 'restablecer' ||
      modo === 'contrasena_actualizada' ||
      modo === 'enlace_caducado'
    ) {
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
          <div className="flex items-center gap-3 mb-12 lg:mb-16">
            <div className="w-9 h-9 rounded-lg bg-[#24529F] flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">InfoFIX</span>
          </div>

          {/* Mensaje principal */}
          <h1 className="text-3xl lg:text-[40px] font-bold leading-[1.15] tracking-tight max-w-md">
            {obtenerTituloLateral()}
          </h1>

          <p className="mt-5 text-sm lg:text-base text-slate-300/90 leading-relaxed max-w-md">
            Registra el equipo, documenta cada etapa con fotos y entrega un certificado con QR que tu
            cliente puede comprobar sin crear cuenta.
          </p>
        </div>
      </div>

      {/* COLUMNA DERECHA: Formularios sobre fondo blanco */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-[420px]">
          {/* P1: INICIAR SESIÓN */}
          {modo === 'login' && (
            <div>
              <h2 className="text-2xl lg:text-[28px] font-bold text-[#0B0D12] tracking-tight">
                Iniciar sesión
              </h2>
              <p className="text-sm text-[#5A6578] mt-1.5 mb-7">
                Acceso exclusivo para el personal del taller.
              </p>

              <form noValidate onSubmit={handleLogin} className="space-y-5">
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
                    placeholder="tecnico@taller.mx"
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
                    className="text-[#5A6578] hover:text-[#0D1B3E] font-medium transition-colors cursor-pointer"
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
                      <p className="font-semibold">{error}</p>
                      <p className="text-[#C53030]/80 mt-0.5">
                        Revisa tus datos e inténtalo de nuevo.
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

          {/* P2: REGISTRO DE USUARIO */}
          {modo === 'registro' && (
            <div>
              <h2 className="text-2xl lg:text-[28px] font-bold text-[#0B0D12] tracking-tight">
                Crear cuenta
              </h2>
              <p className="text-sm text-[#5A6578] mt-1.5 mb-7">
                Registra al personal del taller para que pueda entrar al panel.
              </p>

              <form noValidate onSubmit={handleRegistro} className="space-y-4">
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
                    placeholder="Nombre y apellido"
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
                    placeholder="correo@taller.mx"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0B0D12] placeholder-slate-400 focus:outline-none focus:border-[#24529F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E2430] mb-1.5">
                    Código del taller <span className="text-[#C53030]">*</span>
                  </label>
                  <input
                    type="text"
                    name="codigo_taller"
                    required
                    value={formData.codigo_taller}
                    onChange={handleChange}
                    placeholder="Solicítalo al encargado del taller"
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

                {/* Medidor de seguridad de contraseña */}
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

          {/* P2 VARIANTE: CUENTA CREADA */}
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
                    {usuarioCreado?.nombre || formData.nombre} · Personal del taller
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => cambiarModo('login')}
                className="w-full border border-slate-300 hover:bg-slate-50 text-[#0B0D12] font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                Volver a iniciar sesión
              </button>
            </div>
          )}

          {/* P3: RECUPERAR CONTRASEÑA */}
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

              <form noValidate onSubmit={handleRecuperar} className="space-y-5">
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
                    placeholder="correo@taller.mx"
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

                <div className="p-3.5 rounded-xl bg-[#F4F7FB] border border-slate-200/80 text-xs text-[#5A6578] flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-[#24529F] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#1E2430]">El enlace caduca en 30 minutos</p>
                    <p className="mt-0.5">
                      Solo funciona una vez. Si no te llega, revisa tu carpeta de spam.
                    </p>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* P3 VARIANTE: CORREO ENVIADO */}
          {modo === 'correo_enviado' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#E3F4EC] text-[#1F8A4C] flex items-center justify-center mx-auto mb-5">
                <Mail className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-bold text-[#0B0D12]">Revisa tu correo</h2>
              <p className="text-sm text-[#5A6578] mt-2 mb-6 leading-relaxed">
                Enviamos un enlace a <span className="font-semibold text-[#0B0D12]">{formData.email}</span>. Ábrelo y sigue las instrucciones para crear tu nueva contraseña.
              </p>

              <button
                type="button"
                disabled={segundosReenvio > 0 || loading}
                onClick={enviarSolicitudRecuperacion}
                className="w-full border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-[#0B0D12] font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer disabled:cursor-not-allowed mb-3"
              >
                {loading ? 'Reenviando...' : 'Reenviar correo'}
              </button>

              {segundosReenvio > 0 && (
                <p className="text-[11px] text-[#5A6578] mb-5">
                  Podrás reenviarlo en {segundosReenvio}s
                </p>
              )}

              <button
                type="button"
                onClick={() => cambiarModo('login')}
                className="text-xs font-semibold text-[#0D1B3E] hover:underline cursor-pointer"
              >
                ← Volver a iniciar sesión
              </button>
            </div>
          )}

          {/* P3 PASO 2: RESTABLECER CONTRASEÑA */}
          {modo === 'restablecer' && (
            <div>
              <h2 className="text-2xl lg:text-[28px] font-bold text-[#0B0D12] tracking-tight">
                Crea una nueva contraseña
              </h2>
              <p className="text-sm text-[#5A6578] mt-1.5 mb-7">
                Usa al menos 8 caracteres y un número.
              </p>

              <form noValidate onSubmit={handleRestablecer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E2430] mb-1.5">
                    Nueva contraseña <span className="text-[#C53030]">*</span>
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

                {/* Medidor de seguridad */}
                <div>
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

                {passwordsNoCoinciden && (
                  <p className="text-xs text-[#C53030] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Las contraseñas no coinciden
                  </p>
                )}

                {error && !passwordsNoCoinciden && (
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
                  {loading ? 'Guardando...' : 'Guardar contraseña'}
                </button>

                <div className="p-3.5 rounded-xl bg-[#F4F7FB] border border-slate-200/80 text-xs text-[#5A6578] flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-[#24529F] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#1E2430]">Se cerrará tu sesión en otros equipos</p>
                    <p className="mt-0.5">
                      Por seguridad tendrás que entrar de nuevo con la contraseña nueva.
                    </p>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* P3 VARIANTE: CONTRASEÑA ACTUALIZADA */}
          {modo === 'contrasena_actualizada' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#E3F4EC] text-[#1F8A4C] flex items-center justify-center mx-auto mb-5">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>

              <h2 className="text-2xl font-bold text-[#0B0D12]">Contraseña actualizada</h2>
              <p className="text-sm text-[#5A6578] mt-1.5 mb-7">
                Ya puedes entrar al panel con tu nueva contraseña.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full bg-[#0D1B3E] hover:bg-[#12284A] text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
              >
                Iniciar sesión
              </button>
            </div>
          )}

          {/* P3 VARIANTE: ENLACE CADUCADO */}
          {modo === 'enlace_caducado' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#FDECEC] text-[#C53030] flex items-center justify-center mx-auto mb-5">
                <Clock className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-bold text-[#0B0D12]">El enlace ya no es válido</h2>
              <p className="text-sm text-[#5A6578] mt-2 mb-7 leading-relaxed">
                Caducó o ya se usó. Los enlaces para restablecer la contraseña duran 30 minutos y funcionan una sola vez.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login?modo=recuperar')}
                className="w-full bg-[#0D1B3E] hover:bg-[#12284A] text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-sm cursor-pointer mb-4"
              >
                Pedir un enlace nuevo
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
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
