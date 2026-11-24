/**
 * @file DashboardPage.jsx
 * @description Panel principal del taller (Inicio / Dashboard P4) 
 * @task T14 (RF-13, RF-14)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import TallerSidebar from '../components/TallerSidebar';
import {
  Plus,
  FileText,
  Clock,
  Check,
  ShieldCheck,
  Search,
  Tag,
} from 'lucide-react';

const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];

/**
 * Devuelve la fecha actual formateada en español para el encabezado del panel.
 *
 * @returns {string} Fecha legible (ej. "Martes 24 de noviembre de 2026").
 */
function obtenerFechaFormateada() {
  const hoy = new Date();
  const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const fechaStr = hoy.toLocaleDateString('es-MX', opciones).replace(',', '');
  return fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
}

/**
 * Devuelve el saludo correspondiente según la hora local del equipo.
 *
 * @returns {string} "Buenos días", "Buenas tardes" o "Buenas noches".
 */
function obtenerSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Vista principal del panel interno del taller (RF-13 y RF-14).
 *
 * @returns {JSX.Element} Dashboard con métricas, tabla de órdenes activas y progreso por etapas.
 */
export default function DashboardPage() {
  const { user } = useAuth();

  const [ordenes, setOrdenes] = useState([]);
  const [todasOrdenes, setTodasOrdenes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  /**
   * Consulta el listado de órdenes y sus contadores operativos aplicando los filtros activos.
   *
   * @returns {Promise<void>}
   */
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

      // Conserva el catálogo sin filtros para que el widget de etapas mantenga los totales globales
      if (!filtroEstado && !busqueda.trim()) {
        setTodasOrdenes(data.ordenes || []);
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

  useEffect(() => {
    if (todasOrdenes.length === 0 && !filtroEstado && !busqueda.trim() && ordenes.length > 0) {
      setTodasOrdenes(ordenes);
    }
  }, [ordenes]);

  /**
   * Ejecuta la búsqueda por folio, cliente, teléfono o IMEI/serie al enviar el formulario.
   *
   * @param {React.FormEvent<HTMLFormElement>} e Evento de envío del formulario.
   * @returns {void}
   */
  const handleBusquedaSubmit = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const nombreUsuario = user?.nombre
    ? user.nombre.split(' ')[0]
    : user?.email
      ? user.email.split('@')[0]
      : '';

  const tituloBienvenida =
    ordenes.length === 0
      ? `Bienvenido${nombreUsuario ? `, ${nombreUsuario}` : ''}`
      : `${obtenerSaludo()}${nombreUsuario ? `, ${nombreUsuario}` : ''}`;

  // Conteo por etapa para el widget lateral usando el catálogo global si hay un filtro activo
  const listaParaEtapas = todasOrdenes.length > 0 ? todasOrdenes : ordenes;
  const etapasCount = {
    Recibido: listaParaEtapas.filter((o) => o.estado === 'Recibido').length,
    Diagnóstico: listaParaEtapas.filter((o) => o.estado === 'Diagnóstico').length,
    Reparación: listaParaEtapas.filter((o) => o.estado === 'Reparación').length,
    Pruebas: listaParaEtapas.filter((o) => o.estado === 'Pruebas').length,
  };
  const totalActivas = (resumen?.activas ?? listaParaEtapas.length) || 1;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col lg:flex-row font-sans">
      {/* Sidebar compartido */}
      <TallerSidebar ordenesActivas={resumen?.activas} />

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior de navegación */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-20">
          <div className="text-xs font-medium text-slate-500">
            Resumen de órdenes
          </div>

          {/* Buscador superior (RF-14) */}
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
                  to="/clientes"
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

          {/* ================= TARJETAS DE MÉTRICAS (RF-13) ================= */}
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
            {/* COLUMNA IZQUIERDA: Tabla de Órdenes Activas */}
            <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <h2 className="font-bold text-sm text-[#0B0D12] shrink-0">Órdenes activas</h2>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFiltroEstado('')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      filtroEstado === ''
                        ? 'bg-[#0D1B3E] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas
                  </button>
                  {ESTADOS.slice(0, 4).map((est) => (
                    <button
                      type="button"
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
                filtroEstado ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-[#0B0D12]">
                      No hay órdenes en la etapa &ldquo;{filtroEstado}&rdquo;
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 mb-5 max-w-sm">
                      Actualmente no hay equipos en este estado de reparación.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFiltroEstado('')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      Ver todas las órdenes
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

            {/* COLUMNA DERECHA: Widget "Equipos por etapas" */}
            <div className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="font-bold text-sm text-[#0B0D12]">Equipos por etapas</h2>

              {(listaParaEtapas.length > 0 || ordenes.length > 0) && (
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