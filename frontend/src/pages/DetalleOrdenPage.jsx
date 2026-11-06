import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import {
  Wrench,
  ArrowLeft,
  Smartphone,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  Layers,
  ShieldCheck,
  Send,
  ExternalLink,
  Printer,
  ChevronRight,
  Plus,
  Trash2,
  FileText,
  Lock,
} from 'lucide-react';

export default function DetalleOrdenPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fotoDespuesRef = useRef(null);

  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accionLoading, setAccionLoading] = useState(false);

  // Modales y formularios auxiliares
  const [modalAvanzar, setModalAvanzar] = useState(false);
  const [notaAvance, setNotaAvance] = useState('');
  
  const [modalRefaccion, setModalRefaccion] = useState(false);
  const [refaccionData, setRefaccionData] = useState({ nombre: '', tipo: 'original', numero_serie: '' });

  const [modalGarantia, setModalGarantia] = useState(false);
  const [garantiaData, setGarantiaData] = useState({ dias_garantia: 30, terminos_garantia: 'Garantía sobre mano de obra y refacciones sustituidas. No cubre daños por humedad o caídas posteriores.' });

  const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];

  const cargarOrden = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/api/ordenes/${id}`);
      setOrden(res.orden);
      if (res.orden.dias_garantia) {
        setGarantiaData({
          dias_garantia: res.orden.dias_garantia,
          terminos_garantia: res.orden.terminos_garantia || '',
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOrden();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono text-slate-400">Cargando expediente #{id}...</span>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Error al cargar la orden</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'La orden no existe'}</p>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const indexActual = ESTADOS.indexOf(orden.estado);
  const siguienteEstado = indexActual >= 0 && indexActual < ESTADOS.length - 1 ? ESTADOS[indexActual + 1] : null;
  const ordenBloqueada = orden.estado === 'Entregado';

  // Manejador para avanzar de estado
  const handleAvanzarEstado = async (e) => {
    e.preventDefault();
    if (!siguienteEstado) return;
    setAccionLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/ordenes/${orden.id}/estado`, {
        method: 'PATCH',
        body: { estado: siguienteEstado, nota: notaAvance },
      });
      setModalAvanzar(false);
      setNotaAvance('');
      await cargarOrden();
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionLoading(false);
    }
  };

  // Manejador para agregar refacción
  const handleAgregarRefaccion = async (e) => {
    e.preventDefault();
    setAccionLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/ordenes/${orden.id}/refacciones`, {
        method: 'POST',
        body: refaccionData,
      });
      setModalRefaccion(false);
      setRefaccionData({ nombre: '', tipo: 'original', numero_serie: '' });
      await cargarOrden();
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionLoading(false);
    }
  };

  const handleEliminarRefaccion = async (refId) => {
    if (!confirm('¿Eliminar esta refacción de la orden?')) return;
    try {
      await apiRequest(`/api/ordenes/${orden.id}/refacciones/${refId}`, { method: 'DELETE' });
      await cargarOrden();
    } catch (err) {
      alert(err.message);
    }
  };

  // Subir fotos de "después"
  const handleSubirFotosDespues = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setAccionLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('tipo', 'despues');
      for (const f of files) formData.append('fotos', f);
      await apiRequest(`/api/ordenes/${orden.id}/evidencias`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      await cargarOrden();
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionLoading(false);
    }
  };

  // Guardar garantía
  const handleGuardarGarantia = async (e) => {
    e.preventDefault();
    setAccionLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/ordenes/${orden.id}/garantia`, {
        method: 'PUT',
        body: {
          dias_garantia: Number(garantiaData.dias_garantia),
          terminos_garantia: garantiaData.terminos_garantia,
        },
      });
      setModalGarantia(false);
      await cargarOrden();
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Cabecera Técnica */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Volver al panel"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400 font-mono tracking-wider">
                  {orden.folio}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                    ordenBloqueada
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                      : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60'
                  }`}
                >
                  {orden.estado.toUpperCase()}
                </span>
              </div>
              <h1 className="text-sm font-semibold text-slate-200">
                {orden.marca} {orden.modelo} • {orden.cliente}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {orden.token_estatus && (
              <Link
                to={`/estatus/${orden.token_estatus}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Portal QR</span>
              </Link>
            )}

            {ordenBloqueada && orden.token_uuid && (
              <Link
                to={`/verificar/${orden.token_uuid}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold font-mono transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Certificado</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Barra de la Máquina de Estados (Lineal e Inmutable) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500">MÁQUINA DE ESTADOS (RF-06)</span>
              <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                <span>Flujo de Trazabilidad:</span>
                <span className="text-cyan-400 font-mono">{orden.estado}</span>
              </div>
            </div>

            {/* Botón de Acción Principal */}
            {!ordenBloqueada && siguienteEstado && (
              <button
                onClick={() => setModalAvanzar(true)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98] flex items-center gap-2"
              >
                <span>Avanzar a {siguienteEstado}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {ordenBloqueada && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-400">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Orden entregada y bloqueada para auditoría</span>
              </div>
            )}
          </div>

          {/* Stepper visual */}
          <div className="grid grid-cols-5 gap-2 pt-6">
            {ESTADOS.map((est, idx) => {
              const completado = idx <= indexActual;
              const activo = idx === indexActual;
              return (
                <div key={est} className="text-center">
                  <div
                    className={`h-2 rounded-full mb-2 transition-all ${
                      completado ? (activo ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400') : 'bg-slate-800'
                    }`}
                  />
                  <span
                    className={`text-[10px] sm:text-xs font-mono font-medium block truncate ${
                      activo ? 'text-cyan-400 font-bold' : completado ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {est}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Advertencia de pendientes si está en Pruebas */}
          {orden.estado === 'Pruebas' && orden.pendientes_entrega && orden.pendientes_entrega.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <div className="font-bold flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Requisitos pendientes para poder Entregar y emitir Certificado:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                {orden.pendientes_entrega.map((pend, i) => (
                  <li key={i}>{pend}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Rejilla de Información: Equipo, Cliente y Falla */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta Dispositivo */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase pb-2 border-b border-slate-800">
              <Smartphone className="w-4 h-4" />
              <span>Dispositivo</span>
            </div>
            <div>
              <div className="text-base font-bold text-white">
                {orden.marca} {orden.modelo}
              </div>
              <div className="text-xs text-slate-400 capitalize">
                {orden.tipo} {orden.color ? `• Color: ${orden.color}` : ''}
              </div>
            </div>
            <div className="text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] uppercase text-slate-500 block">IMEI / SERIE</span>
              <span className="text-slate-200">{orden.imei_o_serie}</span>
            </div>
            {orden.contrasena_equipo && (
              <div className="text-xs font-mono text-slate-400">
                <span className="text-[10px] uppercase text-slate-500 block">PIN / DESBLOQUEO</span>
                <span className="text-amber-400 font-bold">{orden.contrasena_equipo}</span>
              </div>
            )}
          </div>

          {/* Tarjeta Cliente */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase pb-2 border-b border-slate-800">
              <User className="w-4 h-4" />
              <span>Cliente</span>
            </div>
            <div>
              <div className="text-base font-bold text-white">{orden.cliente}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{orden.telefono}</div>
            </div>
            {orden.email && (
              <div className="text-xs text-slate-400 font-mono">
                <span className="text-[10px] uppercase text-slate-500 block">CORREO</span>
                <span className="text-slate-300">{orden.email}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
              Recepción: {new Date(orden.fecha_recepcion).toLocaleString('es-MX')}
            </div>
          </div>

          {/* Diagnóstico Inicial */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase pb-2 border-b border-slate-800">
              <FileText className="w-4 h-4" />
              <span>Falla & Condición</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">FALLA REPORTADA</span>
              <p className="text-xs text-slate-200 mt-0.5">{orden.falla_reportada}</p>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">CONDICIÓN FÍSICA</span>
              <p className="text-xs text-slate-400 mt-0.5">{orden.condicion_fisica}</p>
            </div>
            {orden.accesorios && (
              <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">ACCESORIOS</span>
                <span>{orden.accesorios}</span>
              </div>
            )}
          </div>
        </div>

        {/* Refacciones Utilizadas y Garantía */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Refacciones */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-cyan-400">
                <Layers className="w-4 h-4" />
                <span>Refacciones Utilizadas ({orden.refacciones?.length || 0})</span>
              </div>
              {!ordenBloqueada && (orden.estado === 'Diagnóstico' || orden.estado === 'Reparación') && (
                <button
                  onClick={() => setModalRefaccion(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs rounded-lg flex items-center gap-1 font-mono transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              )}
            </div>

            {orden.refacciones?.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-slate-500">
                No se han registrado refacciones en esta orden.
              </div>
            ) : (
              <div className="space-y-2">
                {orden.refacciones?.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{ref.nombre}</span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Tipo: <span className="text-cyan-400 capitalize">{ref.tipo}</span>
                        {ref.numero_serie && ` • Serie: ${ref.numero_serie}`}
                      </div>
                    </div>
                    {!ordenBloqueada && (orden.estado === 'Diagnóstico' || orden.estado === 'Reparación') && (
                      <button
                        onClick={() => handleEliminarRefaccion(ref.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Eliminar refacción"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Garantía */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Garantía de Servicio (RF-08)</span>
              </div>
              {!ordenBloqueada && (
                <button
                  onClick={() => setModalGarantia(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs rounded-lg font-mono transition-colors"
                >
                  {orden.dias_garantia ? 'Editar' : 'Registrar'}
                </button>
              )}
            </div>

            {orden.dias_garantia ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-mono text-slate-400 uppercase">Cobertura</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {orden.dias_garantia} días naturales
                  </span>
                </div>
                {orden.terminos_garantia && (
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">TÉRMINOS</span>
                    <p className="leading-relaxed">{orden.terminos_garantia}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-mono text-amber-400/90 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                Pendiente: Es obligatorio registrar la garantía antes de pasar la orden a "Entregado".
              </div>
            )}
          </div>
        </div>

        {/* Galería de Evidencias: Antes y Después */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-cyan-400">
              <Camera className="w-4 h-4" />
              <span>Evidencias Fotográficas (Antes / Después)</span>
            </div>
            {!ordenBloqueada && (
              <div>
                <button
                  type="button"
                  onClick={() => fotoDespuesRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Subir Foto "Después"
                </button>
                <input
                  type="file"
                  ref={fotoDespuesRef}
                  onChange={handleSubirFotosDespues}
                  multiple
                  accept="image/jpeg,image/png"
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Antes */}
            <div>
              <span className="text-xs font-mono text-slate-400 block mb-3 font-semibold">
                FOTOS DE RECEPCIÓN (ANTES)
              </span>
              <div className="grid grid-cols-3 gap-3">
                {orden.evidencias?.antes?.map((f, i) => (
                  <a
                    key={i}
                    href={`/uploads/${f}`}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group relative block"
                  >
                    <img
                      src={`/uploads/${f}`}
                      alt={`Antes ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Después */}
            <div>
              <span className="text-xs font-mono text-slate-400 block mb-3 font-semibold">
                FOTOS DE ENTREGA / REPARADO (DESPUÉS)
              </span>
              {orden.evidencias?.despues?.length === 0 ? (
                <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center text-xs font-mono text-slate-500">
                  Aún no se han subido fotos de entrega.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {orden.evidencias?.despues?.map((f, i) => (
                    <a
                      key={i}
                      href={`/uploads/${f}`}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group relative block"
                    >
                      <img
                        src={`/uploads/${f}`}
                        alt={`Después ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Línea de Tiempo / Historial de la Orden */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="text-xs font-mono font-bold uppercase text-slate-400 mb-6 pb-2 border-b border-slate-800">
            Bitácora de Trazabilidad Inmutable (RF-06)
          </div>
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800">
            {orden.historial?.map((h) => (
              <div key={h.id} className="relative flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 z-10 text-cyan-400">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {h.tipo === 'estado' ? `Cambio a: ${h.estado}` : `Acción: ${h.tipo}`}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(h.fecha).toLocaleString('es-MX')}
                    </span>
                  </div>
                  {h.nota && <p className="text-xs text-slate-400 mt-1">{h.nota}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal Avanzar Estado */}
      {modalAvanzar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 font-mono">
              Avanzar a: {siguienteEstado}
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Ingresa la nota de avance para registrar en la bitácora inmutable (mínimo 5 caracteres).
            </p>
            <form onSubmit={handleAvanzarEstado} className="space-y-4">
              <textarea
                required
                rows={3}
                value={notaAvance}
                onChange={(e) => setNotaAvance(e.target.value)}
                placeholder="Ej. Diagnóstico concluido: pantalla rota y flexor suelto..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAvanzar(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={accionLoading || notaAvance.trim().length < 5}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {accionLoading ? 'Guardando...' : 'Confirmar Avance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Refacción */}
      {modalRefaccion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 font-mono">
              Registrar Refacción (RF-07)
            </h3>
            <form onSubmit={handleAgregarRefaccion} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Nombre de la Pieza *</label>
                <input
                  type="text"
                  required
                  value={refaccionData.nombre}
                  onChange={(e) => setRefaccionData({ ...refaccionData, nombre: e.target.value })}
                  placeholder="Ej. Pantalla OLED Samsung S21"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Tipo de Componente</label>
                <select
                  value={refaccionData.tipo}
                  onChange={(e) => setRefaccionData({ ...refaccionData, tipo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="original">Original</option>
                  <option value="compatible">Compatible</option>
                  <option value="reacondicionada">Reacondicionada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Número de Serie (opcional)</label>
                <input
                  type="text"
                  value={refaccionData.numero_serie}
                  onChange={(e) => setRefaccionData({ ...refaccionData, numero_serie: e.target.value })}
                  placeholder="Serie de la pieza"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalRefaccion(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={accionLoading}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {accionLoading ? 'Guardando...' : 'Agregar Refacción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Garantía */}
      {modalGarantia && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 font-mono">
              Términos de Garantía Legal (RF-08)
            </h3>
            <form onSubmit={handleGuardarGarantia} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Días de Cobertura *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={garantiaData.dias_garantia}
                  onChange={(e) => setGarantiaData({ ...garantiaData, dias_garantia: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Términos y Exclusiones</label>
                <textarea
                  rows={3}
                  value={garantiaData.terminos_garantia}
                  onChange={(e) => setGarantiaData({ ...garantiaData, terminos_garantia: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalGarantia(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={accionLoading}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {accionLoading ? 'Guardando...' : 'Guardar Garantía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
