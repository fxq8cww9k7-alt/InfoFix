/**
 * @file DashboardPage.jsx
 * @description Panel principal del taller (Dashboard P4) con métricas, filtros y listado de órdenes activas.
 * @task T14 (RF-13, RF-14)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import {
  Wrench,
  LogOut,
  Bell,
  Search,
  Plus,
  Smartphone,
  LayoutDashboard,
  ClipboardList,
  Users,
  HardDrive,
  FileCheck,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [ordenes, setOrdenes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filtroEstado) query.set('estado', filtroEstado);
      if (busqueda && busqueda.length >= 3) query.set('q', busqueda);

      const [resOrdenes, resNotifs] = await Promise.all([
        apiRequest(`/api/ordenes?${query.toString()}`),
        apiRequest('/api/notificaciones').catch(() => ({ notificaciones: [], no_leidas: 0 })),
      ]);

      setOrdenes(resOrdenes.ordenes || []);
      setResumen(resOrdenes.resumen || null);
      setNotificaciones(resNotifs.notificaciones || []);
      setNoLeidas(resNotifs.no_leidas || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];

  // Enlaces del menú lateral (Sidebar) oficial del taller
  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Órdenes', icon: ClipboardList, path: '/dashboard', badge: resumen?.activas || 12 },
    { label: 'Nueva orden', icon: Plus, path: '/ordenes/nueva' },
    { label: 'Clientes', icon: Users, path: '/dashboard' },
    { label: 'Dispositivos', icon: HardDrive, path: '/dashboard' },
    { label: 'Certificados', icon: FileCheck, path: '/dashboard' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col lg:flex-row font-sans">
      {/* ================= SIDEBAR LATERAL IZQUIERDO ================= */}
      <aside className="w-full lg:w-64 bg-[#0D1B3E] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Logo / Cabecera */}
          <div className="p-6 flex items-center gap-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-lg bg-[#24529F] flex items-center justify-center text-white shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg tracking-tight">InfoFIX</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-bold">
                  TALLER
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Panel Interno</p>
            </div>
          </div>

          {/* Menú de navegación */}
          <div className="p-4 space-y-1.5">
            <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">
              Gestión Taller
            </p>
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const activo = location.pathname === item.path && index === 0;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activo
                      ? 'bg-[#24529F] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Perfil del técnico en la esquina inferior del Sidebar */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#24529F] text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user?.nombre ? user.nombre.substring(0, 2).toUpperCase() : 'YH'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.nombre || 'Yahúm Hernández'}</p>
              <p className="text-[10px] text-slate-400 truncate">Técnico encargado</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior / Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-20 flex items-center justify-between shadow-sm">
          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            Panel / <span className="text-[#0D1B3E] font-semibold">Dashboard</span>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            {/* Buscador superior rápido */}
            <form onSubmit={handleBuscar} className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por folio, cliente, IMEI..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#24529F] focus:bg-white transition-colors"
              />
            </form>

            {/* Campana de Notificaciones (P5) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMostrarNotifs(!mostrarNotifs)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 relative transition-colors cursor-pointer"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {noLeidas}
                  </span>
                )}
              </button>

              {/* Panel desplegable de Notificaciones */}
              {mostrarNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 text-xs">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between font-semibold text-slate-800">
                    <span>Notificaciones</span>
                    <span className="text-[10px] text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full font-mono">
                      {noLeidas} nuevas
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notificaciones.length === 0 ? (
                      <p className="p-4 text-center text-slate-400">No hay notificaciones recientes.</p>
                    ) : (
                      notificaciones.map((n, i) => (
                        <div key={i} className="p-3 hover:bg-slate-50 transition-colors">
                          <p className="font-semibold text-slate-800">{n.titulo}</p>
                          <p className="text-slate-500 mt-0.5">{n.mensaje}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.fecha}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botón superior Nueva Orden */}
            <Link
              to="/ordenes/nueva"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva orden</span>
            </Link>
          </div>
        </header>

        {/* Cuerpo del Dashboard */}
        <main className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Bienvenida y fecha actual */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-[#0B0D12] tracking-tight">
                Buenas tardes, {user?.nombre?.split(' ')[0] || 'Yahúm'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Sábado 17 de octubre de 2026 · Taller El Fix, Guadalajara
              </p>
            </div>
          </div>

          {/* Tarjetas de Métricas Principales (P4 Figma) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Reparaciones activas</span>
                <Smartphone className="w-4 h-4 text-[#24529F]" />
              </div>
              <div className="text-3xl font-bold text-[#0B0D12]">
                {resumen?.activas ?? ordenes.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">En curso en el taller</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">En espera de pruebas</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-[#0B0D12]">
                {resumen?.pruebas ?? 3}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Listas para verificación</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Reparaciones terminadas</span>
                <CheckCircle2 className="w-4 h-4 text-[#1F8A4C]" />
              </div>
              <div className="text-3xl font-bold text-[#0B0D12]">
                {resumen?.entregadas ?? 48}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Histórico entregado</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Garantías vigentes</span>
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-3xl font-bold text-[#0B0D12]">
                {resumen?.garantias ?? 31}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Protección activa</p>
            </div>
          </div>

          {/* Filtros de Estado tipo Pestañas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h2 className="font-bold text-sm text-[#0B0D12]">Órdenes activas</h2>

              {/* Botones de filtro rápido */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFiltroEstado('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
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

            {/* Tabla de Órdenes */}
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                Cargando registros...
              </div>
            ) : ordenes.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                No hay órdenes de reparación activas registradas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-mono text-slate-400 uppercase">
                      <th className="py-3 px-4 font-semibold">Folio</th>
                      <th className="py-3 px-4 font-semibold">Cliente</th>
                      <th className="py-3 px-4 font-semibold">Dispositivo</th>
                      <th className="py-3 px-4 font-semibold">Estado</th>
                      <th className="py-3 px-4 font-semibold">Recepción</th>
                      <th className="py-3 px-4 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ordenes.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B0D12]">
                          {ord.folio}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {ord.cliente || 'Cliente General'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {ord.marca} {ord.modelo}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-[#24529F] border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#24529F]" />
                            {ord.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {ord.fecha_recepcion || '17 oct 2026'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/ordenes/${ord.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0D1B3E] hover:text-white text-slate-700 text-xs font-semibold transition-all"
                          >
                            <span>Abrir</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}