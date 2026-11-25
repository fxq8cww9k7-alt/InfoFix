/**
 * @file OrdenesPage.jsx
 * @description Listado completo de órdenes de reparación (activas y entregadas) con filtros por etapa y búsqueda.
 * @task T14 (RF-13, RF-14)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import TallerSidebar from '../components/TallerSidebar';
import { Search, Plus, FileText, X } from 'lucide-react';

const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];

/**
 * Devuelve las clases Tailwind de color para la etiqueta y el indicador de cada estado.
 *
 * @param {string} estado Estado actual de la orden de reparación.
 * @returns {{ box: string, dot: string }} Clases CSS para el badge y su punto indicador.
 */
function obtenerEstiloEstado(estado) {
  if (estado === 'Reparación') {
    return { box: 'bg-blue-50 text-[#1D4ED8] border-blue-200', dot: 'bg-[#1D4ED8]' };
  }
  if (estado === 'Diagnóstico') {
    return { box: 'bg-sky-50 text-[#0284C7] border-sky-200', dot: 'bg-[#0284C7]' };
  }
  if (estado === 'Pruebas') {
    return { box: 'bg-[#0D1B3E] text-white border-[#0D1B3E]', dot: 'bg-white' };
  }
  if (estado === 'Entregado') {
    return { box: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600' };
  }
  return { box: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-700' };
}

/**
 * Formatea una fecha ISO en formato corto legible en español (ej. "24 nov 2026").
 *
 * @param {string} [fecha] Fecha en formato ISO proveniente de la API.
 * @returns {string} Fecha formateada o guion largo si no existe.
 */
function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha)
    .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '');
}

/**
 * Pantalla del listado completo de órdenes del taller (activas e históricas).
 *
 * @returns {JSX.Element} Vista de tabla de órdenes con barra de búsqueda y filtro por estados.
 */
export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [avisoBusqueda, setAvisoBusqueda] = useState('');

  /**
   * Consulta las órdenes en el backend aplicando el filtro de estado y el término de búsqueda.
   *
   * @param {string} [terminoOverride] Término opcional para forzar una búsqueda específica (ej. al limpiar).
   * @returns {Promise<void>}
   */
  const cargarOrdenes = async (terminoOverride) => {
    try {
      setLoading(true);
      const termino = (terminoOverride !== undefined ? terminoOverride : busqueda).trim();
      const params = new URLSearchParams();

      if (filtroEstado) params.append('estado', filtroEstado);
      if (termino.length >= 3) params.append('q', termino);

      const data = await apiRequest(`/api/ordenes?${params.toString()}`);
      setOrdenes(data.ordenes || []);
      if (data.resumen) setResumen(data.resumen);
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, [filtroEstado]);

  /**
   * Valida la longitud mínima de 3 caracteres exigida por RF-14 antes de ejecutar la búsqueda.
   *
   * @param {React.FormEvent<HTMLFormElement>} e Evento de envío del formulario.
   * @returns {void}
   */
  const handleBusqueda = (e) => {
    e.preventDefault();
    const termino = busqueda.trim();

    if (termino.length > 0 && termino.length < 3) {
      setAvisoBusqueda('Ingresa al menos 3 caracteres para buscar.');
      return;
    }

    setAvisoBusqueda('');
    cargarOrdenes(termino);
  };

  /**
   * Limpia los filtros de búsqueda y estado para restaurar la lista general (RF-14).
   *
   * @returns {void}
   */
  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setAvisoBusqueda('');
    if (filtroEstado !== '') {
      setFiltroEstado('');
    } else {
      cargarOrdenes('');
    }
  };

  const hayFiltrosActivos = Boolean(filtroEstado || busqueda.trim());

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col lg:flex-row font-sans">
      <TallerSidebar ordenesActivas={resumen?.activas} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-sm sticky top-0 z-20">
          <div className="text-xs font-medium text-slate-500">
            Taller / <span className="text-[#0B0D12] font-semibold">Órdenes</span>
          </div>

          <div className="flex flex-col items-end">
            <form onSubmit={handleBusqueda} className="relative w-64 sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente, teléfono o IMEI"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  if (avisoBusqueda) setAvisoBusqueda('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#24529F] focus:bg-white transition-all"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={handleLimpiarFiltros}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
            {avisoBusqueda && (
              <span className="text-[10px] text-amber-600 mt-1">{avisoBusqueda}</span>
            )}
          </div>
        </header>

        <main className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Título y botón de alta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0B0D12] tracking-tight">Todas las órdenes</h1>
              <p className="text-xs text-slate-500 mt-1">
                Consulta y filtra reparaciones activas e históricas del taller.
              </p>
            </div>
            <Link
              to="/ordenes/nueva"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold transition-all shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva orden</span>
            </Link>
          </div>

          {/* Panel de filtros y tabla */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 flex-wrap pb-3 border-b border-slate-100">
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
              {ESTADOS.map((est) => (
                <button
                  type="button"
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    filtroEstado === est
                      ? 'bg-[#0D1B3E] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {est}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                Cargando órdenes...
              </div>
            ) : ordenes.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm text-[#0B0D12]">
                  {hayFiltrosActivos
                    ? 'No se encontraron órdenes de reparación que coincidan con el criterio ingresado'
                    : 'No hay órdenes registradas'}
                </p>
                {hayFiltrosActivos && (
                  <button
                    type="button"
                    onClick={handleLimpiarFiltros}
                    className="mt-4 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">FOLIO</th>
                      <th className="py-3 px-4 font-semibold">CLIENTE</th>
                      <th className="py-3 px-4 font-semibold">DISPOSITIVO</th>
                      <th className="py-3 px-4 font-semibold">ESTADO</th>
                      <th className="py-3 px-4 font-semibold">RECEPCIÓN</th>
                      <th className="py-3 px-4 font-semibold text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ordenes.map((ord) => {
                      const estilo = obtenerEstiloEstado(ord.estado);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#0B0D12] whitespace-nowrap">
                            {ord.folio}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="font-semibold text-slate-900">
                              {ord.cliente || ord.nombre_cliente || 'Cliente General'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {ord.telefono || ord.telefono_cliente || '—'}
                            </p>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="font-medium text-slate-800">
                              {ord.marca} {ord.modelo}
                            </p>
                            <p className="text-[11px] text-slate-400 capitalize">
                              {ord.tipo || 'Celular'}
                            </p>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${estilo.box}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot}`} />
                              {ord.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatearFecha(ord.fecha_recepcion)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
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
        </main>
      </div>
    </div>
  );
}