/**
 * @file ClientesPage.jsx
 * @description Catálogo de clientes del taller con búsqueda, ordenamiento, ficha detallada y edición de contacto.
 * @task T09 (RF-02)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import TallerSidebar from '../components/TallerSidebar';
import {
  Search,
  Users,
  Phone,
  Mail,
  Smartphone,
  X,
  Edit3,
  Check,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

/**
 * Formatea una fecha ISO a formato corto en español (ej. "24 nov 2026").
 *
 * @param {string|null} [fecha] Fecha ISO de la API.
 * @returns {string} Fecha legible o guion largo si no hay dato.
 */
function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha)
    .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '');
}

/**
 * Vista de gestión y consulta del directorio de clientes del taller (RF-02).
 *
 * @returns {JSX.Element} Pantalla de listado, ficha lateral y edición de clientes.
 */
export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('nombre');

  // Estado para la ficha detallada del cliente seleccionado
  const [ficha, setFicha] = useState(null);
  const [cargandoFicha, setCargandoFicha] = useState(false);

  // Estado para edición inline de contacto (PATCH /api/clientes/:id)
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState({ nombre_completo: '', telefono: '', email: '' });
  const [guardando, setGuardando] = useState(false);
  const [errorEdit, setErrorEdit] = useState('');

  /**
   * Obtiene el listado de clientes aplicando búsqueda y criterio de ordenamiento.
   *
   * @param {string} [terminoOverride] Texto opcional para sobreescribir el estado de búsqueda.
   * @returns {Promise<void>}
   */
  const cargarClientes = async (terminoOverride) => {
    try {
      setLoading(true);
      const q = (terminoOverride !== undefined ? terminoOverride : busqueda).trim();
      const params = new URLSearchParams({ orden });
      if (q) params.append('q', q);

      const data = await apiRequest(`/api/clientes?${params.toString()}`);
      setClientes(data.clientes || []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, [orden]);

  /**
   * Consulta la ficha completa de un cliente (indicadores, equipos y órdenes recientes).
   *
   * @param {number} clienteId Identificador único del cliente.
   * @returns {Promise<void>}
   */
  const abrirFicha = async (clienteId) => {
    try {
      setCargandoFicha(true);
      setEditando(false);
      setErrorEdit('');
      const data = await apiRequest(`/api/clientes/${clienteId}`);
      setFicha(data);
      setFormEdit({
        nombre_completo: data.cliente.nombre_completo || '',
        telefono: data.cliente.telefono || '',
        email: data.cliente.email || '',
      });
    } catch (err) {
      console.error('Error al cargar ficha del cliente:', err);
    } finally {
      setCargandoFicha(false);
    }
  };

  /**
   * Guarda los cambios de contacto del cliente validando el teléfono de 10 dígitos (RF-02).
   *
   * @param {React.FormEvent<HTMLFormElement>} e Evento de envío del formulario.
   * @returns {Promise<void>}
   */
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!ficha?.cliente?.id) return;

    if (!formEdit.nombre_completo.trim()) {
      setErrorEdit('El nombre completo es obligatorio.');
      return;
    }

    const telLimpio = formEdit.telefono.replace(/\D/g, '');
    if (telLimpio.length !== 10) {
      setErrorEdit('El teléfono debe contener exactamente 10 dígitos.');
      return;
    }

    const emailTrim = formEdit.email.trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setErrorEdit('Ingresa un correo electrónico válido o déjalo vacío.');
      return;
    }

    try {
      setGuardando(true);
      setErrorEdit('');
      const res = await apiRequest(`/api/clientes/${ficha.cliente.id}`, {
        method: 'PATCH',
        body: {
          nombre_completo: formEdit.nombre_completo.trim(),
          telefono: telLimpio,
          email: formEdit.email.trim(),
        },
      });
      setFicha((prev) => ({ ...prev, cliente: res.cliente }));
      setEditando(false);
      cargarClientes();
    } catch (err) {
      setErrorEdit(err.message || 'No se pudo actualizar el cliente.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col lg:flex-row font-sans">
      <TallerSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500">
            <Link
              to="/dashboard"
              className="lg:hidden p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Volver al inicio"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <span>
              Registros / <span className="text-[#0B0D12] font-semibold">Clientes</span>
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              cargarClientes();
            }}
            className="relative w-64 sm:w-80"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o correo"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#24529F] focus:bg-white transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  cargarClientes('');
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
          {/* Encabezado y selector de orden */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0B0D12] tracking-tight">Clientes</h1>
              <p className="text-xs text-slate-500 mt-1">
                Directorio de propietarios registrados, sus equipos y órdenes históricas.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-sm self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setOrden('nombre')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  orden === 'nombre' ? 'bg-[#0D1B3E] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Nombre A–Z
              </button>
              <button
                type="button"
                onClick={() => setOrden('reciente')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  orden === 'reciente' ? 'bg-[#0D1B3E] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Visita reciente
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Tabla de clientes */}
            <div className="flex-1 min-w-0 w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 font-mono">
                  Cargando clientes...
                </div>
              ) : clientes.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-sm text-[#0B0D12]">No se encontraron clientes</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Los clientes se registran automáticamente al crear una nueva orden.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 font-semibold">CLIENTE</th>
                        <th className="py-3 px-4 font-semibold">TELÉFONO</th>
                        <th className="py-3 px-4 font-semibold">ÓRDENES</th>
                        <th className="py-3 px-4 font-semibold">ÚLTIMA VISITA</th>
                        <th className="py-3 px-4 font-semibold text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientes.map((c) => {
                        const seleccionado = ficha?.cliente?.id === c.id;
                        return (
                          <tr
                            key={c.id}
                            className={`transition-colors ${
                              seleccionado ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3 px-4 whitespace-nowrap">
                              <p className="font-semibold text-slate-900">{c.nombre_completo}</p>
                              <p className="text-[11px] text-slate-400">{c.email || 'Sin correo'}</p>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                              {c.telefono}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold text-[11px]">
                                {c.num_ordenes ?? 0}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {formatearFecha(c.ultima_visita)}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => abrirFicha(c.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                              >
                                Ver ficha
                                <ChevronRight className="w-3.5 h-3.5" />
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

            {/* Ficha lateral del cliente */}
            {(cargandoFicha || ficha) && (
              <div className="w-full lg:w-96 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                {cargandoFicha ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-mono">
                    Cargando ficha...
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="font-bold text-base text-[#0B0D12]">
                          {ficha.cliente.nombre_completo}
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          Registrado el {formatearFecha(ficha.cliente.fecha_registro)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(!editando);
                            setErrorEdit('');
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#24529F] cursor-pointer"
                          title="Editar contacto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFicha(null)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Cerrar ficha"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Contacto o formulario de edición */}
                    {editando ? (
                      <form noValidate onSubmit={handleGuardarEdicion} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Nombre completo
                          </label>
                          <input
                            type="text"
                            required
                            value={formEdit.nombre_completo}
                            onChange={(e) =>
                              setFormEdit({ ...formEdit, nombre_completo: e.target.value })
                            }
                            className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#24529F]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Teléfono (10 dígitos)
                          </label>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={formEdit.telefono}
                            onChange={(e) => setFormEdit({ ...formEdit, telefono: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#24529F]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Correo electrónico (opcional)
                          </label>
                          <input
                            type="email"
                            value={formEdit.email}
                            onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#24529F]"
                          />
                        </div>
                        {errorEdit && (
                          <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-medium">
                            {errorEdit}
                          </div>
                        )}
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditando(false)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={guardando}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0D1B3E] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {guardando ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono font-medium text-slate-800">
                            {ficha.cliente.telefono}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ficha.cliente.email || 'Sin correo registrado'}</span>
                        </div>
                      </div>
                    )}

                    {/* Indicadores del cliente */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                        <span className="block text-lg font-bold font-mono text-[#0B0D12]">
                          {ficha.resumen?.ordenes ?? 0}
                        </span>
                        <span className="text-[10px] text-slate-500">Órdenes</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                        <span className="block text-lg font-bold font-mono text-[#24529F]">
                          {ficha.resumen?.activas ?? 0}
                        </span>
                        <span className="text-[10px] text-slate-500">Activas</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                        <span className="block text-lg font-bold font-mono text-emerald-600">
                          {ficha.resumen?.garantias_vigentes ?? 0}
                        </span>
                        <span className="text-[10px] text-slate-500">Garantías</span>
                      </div>
                    </div>

                    {/* Equipos del cliente */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-mono uppercase font-bold text-slate-400">
                        Equipos ({ficha.dispositivos?.length ?? 0})
                      </h3>
                      {ficha.dispositivos?.length === 0 ? (
                        <p className="text-xs text-slate-400">Sin dispositivos registrados.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {ficha.dispositivos.map((d) => (
                            <div
                              key={d.id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs"
                            >
                              <Smartphone className="w-4 h-4 text-[#24529F] shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate">
                                  {d.marca} {d.modelo}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 truncate">
                                  {d.imei_o_serie}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Órdenes recientes */}
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-mono uppercase font-bold text-slate-400">
                        Órdenes recientes
                      </h3>
                      {ficha.ordenes_recientes?.length === 0 ? (
                        <p className="text-xs text-slate-400">Sin órdenes registradas.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {ficha.ordenes_recientes.map((o) => (
                            <Link
                              key={o.id}
                              to={`/ordenes/${o.id}`}
                              className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 bg-white flex items-center justify-between text-xs transition-colors"
                            >
                              <div>
                                <p className="font-mono font-bold text-[#0B0D12]">{o.folio}</p>
                                <p className="text-[11px] text-slate-500">
                                  {o.marca} {o.modelo}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {o.estado}
                              </span>
                            </Link>
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