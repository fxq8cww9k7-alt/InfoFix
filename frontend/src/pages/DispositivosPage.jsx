/**
 * @file DispositivosPage.jsx
 * @description Catálogo de dispositivos multiequipo con filtros por tipo y consulta de historial certificado.
 * @task T10 (RF-03, RF-15)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import TallerSidebar from '../components/TallerSidebar';
import {
  Search,
  Smartphone,
  Tablet,
  Laptop,
  Printer,
  Monitor,
  Cpu,
  History,
  X,
  Layers,
  ShieldCheck,
} from 'lucide-react';

const TIPOS = [
  { id: '', label: 'Todos' },
  { id: 'celular', label: 'Celular' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'impresora', label: 'Impresora' },
  { id: 'pc_escritorio', label: 'PC de Escritorio' },
  { id: 'otro', label: 'Otro' },
];

/**
 * Convierte la clave interna del tipo de dispositivo en una etiqueta legible.
 *
 * @param {string} tipo Clave de tipo almacenada en la base de datos.
 * @returns {string} Nombre amigable para mostrar en pantalla.
 */
function formatearTipoDispositivo(tipo) {
  const mapa = {
    celular: 'Celular',
    tablet: 'Tablet',
    laptop: 'Laptop',
    impresora: 'Impresora',
    pc_escritorio: 'PC de Escritorio',
    otro: 'Otro',
  };
  return mapa[tipo] || tipo;
}

/**
 * Devuelve el ícono correspondiente a cada categoría de dispositivo soportada (RF-03).
 *
 * @param {Object} props Propiedades del componente.
 * @param {string} props.tipo Tipo de dispositivo.
 * @returns {JSX.Element} Ícono representativo.
 */
function IconoDispositivo({ tipo }) {
  if (tipo === 'tablet') return <Tablet className="w-4 h-4 text-[#24529F]" />;
  if (tipo === 'laptop') return <Laptop className="w-4 h-4 text-[#24529F]" />;
  if (tipo === 'impresora') return <Printer className="w-4 h-4 text-[#24529F]" />;
  if (tipo === 'pc_escritorio') return <Monitor className="w-4 h-4 text-[#24529F]" />;
  if (tipo === 'otro') return <Cpu className="w-4 h-4 text-[#24529F]" />;
  return <Smartphone className="w-4 h-4 text-[#24529F]" />;
}

/**
 * Formatea una fecha ISO en formato corto legible en español.
 *
 * @param {string|null} [fecha] Fecha ISO proveniente del backend.
 * @returns {string} Fecha formateada o guion largo.
 */
function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha)
    .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '');
}

/**
 * Pantalla del registro de dispositivos e historial de reparaciones certificadas (RF-03 y RF-15).
 *
 * @returns {JSX.Element} Catálogo de dispositivos con panel de expediente histórico.
 */
export default function DispositivosPage() {
  const [dispositivos, setDispositivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Estado del expediente histórico (RF-15)
  const [historial, setHistorial] = useState(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  /**
   * Consulta el listado de dispositivos aplicando búsqueda y filtro por tipo.
   *
   * @param {string} [terminoOverride] Término opcional para forzar una búsqueda específica.
   * @returns {Promise<void>}
   */
  const cargarDispositivos = async (terminoOverride) => {
    try {
      setLoading(true);
      const q = (terminoOverride !== undefined ? terminoOverride : busqueda).trim();
      const params = new URLSearchParams();
      if (tipoFiltro) params.append('tipo', tipoFiltro);
      if (q) params.append('q', q);

      const data = await apiRequest(`/api/dispositivos?${params.toString()}`);
      setDispositivos(data.dispositivos || []);
    } catch (err) {
      console.error('Error al cargar dispositivos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDispositivos();
  }, [tipoFiltro]);

  /**
   * Obtiene el expediente completo y reparaciones certificadas de un equipo (RF-15).
   *
   * @param {number} dispositivoId Identificador único del dispositivo.
   * @returns {Promise<void>}
   */
  const abrirHistorial = async (dispositivoId) => {
    try {
      setCargandoHistorial(true);
      const data = await apiRequest(`/api/dispositivos/${dispositivoId}/historial`);
      setHistorial(data);
    } catch (err) {
      console.error('Error al cargar historial del dispositivo:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col lg:flex-row font-sans">
      <TallerSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-sm sticky top-0 z-20">
          <div className="text-xs font-medium text-slate-500">
            Registros / <span className="text-[#0B0D12] font-semibold">Dispositivos</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              cargarDispositivos();
            }}
            className="relative w-64 sm:w-80"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por IMEI/serie, marca, modelo o dueño"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#24529F] focus:bg-white transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  cargarDispositivos('');
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </header>

        <main className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold text-[#0B0D12] tracking-tight">Dispositivos</h1>
            <p className="text-xs text-slate-500 mt-1">
              Equipos registrados por IMEI o número de serie con su historial de reparaciones certificadas.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Listado principal */}
            <div className="flex-1 min-w-0 w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Filtros por tipo */}
              <div className="flex items-center gap-1.5 flex-wrap pb-3 border-b border-slate-100">
                {TIPOS.map((t) => (
                  <button
                    type="button"
                    key={t.id || 'todos'}
                    onClick={() => setTipoFiltro(t.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      tipoFiltro === t.id
                        ? 'bg-[#0D1B3E] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 font-mono">
                  Cargando dispositivos...
                </div>
              ) : dispositivos.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-sm text-[#0B0D12]">
                    No se encontraron dispositivos
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 font-semibold">EQUIPO</th>
                        <th className="py-3 px-4 font-semibold">IMEI / SERIE</th>
                        <th className="py-3 px-4 font-semibold">PROPIETARIO</th>
                        <th className="py-3 px-4 font-semibold">HISTORIAL</th>
                        <th className="py-3 px-4 font-semibold text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dispositivos.map((d) => {
                        const seleccionado = historial?.dispositivo?.id === d.id;
                        return (
                          <tr
                            key={d.id}
                            className={`transition-colors ${
                              seleccionado ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <IconoDispositivo tipo={d.tipo} />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {d.marca} {d.modelo}
                                  </p>
                                  <p className="text-[11px] text-slate-400 capitalize">
                                    {d.tipo}
                                    {d.color ? ` · ${d.color}` : ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                              {d.imei_o_serie}
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                              {d.propietario}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                                  {d.reparaciones_certificadas ?? 0} cert.
                                </span>
                                {d.orden_activa && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200 text-[10px] font-mono font-semibold">
                                    {d.orden_activa}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => abrirHistorial(d.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                              >
                                <History className="w-3.5 h-3.5" />
                                Historial
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Panel lateral de Historial del Dispositivo (RF-15) */}
            {(cargandoHistorial || historial) && (
              <div className="w-full lg:w-96 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                {cargandoHistorial ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-mono">
                    Consultando historial...
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="font-bold text-base text-[#0B0D12]">
                          {historial.dispositivo.marca} {historial.dispositivo.modelo}
                        </h2>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {historial.dispositivo.imei_o_serie}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Propietario: {historial.propietario?.nombre_completo}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHistorial(null)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Cerrar historial"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Orden activa si existe */}
                    {historial.resumen?.orden_activa && (
                      <Link
                        to={`/ordenes/${historial.resumen.orden_activa.id}`}
                        className="block p-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100/70 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#1D4ED8]">Orden en curso</span>
                          <span className="font-mono font-bold text-[#0D1B3E]">
                            {historial.resumen.orden_activa.folio}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Estado actual: {historial.resumen.orden_activa.estado}
                        </p>
                      </Link>
                    )}

                    {/* Reparaciones certificadas previas (RF-15) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-mono uppercase font-bold text-slate-400">
                          Reparaciones certificadas
                        </h3>
                        <span className="text-[11px] font-mono font-bold text-[#0D1B3E]">
                          {historial.resumen?.reparaciones_certificadas ?? 0}
                        </span>
                      </div>

                      {!historial.reparaciones || historial.reparaciones.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-center">
                          {historial.mensaje ||
                            'Primera reparación certificada registrada para este equipo'}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {historial.reparaciones.map((rep) => (
                            <div
                              key={rep.id}
                              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <Link
                                  to={`/ordenes/${rep.id}`}
                                  className="font-mono font-bold text-[#24529F] hover:underline"
                                >
                                  {rep.folio}
                                </Link>
                                <span className="text-[10px] text-slate-400">
                                  Entrega: {formatearFecha(rep.fecha_entrega)}
                                </span>
                              </div>
                              <p className="text-slate-700 leading-relaxed">
                                {rep.falla_reportada}
                              </p>
                              {rep.refacciones?.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                  <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                                  {rep.refacciones.map((r, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600"
                                    >
                                      {r.nombre} ({r.tipo})
                                    </span>
                                  ))}
                                </div>
                              )}
                              {rep.garantia && (
                                <div className="flex items-center gap-1.5 text-[10px] pt-1">
                                  <ShieldCheck
                                    className={`w-3.5 h-3.5 ${
                                      rep.garantia.vigente ? 'text-emerald-600' : 'text-slate-400'
                                    }`}
                                  />
                                  <span
                                    className={
                                      rep.garantia.vigente
                                        ? 'text-emerald-700 font-semibold'
                                        : 'text-slate-500'
                                    }
                                  >
                                    {rep.garantia.vigente ? 'Garantía vigente' : 'Garantía vencida'}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}