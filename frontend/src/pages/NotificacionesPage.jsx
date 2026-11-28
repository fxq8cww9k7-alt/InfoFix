/**
 * @file NotificacionesPage.jsx
 * @description Vista completa de notificaciones del taller (P5) con filtros por categoría,
 *              agrupación cronológica (Hoy, Ayer, Esta semana) y marcado de lectura.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import NotificacionesDropdown from '../components/notificaciones/NotificacionesDropdown';
import {
  obtenerTituloNotificacion,
  formatearTiempoNotificacion,
  agruparNotificacionesPorFecha,
} from '../components/notificaciones/notificacionesUtils';
import {
  Wrench,
  Home,
  ClipboardList,
  Plus,
  Users,
  Smartphone,
  FileCheck,
  Search,
  LogOut,
  Clock,
  ShieldAlert,
  Mail,
  Send,
  FileText,
  Bell,
} from 'lucide-react';

const TABS_FILTRO = [
  { key: 'todas', label: 'Todas' },
  { key: 'no_leidas', label: 'No leídas' },
  { key: 'ordenes', label: 'Órdenes' },
  { key: 'garantias', label: 'Garantías' },
  { key: 'cuentas', label: 'Cuentas' },
];

function IconoNotificacionCard({ tipo }) {
  if (tipo === 'orden_detenida') {
    return (
      <div className="w-9 h-9 rounded-full bg-[#FBF1DE] text-[#B7791F] flex items-center justify-center shrink-0">
        <Clock className="w-4 h-4" />
      </div>
    );
  }
  if (tipo === 'garantia_por_vencer') {
    return (
      <div className="w-9 h-9 rounded-full bg-[#FBE7E8] text-[#C2363B] flex items-center justify-center shrink-0">
        <ShieldAlert className="w-4 h-4" />
      </div>
    );
  }
  if (tipo === 'correo_no_entregado') {
    return (
      <div className="w-9 h-9 rounded-full bg-[#FBE7E8] text-[#C2363B] flex items-center justify-center shrink-0">
        <Mail className="w-4 h-4" />
      </div>
    );
  }
  if (tipo === 'aviso_enviado') {
    return (
      <div className="w-9 h-9 rounded-full bg-[#E1ECF8] text-[#2452BF] flex items-center justify-center shrink-0">
        <Send className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
      <FileText className="w-4 h-4" />
    </div>
  );
}

export default function NotificacionesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [resumenActivas, setResumenActivas] = useState(0);
  const [filtroTab, setFiltroTab] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const [notifData, ordData] = await Promise.all([
          apiRequest('/api/notificaciones'),
          apiRequest('/api/ordenes?por_pagina=1').catch(() => ({ resumen: { activas: 0 } })),
        ]);
        if (cancelado) return;
        setNotificaciones(notifData.notificaciones || []);
        setNoLeidas(notifData.no_leidas ?? 0);
        setResumenActivas(ordData.resumen?.activas ?? 0);
        setAhoraMs(Date.now());
      } catch (err) {
        if (!cancelado) {
          setError(err.message || 'No se pudieron cargar las notificaciones.');
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    void cargar();
    return () => {
      cancelado = true;
    };
  }, []);

  const marcarTodasLeidas = async () => {
    try {
      const data = await apiRequest('/api/notificaciones/leer', { method: 'POST', body: {} });
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas ?? 0);
    } catch {
      // Silencioso
    }
  };

  const marcarUnaLeida = async (id) => {
    try {
      const data = await apiRequest('/api/notificaciones/leer', {
        method: 'POST',
        body: { ids: [id] },
      });
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas ?? 0);
    } catch {
      // Silencioso
    }
  };

  const termino = busqueda.trim().toLowerCase();
  const porBusqueda = termino
    ? notificaciones.filter((n) =>
        [n.mensaje, n.folio, obtenerTituloNotificacion(n)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(termino))
      )
    : notificaciones;

  const conteos = {
    todas: porBusqueda.length,
    no_leidas: porBusqueda.filter((n) => !n.leida).length,
    ordenes: porBusqueda.filter((n) => n.categoria === 'ordenes').length,
    garantias: porBusqueda.filter((n) => n.categoria === 'garantias').length,
    cuentas: porBusqueda.filter((n) => n.categoria === 'cuentas').length,
  };

  const filtradas = porBusqueda.filter((n) => {
    if (filtroTab === 'no_leidas') return !n.leida;
    if (filtroTab === 'ordenes' || filtroTab === 'garantias' || filtroTab === 'cuentas') {
      return n.categoria === filtroTab;
    }
    return true;
  });

  const grupos = agruparNotificacionesPorFecha(filtradas, ahoraMs);

  const nombreUsuario = user?.nombre || user?.email || 'Personal del taller';
  const rolUsuario = user?.email || 'Personal del taller';
  const inicialesUsuario =
    nombreUsuario
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'IF';

  const menuTaller = [
    { label: 'Inicio', icon: Home, path: '/dashboard', activo: false },
    {
      label: 'Órdenes',
      icon: ClipboardList,
      path: '/ordenes',
      badge: resumenActivas > 0 ? resumenActivas : null,
    },
    { label: 'Nueva orden', icon: Plus, path: '/ordenes/nueva' },
  ];

  const menuRegistros = [
    { label: 'Clientes', icon: Users, path: '/clientes' },
    { label: 'Dispositivos', icon: Smartphone, path: '/dispositivos' },
    { label: 'Certificados', icon: FileCheck, path: '/certificados' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0A0D12] flex flex-col lg:flex-row font-sans">
      {/* SIDEBAR LATERAL IZQUIERDO */}
      <aside className="w-full lg:w-64 bg-[#0D1B3E] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          <Link to="/dashboard" className="p-6 flex items-center gap-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-[#2452BF] flex items-center justify-center text-white shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">InfoFIX</span>
          </Link>

          <div className="p-4 space-y-6">
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
                TALLER
              </p>
              {menuTaller.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      item.activo
                        ? 'bg-[#24529F] text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-mono font-bold">
                        {item.badge}
                      </span>
                    ) : null}
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

        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#24529F] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
              {inicialesUsuario}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate" title={nombreUsuario}>
                {nombreUsuario}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{rolUsuario}</p>
            </div>
          </div>
          <button
            type="button"
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

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-20 gap-4">
          <div className="text-xs font-medium text-slate-500 truncate">
            Panel / <span className="text-slate-800 font-semibold">Notificaciones</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative hidden sm:block w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por folio, cliente, teléfono o IMEI"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#2452BF] focus:bg-white transition-all"
              />
            </div>
            <NotificacionesDropdown />
          </div>
        </header>

        {/* Cuerpo */}
        <main className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
          {/* Título y botón */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0B0D12] tracking-tight">Notificaciones</h1>
              <p className="text-xs text-slate-500 mt-1">
                {noLeidas} sin leer · avisos del taller y de tus órdenes
              </p>
            </div>

            <button
              type="button"
              onClick={marcarTodasLeidas}
              disabled={noLeidas === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B0D12] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
            >
              Marcar todas como leídas
            </button>
          </div>

          {/* Tabs de categoría */}
          <div className="flex items-center gap-2 flex-wrap">
            {TABS_FILTRO.map((tab) => {
              const activo = filtroTab === tab.key;
              const cantidad = conteos[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFiltroTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activo
                      ? 'bg-[#0D1B3E] text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      activo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cantidad}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lista agrupada cronológicamente */}
          {error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-xs text-rose-700 font-medium">
              {error}
            </div>
          ) : loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400 font-mono shadow-sm">
              Cargando notificaciones...
            </div>
          ) : grupos.length === 0 ? (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm py-16 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#E1ECF8]/70 text-[#12204A] flex items-center justify-center mb-4">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0B0D12]">
                No hay notificaciones en esta vista
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm">
                Cuando haya órdenes detenidas, garantías por vencer o avisos enviados aparecerán aquí.
              </p>
            </section>
          ) : (
            <div className="space-y-6">
              {grupos.map((grupo) => (
                <section key={grupo.key} className="space-y-2.5">
                  <h2 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    {grupo.titulo}
                  </h2>

                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
                    {grupo.items.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.leida) void marcarUnaLeida(n.id);
                        }}
                        className={`p-4 sm:px-5 flex items-start gap-3.5 transition-colors ${
                          !n.leida ? 'bg-[#F4F8FE]' : 'bg-white'
                        }`}
                      >
                        <IconoNotificacionCard tipo={n.tipo} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-[#0B0D12]">
                              {obtenerTituloNotificacion(n)}
                            </p>
                            {!n.leida ? (
                              <span className="w-2 h-2 rounded-full bg-[#2452BF] shrink-0 mt-1.5" />
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {n.mensaje}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                            <span className="text-slate-400">
                              {formatearTiempoNotificacion(n.fecha, ahoraMs)}
                            </span>
                            {n.orden_id ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!n.leida) void marcarUnaLeida(n.id);
                                  navigate(`/ordenes/${n.orden_id}`);
                                }}
                                className="font-semibold text-[#12204A] hover:text-[#2452BF] transition-colors"
                              >
                                Ver orden
                              </button>
                            ) : n.cliente_id ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!n.leida) void marcarUnaLeida(n.id);
                                  navigate('/dashboard');
                                }}
                                className="font-semibold text-[#12204A] hover:text-[#2452BF] transition-colors"
                              >
                                Ver cliente
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
