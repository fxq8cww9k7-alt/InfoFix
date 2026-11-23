/**
 * @file DashboardPage.jsx
 * @description Panel principal del taller (Dashboard P4) con métricas hero, widget de etapas,
 *              filtros y listado de órdenes activas conforme al diseño oficial de Figma.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Calendar,
  ChevronRight,
  Search,
  SlidersHorizontal,
  LogOut,
  Wrench,
  Tag,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [ordenes, setOrdenes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Carga inicial y reactiva de órdenes
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (busqueda.trim()) params.append('q', busqueda.trim());

      const data = await apiRequest(`/api/ordenes?${params.toString()}`);
      setOrdenes(data.ordenes || []);
      if (data.resumen) {
        setResumen(data.resumen);
      }
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  const handleBusquedaSubmit = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];

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

  const nombreUsuario = user?.nombre ? user.nombre.split(' ')[0] : 'Yahúm';
  const tituloBienvenida = ordenes.length === 0 ? `Bienvenido, ${nombreUsuario}` : `${obtenerSaludo()}, ${nombreUsuario}`;

  // Cálculo de etapas para el widget "Equipos por etapas"
  const etapasCount = {
    Recibido: ordenes.filter((o) => o.estado === 'Recibido').length,
    Diagnóstico: ordenes.filter((o) => o.estado === 'Diagnóstico').length,
    Reparación: ordenes.filter((o) => o.estado === 'Reparación').length,
    Pruebas: ordenes.filter((o) => o.estado === 'Pruebas').length,
  };
  const totalActivas = (resumen?.activas ?? ordenes.length) || 1;

  // Menú agrupado según el diseño oficial de Figma
  const menuTaller = [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    {
      label: 'Órdenes',
      icon: ClipboardList,
      path: '/dashboard',
      badge: resumen?.activas > 0 ? resumen.activas : null,
    },
    { label: 'Nueva orden', icon: Plus, path: '/ordenes/nueva' },
  ];

  const menuRegistros = [
    { label: 'Clientes', icon: Users, path: '/dashboard' },
    { label: 'Dispositivos', icon: Smartphone, path: '/dashboard' },
    { label: 'Certificados', icon: FileCheck, path: '/dashboard' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col lg:flex-row font-sans">
      {/* ================= SIDEBAR LATERAL IZQUIERDO ================= */}
      <aside className="w-full lg:w-64 bg-[#0D1B3E] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Logo / Cabecera InfoFIX */}
          <div className="p-6 flex items-center gap-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-[#24529F] flex items-center justify-center text-white shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-lg tracking-tight">InfoFIX</span>
            </div>
          </div>

          {/* Menú de navegación organizado en TALLER y REGISTROS */}
          <div className="p-4 space-y-6">
            {/* Grupo 1: TALLER */}
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
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-md bg-white/15 text-white text-[10px] font-mono font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Grupo 2: REGISTROS */}
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

        {/* Perfil del técnico en el pie del Sidebar */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#24529F] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
              {user?.nombre
                ? user.nombre.substring(0, 2).toUpperCase()
                : user?.email
                  ? user.email.substring(0, 2).toUpperCase()
                  : 'IF'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {user?.nombre || user?.email || 'Técnico'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">Técnico</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
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
            Resumen de órdenes
          </div>

          {/* Buscador superior y opciones */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleBusquedaSubmit} className="relative w-64 sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente, teléfono o IMEI"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#24529F] focus:bg-white transition-all"
              />
            </form>
            <button
              type="button"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              title="Filtros avanzados"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Cuerpo del Dashboard */}
        <main className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Bienvenida, fecha y botones de acción rápida */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0B0D12] tracking-tight">
                {tituloBienvenida}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {obtenerFechaFormateada()} · Taller El Fix, Guadalajara
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {ordenes.length > 0 && (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
                >
                  Clientes
                </Link>
              )}
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
            {/* TARJETA HERO OSCURA: Reparaciones activas */}
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
                  {resumen?.activas ?? ordenes.length}
                </div>
              </div>
              {(resumen?.activas ?? ordenes.length) === 0 && (
                <p className="text-[11px] text-slate-400 mt-2">
                  Sin órdenes en curso
                </p>
              )}
            </div>

            {/* TARJETA 2: En espera de pruebas */}
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
                  {resumen?.pruebas ?? 0}
                </div>
              </div>
              {(resumen?.pruebas ?? 0) === 0 && (
                <p className="text-[11px] text-slate-400 mt-2">
                  Nada pendiente
                </p>
              )}
            </div>

            {/* TARJETA 3: Reparaciones terminadas */}
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
                  {resumen?.entregadas ?? 0}
                </div>
              </div>
              {(resumen?.entregadas ?? 0) === 0 && (
                <p className="text-[11px] text-slate-400 mt-2">
                  Aún no hay entregas
                </p>
              )}
            </div>

            {/* TARJETA 4: Garantías vigentes */}
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
                  {resumen?.garantias ?? 0}
                </div>
              </div>
              {(resumen?.garantias ?? 0) === 0 && (
                <p className="text-[11px] text-slate-400 mt-2">
                  Sin garantías activas
                </p>
              )}
            </div>
          </div>

          {/* ================= LAYOUT EN 2 COLUMNAS: ÓRDENES + ETAPAS ================= */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* COLUMNA IZQUIERDA: Tabla de Órdenes Activas (Flexible) */}
            <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <h2 className="font-bold text-sm text-[#0B0D12] shrink-0">Órdenes activas</h2>

                {/* Filtros de estado en pestañas tipo píldora (visibles cuando hay órdenes) */}
                {ordenes.length > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      onClick={() => setFiltroEstado('')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        filtroEstado === ''
                          ? 'bg-[#0D1B3E] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todas
                    </button>
                    {ESTADOS.slice(0, 4).map((est) => (
                      <button
                        key={est}
                        onClick={() => setFiltroEstado(est)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                          filtroEstado === est
                            ? 'bg-[#0D1B3E] text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {est}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Contenido de la Tabla / Estado vacío */}
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 font-mono">
                  Cargando registros...
                </div>
              ) : ordenes.length === 0 ? (
                /* Estado vacío oficial Figma (Image 2) */
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
              ) : (
                /* Listado oficial con dos líneas por celda (Image 1) */
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
                        }

                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 sm:px-4 font-mono font-bold text-[#0B0D12] whitespace-nowrap">
                              {ord.folio}
                            </td>
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                              <p className="font-semibold text-slate-900 leading-tight">
                                {ord.cliente || ord.nombre_cliente || 'Cliente General'}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {ord.telefono || ord.telefono_cliente || '—'}
                              </p>
                            </td>
                            <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                              <p className="font-medium text-slate-800 leading-tight">
                                {ord.marca} {ord.modelo}
                              </p>
                              <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                                {ord.tipo || 'Celular'}
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

            {/* COLUMNA DERECHA: Widget "Equipos por etapas" (Compacto) */}
            <div className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="font-bold text-sm text-[#0B0D12]">Equipos por etapas</h2>

              {ordenes.length > 0 && (
                <div className="space-y-4 pt-1">
                  {/* Etapa 1: Recibido */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">Recibido</span>
                      <span className="font-bold font-mono text-slate-900">{etapasCount.Recibido}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            etapasCount.Recibido > 0 ? Math.max(12, (etapasCount.Recibido / totalActivas) * 100) : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Etapa 2: Diagnóstico */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">Diagnóstico</span>
                      <span className="font-bold font-mono text-slate-900">{etapasCount.Diagnóstico}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3B82F6] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            etapasCount.Diagnóstico > 0 ? Math.max(12, (etapasCount.Diagnóstico / totalActivas) * 100) : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Etapa 3: Reparación */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">Reparación</span>
                      <span className="font-bold font-mono text-slate-900">{etapasCount.Reparación}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1D4ED8] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            etapasCount.Reparación > 0 ? Math.max(12, (etapasCount.Reparación / totalActivas) * 100) : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Etapa 4: Pruebas */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">Pruebas</span>
                      <span className="font-bold font-mono text-slate-900">{etapasCount.Pruebas}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0D1B3E] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            etapasCount.Pruebas > 0 ? Math.max(12, (etapasCount.Pruebas / totalActivas) * 100) : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
