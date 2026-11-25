/**
 * @file DashboardPage.jsx
 * @description Panel principal del taller (Dashboard P4) con métricas hero en tiempo real,
 *              widget de etapas, filtros, búsqueda y campana de notificaciones.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import {
  Home,
  ClipboardList,
  Plus,
  Users,
  Smartphone,
  FileCheck,
  FileText,
  Clock,
  Check,
  ShieldCheck,
  Search,
  Bell,
  LogOut,
  Wrench,
  Tag,
  X,
} from 'lucide-react';

const ESTADOS_ACTIVOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas'];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [ordenes, setOrdenes] = useState([]);
  const [indicadores, setIndicadores] = useState({
    activas: 0,
    en_pruebas: 0,
    terminadas: 0,
    garantias_vigentes: 0,
  });
  const [porEtapa, setPorEtapa] = useState(ESTADOS_ACTIVOS.map((e) => ({ estado: e, total: 0 })));
  const [taller, setTaller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorBusqueda, setErrorBusqueda] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState(() => searchParams.get('q') || '');
  const [busquedaActiva, setBusquedaActiva] = useState(() => (searchParams.get('q') || '').trim());

  // Estado de notificaciones en la campana (P5 preview)
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [notifAbierto, setNotifAbierto] = useState(false);
  const [filtroNotif, setFiltroNotif] = useState('todas');
  const notifRef = useRef(null);

  const cargarNotificaciones = useCallback(async () => {
    try {
      const data = await apiRequest('/api/notificaciones');
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas || 0);
    } catch {
      // Silencioso en actualización de fondo
    }
  }, []);

  const cargarDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setErrorBusqueda(null);

      // Siempre consultamos /api/dashboard para KPIs, gráfica por etapa y taller en tiempo real
      const dashParams = new URLSearchParams();
      if (filtroEstado && !busquedaActiva) {
        dashParams.set('estado', filtroEstado);
      }
      const dashQuery = dashParams.toString();
      const dashData = await apiRequest(`/api/dashboard${dashQuery ? `?${dashQuery}` : ''}`);

      setIndicadores(
        dashData.indicadores || { activas: 0, en_pruebas: 0, terminadas: 0, garantias_vigentes: 0 },
      );
      setPorEtapa(dashData.por_etapa || ESTADOS_ACTIVOS.map((e) => ({ estado: e, total: 0 })));
      if (dashData.taller) setTaller(dashData.taller);

      if (busquedaActiva) {
        if (busquedaActiva.length < 3) {
          setErrorBusqueda('Escribe al menos 3 caracteres para buscar');
          setOrdenes([]);
          return;
        }
        const searchQ = new URLSearchParams({ q: busquedaActiva });
        if (filtroEstado) searchQ.set('estado', filtroEstado);
        const searchData = await apiRequest(`/api/ordenes?${searchQ.toString()}`);
        setOrdenes(searchData.ordenes || []);
      } else {
        setOrdenes(dashData.ordenes_activas || []);
      }
    } catch (err) {
      setErrorBusqueda(err.message || 'No se pudieron cargar las órdenes.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, busquedaActiva]);

  useEffect(() => {
    cargarDashboard();
    cargarNotificaciones();
  }, [cargarDashboard, cargarNotificaciones]);

  // Sincronizar parámetro ?q= si llega desde otra página (p. ej. DetalleOrdenPage)
  useEffect(() => {
    const qUrl = (searchParams.get('q') || '').trim();
    if (qUrl !== busquedaActiva) {
      setBusqueda(qUrl);
      setBusquedaActiva(qUrl);
    }
  }, [searchParams, busquedaActiva]);

  // Cerrar dropdown de notificaciones al hacer clic fuera
  useEffect(() => {
    function handleOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleBusquedaSubmit = (e) => {
    e.preventDefault();
    const limpio = busqueda.trim();
    if (limpio && limpio.length < 3) {
      setErrorBusqueda('Escribe al menos 3 caracteres para buscar');
      return;
    }
    setErrorBusqueda(null);
    setBusquedaActiva(limpio);
    if (limpio) {
      setSearchParams({ q: limpio });
    } else {
      setSearchParams({});
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setBusquedaActiva('');
    setErrorBusqueda(null);
    setSearchParams({});
  };

  const handleMarcarLeidas = async (ids) => {
    try {
      const data = await apiRequest('/api/notificaciones/leer', {
        method: 'POST',
        body: ids ? { ids } : {},
      });
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas || 0);
    } catch {
      // Ignorar error menor
    }
  };

  const obtenerFechaFormateada = () => {
    const hoy = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const fechaStr = hoy.toLocaleDateString('es-MX', opciones).replace(',', '');
    return fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
  };

  const obtenerSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const nombreUsuario = user?.nombre
    ? user.nombre.split(' ')[0]
    : user?.email
      ? user.email.split('@')[0]
      : '';

  const tallerSinOrdenes = indicadores.activas === 0 && indicadores.terminadas === 0;
  const tituloBienvenida = tallerSinOrdenes
    ? `Bienvenido${nombreUsuario ? `, ${nombreUsuario}` : ''}`
    : `${obtenerSaludo()}${nombreUsuario ? `, ${nombreUsuario}` : ''}`;

  const obtenerIniciales = (nombreCompleto, correo) => {
    if (nombreCompleto) {
      const partes = nombreCompleto.trim().split(/\s+/);
      if (partes.length >= 2) {
        return (partes[0][0] + partes[1][0]).toUpperCase();
      }
      return partes[0].substring(0, 2).toUpperCase();
    }
    if (correo) {
      return correo.substring(0, 2).toUpperCase();
    }
    return 'IF';
  };

  const totalActivas = indicadores.activas || 1;
  const etapaCountMap = Object.fromEntries(porEtapa.map((e) => [e.estado, e.total]));

  const subtituloTaller = [taller?.nombre, taller?.direccion].filter(Boolean).join(', ');

  const menuTaller = [
    { label: 'Inicio', icon: Home, path: '/dashboard' },
    {
      label: 'Órdenes',
      icon: ClipboardList,
      path: '/ordenes',
      badge: indicadores.activas > 0 ? indicadores.activas : null,
    },
    { label: 'Nueva orden', icon: Plus, path: '/ordenes/nueva' },
  ];

  const menuRegistros = [
    { label: 'Clientes', icon: Users, path: '/clientes' },
    { label: 'Dispositivos', icon: Smartphone, path: '/dispositivos' },
    { label: 'Certificados', icon: FileCheck, path: '/certificados' },
  ];

  const notifFiltradas =
    filtroNotif === 'no_leidas' ? notificaciones.filter((n) => !n.leida) : notificaciones;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col lg:flex-row font-sans">
      {/* ================= SIDEBAR LATERAL IZQUIERDO ================= */}
      <aside className="w-full lg:w-64 bg-[#0D1B3E] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-[#24529F] flex items-center justify-center text-white shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-lg tracking-tight">InfoFIX</span>
            </div>
          </div>

          <div className="p-4 space-y-6">
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
                TALLER
              </p>
              {menuTaller.map((item, index) => {
                const Icon = item.icon;
                const activo = location.pathname === item.path && index === 0;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      activo
                        ? 'bg-[#24529F] text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 rounded-md bg-white/15 text-white text-[10px] font-mono font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="space-y-1">
              <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
                REGISTROS
              </p>
              {menuRegistros.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Perfil del usuario en el pie del Sidebar */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#24529F] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
              {obtenerIniciales(user?.nombre, user?.email)}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate" title={user?.nombre || user?.email}>
                {user?.nombre || user?.email || '—'}
              </p>
              <p className="text-[10px] text-slate-400 truncate" title={user?.email}>
                {user?.email || 'Personal del taller'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior de navegación */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-20">
          <div className="text-xs font-medium text-slate-500">
            {tallerSinOrdenes ? 'Panel / Dashboard' : 'Resumen de órdenes'}
          </div>

          <div className="flex items-center gap-2.5">
            <form onSubmit={handleBusquedaSubmit} className="relative w-56 sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente, teléfono o IMEI"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  if (errorBusqueda) setErrorBusqueda(null);
                  if (!e.target.value.trim() && busquedaActiva) {
                    limpiarBusqueda();
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#24529F] focus:bg-white transition-all"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={limpiarBusqueda}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Campana de notificaciones en tiempo real (P5) */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifAbierto((v) => !v);
                  cargarNotificaciones();
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative cursor-pointer"
                title="Notificaciones del taller"
              >
                <Bell className="w-4 h-4" />
                {noLeidas > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#24529F] ring-2 ring-white" />
                )}
              </button>

              {notifAbierto && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Notificaciones</span>
                      {noLeidas > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#24529F] text-[10px] font-bold">
                          {noLeidas} nuevas
                        </span>
                      )}
                    </div>
                    {noLeidas > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMarcarLeidas()}
                        className="text-[11px] font-semibold text-[#24529F] hover:underline cursor-pointer"
                      >
                        Marcar como leídas
                      </button>
                    )}
                  </div>

                  <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFiltroNotif('todas')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                        filtroNotif === 'todas'
                          ? 'bg-[#0D1B3E] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroNotif('no_leidas')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                        filtroNotif === 'no_leidas'
                          ? 'bg-[#0D1B3E] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      No leídas
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifFiltradas.length === 0 ? (
                      <p className="p-6 text-center text-xs text-slate-400">
                        Sin notificaciones {filtroNotif === 'no_leidas' ? 'pendientes' : 'recientes'}.
                      </p>
                    ) : (
                      notifFiltradas.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.leida) handleMarcarLeidas([n.id]);
                            if (n.orden_id) {
                              setNotifAbierto(false);
                              navigate(`/ordenes/${n.orden_id}`);
                            }
                          }}
                          className={`px-4 py-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                            !n.leida ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900">{n.mensaje}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {new Date(n.fecha).toLocaleString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {!n.leida && (
                            <span className="w-2 h-2 rounded-full bg-[#24529F] shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Cuerpo del Dashboard */}
        <main className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {errorBusqueda && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
              <span>{errorBusqueda}</span>
              <button type="button" onClick={() => setErrorBusqueda(null)} className="text-amber-600 hover:text-amber-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bienvenida, fecha y botones de acción rápida */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0B0D12] tracking-tight">
                {tituloBienvenida}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {obtenerFechaFormateada()}
                {subtituloTaller ? ` · ${subtituloTaller}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <Link
                to="/clientes"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
              >
                Clientes
              </Link>
              <Link
                to="/ordenes/nueva"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold transition-all shadow-sm shrink-0 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva orden</span>
              </Link>
            </div>
          </div>

          {/* ================= TARJETAS DE MÉTRICAS (FIGMA P4) ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0D1B3E] border border-[#0D1B3E] rounded-2xl p-5 shadow-sm text-white flex flex-col justify-between min-h-[135px]">
              <div>
                <div className="flex items-center gap-2.5 text-white/90 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 text-cyan-300 flex items-center justify-center">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-200">
                    Reparaciones activas
                  </span>
                </div>
                <div className="text-4xl font-bold font-mono tracking-tight text-white mt-2">
                  {indicadores.activas}
                </div>
              </div>
              {indicadores.activas === 0 && (
                <p className="text-[11px] text-slate-400 mt-2">Sin órdenes en curso</p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
              <div>
                <div className="flex items-center gap-2.5 text-slate-600 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#24529F] flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    En espera de pruebas
                  </span>
                </div>
                <div className="text-4xl font-bold font-mono text-[#0B0D12] mt-2">
                  {indicadores.en_pruebas}
                </div>
              </div>
              {indicadores.en_pruebas === 0 && (
                <p className="text-[11px] text-slate-400 mt-2">Nada pendiente</p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
              <div>
                <div className="flex items-center gap-2.5 text-slate-600 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    Reparaciones terminadas
                  </span>
                </div>
                <div className="text-4xl font-bold font-mono text-[#0B0D12] mt-2">
                  {indicadores.terminadas}
                </div>
              </div>
              {indicadores.terminadas === 0 && (
                <p className="text-[11px] text-slate-400 mt-2">Aún no hay entregas</p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[135px]">
              <div>
                <div className="flex items-center gap-2.5 text-slate-600 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    Garantías vigentes
                  </span>
                </div>
                <div className="text-4xl font-bold font-mono text-[#0B0D12] mt-2">
                  {indicadores.garantias_vigentes}
                </div>
              </div>
              {indicadores.garantias_vigentes === 0 && (
                <p className="text-[11px] text-slate-400 mt-2">Sin garantías activas</p>
              )}
            </div>
          </div>

          {/* ================= LAYOUT EN 2 COLUMNAS: ÓRDENES + ETAPAS ================= */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 w-full">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-[#0B0D12] shrink-0">
                    {busquedaActiva ? `Resultados para "${busquedaActiva}"` : 'Órdenes activas'}
                  </h2>
                  {busquedaActiva && (
                    <button
                      type="button"
                      onClick={limpiarBusqueda}
                      className="text-[11px] text-[#24529F] hover:underline font-semibold"
                    >
                      Ver activas
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setFiltroEstado('')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      filtroEstado === ''
                        ? 'bg-[#0D1B3E] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas
                  </button>
                  {ESTADOS_ACTIVOS.map((est) => (
                    <button
                      key={est}
                      onClick={() => setFiltroEstado(est)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        filtroEstado === est
                          ? 'bg-[#0D1B3E] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 font-mono">
                  Cargando registros...
                </div>
              ) : ordenes.length === 0 ? (
                filtroEstado || busquedaActiva ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-[#0B0D12]">
                      {busquedaActiva
                        ? 'No se encontraron órdenes de reparación'
                        : `No hay órdenes en la etapa "${filtroEstado}"`}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 mb-5 max-w-sm">
                      {busquedaActiva
                        ? 'Revisa el folio o busca por nombre del cliente, teléfono o IMEI.'
                        : 'Actualmente no hay equipos en este estado de reparación.'}
                    </p>
                    <button
                      onClick={() => {
                        setFiltroEstado('');
                        limpiarBusqueda();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      Ver órdenes activas
                    </button>
                  </div>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-[#24529F] flex items-center justify-center mb-3 border border-blue-100 shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-[#0B0D12]">
                      No hay órdenes de reparación activas registradas
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 mb-5 max-w-sm">
                      Cuando recibas un equipo, crea su orden y aparecerá aquí con su estado.
                    </p>
                    <Link
                      to="/ordenes/nueva"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear primera orden</span>
                    </Link>
                  </div>
                )
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">FOLIO</th>
                        <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">CLIENTE</th>
                        <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">DISPOSITIVO</th>
                        <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">ESTADO</th>
                        <th className="py-3 px-3 sm:px-4 font-semibold whitespace-nowrap">RECEPCIÓN</th>
                        <th className="py-3 px-3 sm:px-4 font-semibold text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordenes.map((ord) => {
                        let colorEstado = 'bg-slate-100 text-slate-700 border-slate-200';
                        let puntoEstado = 'bg-slate-700';

                        if (ord.estado === 'Reparación') {
                          colorEstado = 'bg-blue-50 text-[#1D4ED8] border-blue-200';
                          puntoEstado = 'bg-[#1D4ED8]';
                        } else if (ord.estado === 'Diagnóstico') {
                          colorEstado = 'bg-sky-50 text-[#0284C7] border-sky-200';
                          puntoEstado = 'bg-[#0284C7]';
                        } else if (ord.estado === 'Pruebas') {
                          colorEstado = 'bg-[#0D1B3E] text-white border-[#0D1B3E]';
                          puntoEstado = 'bg-white';
                        } else if (ord.estado === 'Entregado') {
                          colorEstado = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          puntoEstado = 'bg-emerald-600';
                        }

                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 sm:px-4 font-mono font-bold text-[#0B0D12] whitespace-nowrap">
                              {ord.folio}
                            </td>
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                              <p className="font-semibold text-slate-900 leading-tight">
                                {ord.cliente || '—'}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {ord.telefono || '—'}
                              </p>
                            </td>
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                              <p className="font-medium text-slate-800 leading-tight">
                                {ord.marca} {ord.modelo}
                              </p>
                              <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                                {ord.tipo || 'Dispositivo'}
                              </p>
                            </td>
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${colorEstado}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${puntoEstado}`} />
                                {ord.estado}
                              </span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-slate-500 font-normal whitespace-nowrap text-xs">
                              {ord.fecha_recepcion
                                ? new Date(ord.fecha_recepcion)
                                    .toLocaleDateString('es-MX', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                    .replace('.', '')
                                : '—'}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                              <Link
                                to={`/ordenes/${ord.id}`}
                                className="inline-flex items-center px-3.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
                              >
                                Abrir
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: Widget "Equipos por etapas" */}
            <div className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="font-bold text-sm text-[#0B0D12]">Equipos por etapas</h2>

              {indicadores.activas > 0 ? (
                <div className="space-y-4 pt-1">
                  {[
                    { key: 'Recibido', color: 'bg-slate-400' },
                    { key: 'Diagnóstico', color: 'bg-[#3B82F6]' },
                    { key: 'Reparación', color: 'bg-[#1D4ED8]' },
                    { key: 'Pruebas', color: 'bg-[#0D1B3E]' },
                  ].map((et) => {
                    const count = etapaCountMap[et.key] || 0;
                    return (
                      <div key={et.key}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-700">{et.key}</span>
                          <span className="font-bold font-mono text-slate-900">{count}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${et.color} rounded-full transition-all duration-500`}
                            style={{
                              width: `${Math.min(
                                100,
                                count > 0 ? Math.max(12, (count / totalActivas) * 100) : 0,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">
                  Sin equipos en proceso actualmente.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
