/**
 * @file DetalleOrdenPage.jsx
 * @description Expediente dinámico de la orden de reparación con máquina de estados (RF-06),
 *              evidencias fotográficas (RF-07), refacciones (RF-08), garantía (RF-09) y avisos al cliente (P10).
 * @task T18 (RF-04, RF-06, RF-07, RF-08, RF-09, RF-10)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import TallerSidebar from '../components/TallerSidebar';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  PackagePlus,
  Trash2,
  AlertCircle,
  Camera,
  Send,
  Printer,
  ExternalLink,
  X,
  Lock,
  Upload,
  MessageSquare,
  ChevronDown,
  Check,
} from 'lucide-react';

const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];

/** Configuración contextual para el modal de confirmación de cada transición (RF-06). */
const SIGUIENTE_ETAPA = {
  Recibido: {
    siguiente: 'Diagnóstico',
    boton: 'Iniciar Diagnóstico',
    titulo: 'Comenzar diagnóstico técnico',
    placeholder: 'Ej. Equipo recibido en mesa técnica; iniciando revisión de encendido y pantalla...',
    ayuda: 'Esta nota quedará registrada en la línea de tiempo y será visible en el seguimiento del cliente.',
  },
  Diagnóstico: {
    siguiente: 'Reparación',
    boton: 'Iniciar Reparación',
    titulo: 'Pasar equipo a reparación',
    placeholder: 'Ej. Diagnóstico concluido: falla en conector de carga y batería degradada. Se inicia sustitución...',
    ayuda: 'Describe el diagnóstico técnico encontrado antes de intervenir el equipo.',
  },
  Reparación: {
    siguiente: 'Pruebas',
    boton: 'Enviar a Pruebas',
    titulo: 'Concluir reparación y pasar a pruebas',
    placeholder: 'Ej. Se reemplazó módulo de pantalla y se realizó limpieza interna. Equipo listo para pruebas...',
    ayuda: 'Resume los trabajos realizados durante la reparación.',
  },
  Pruebas: {
    siguiente: 'Entregado',
    boton: 'Finalizar y Entregar',
    titulo: 'Confirmar entrega y emitir certificado',
    placeholder: 'Ej. Pruebas de carga, audio, táctil y cámara aprobadas. Equipo entregado al cliente...',
    ayuda: 'Al confirmar se emitirá el certificado digital oficial con código QR y los datos quedarán congelados.',
  },
};

/**
 * Extrae el token de estatus desde la orden ya sea por campo directo o desde url_estatus.
 *
 * @param {Object|null} orden Objeto de detalle de la orden.
 * @returns {string|null} Token UUID de consulta pública de estatus.
 */
function obtenerTokenEstatus(orden) {
  if (!orden) return null;
  if (orden.token_estatus) return orden.token_estatus;
  if (orden.url_estatus) {
    const partes = orden.url_estatus.split('/estatus/');
    return partes[1] || null;
  }
  return null;
}

/**
 * Normaliza la lista de evidencias fotográficas de una etapa ('antes' o 'despues').
 *
 * @param {Object|Array|undefined} evidencias Estructura de evidencias devuelta por el backend.
 * @param {'antes'|'despues'} etapa Etapa solicitada.
 * @returns {Array<{id?: number, url: string}>} Lista uniforme de URLs de imagen.
 */
function obtenerFotosEtapa(evidencias, etapa) {
  if (!evidencias) return [];
  const lista = Array.isArray(evidencias)
    ? evidencias.filter((e) => (e.tipo || e.etapa) === etapa)
    : evidencias[etapa] || [];

  return lista.map((item, idx) => {
    if (typeof item === 'string') {
      const url = item.startsWith('/') || item.startsWith('http') ? item : `/uploads/${item}`;
      return { id: idx, url };
    }
    const ruta = item.url || item.ruta || item.archivo || '';
    const url = ruta.startsWith('/') || ruta.startsWith('http') ? ruta : `/uploads/${ruta}`;
    return { id: item.id ?? idx, url };
  });
}

/**
 * Convierte el identificador técnico de un tipo de aviso en una etiqueta legible.
 *
 * @param {string} tipo Clave del tipo de aviso del backend.
 * @returns {string} Etiqueta amigable para el selector.
 */
function formatearTipoAviso(tipo) {
  return String(tipo)
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Vista de expediente dinámico de una orden de reparación.
 *
 * @returns {JSX.Element} Expediente completo con control secuencial de etapas.
 */
export default function DetalleOrdenPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [orden, setOrden] = useState(null);
  const [certificadoEmitido, setCertificadoEmitido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeOk, setMensajeOk] = useState('');

  // Modal de transición de estado (RF-06)
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [notaEstado, setNotaEstado] = useState('');
  const [enviandoEstado, setEnviandoEstado] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  // Refacciones (RF-08)
  const [nuevaPieza, setNuevaPieza] = useState({ nombre: '', tipo: 'original', numero_serie: '' });
  const [guardandoPieza, setGuardandoPieza] = useState(false);

  // Evidencias fotográficas "después" (RF-07)
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  // Garantía (RF-09)
  const [garantiaForm, setGarantiaForm] = useState({ dias_garantia: 30, terminos_garantia: '' });
  const [guardandoGarantia, setGuardandoGarantia] = useState(false);

  // Avisos al cliente
  const [avisosLista, setAvisosLista] = useState([]);
  const [tiposAviso, setTiposAviso] = useState([]);
  const [avisoForm, setAvisoForm] = useState({ tipo: '', adicional: '', en_estatus: true, por_correo: false });
  const [enviandoAviso, setEnviandoAviso] = useState(false);

  // Dropdowns personalizados (evita <select> nativos)
  const [menuPiezaAbierto, setMenuPiezaAbierto] = useState(false);
  const [menuAvisoAbierto, setMenuAvisoAbierto] = useState(false);
  const menuPiezaRef = useRef(null);
  const menuAvisoRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuPiezaRef.current && !menuPiezaRef.current.contains(e.target)) setMenuPiezaAbierto(false);
      if (menuAvisoRef.current && !menuAvisoRef.current.contains(e.target)) setMenuAvisoAbierto(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Carga el expediente completo de la orden y su historial de avisos al cliente.
   *
   * @returns {Promise<void>}
   */
  const cargarDetalleOrden = async () => {
    try {
      setLoading(true);
      const [resOrden, resAvisos] = await Promise.all([
        apiRequest(`/api/ordenes/${id}`),
        apiRequest(`/api/ordenes/${id}/avisos`).catch(() => ({ avisos: [], tipos: [] })),
      ]);

      const detalle = resOrden.orden || resOrden;
      setOrden(detalle);

      if (detalle.certificado) {
        setCertificadoEmitido(detalle.certificado);
      }

      // Precarga datos de garantía si ya existen en la orden
      const dias = detalle.garantia?.dias ?? detalle.dias_garantia;
      const terminos = detalle.garantia?.terminos ?? detalle.terminos_garantia ?? '';
      if (dias !== undefined && dias !== null) {
        setGarantiaForm({ dias_garantia: dias, terminos_garantia: terminos });
      }

      setAvisosLista(resAvisos.avisos || []);
      const tipos = resAvisos.tipos || [];
      setTiposAviso(tipos);
      if (tipos.length > 0 && !avisoForm.tipo) {
        setAvisoForm((prev) => ({ ...prev, tipo: tipos[0] }));
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información de la orden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDetalleOrden();
  }, [id]);

  /**
   * Muestra un mensaje temporal de confirmación en la parte superior del expediente.
   *
   * @param {string} texto Mensaje a mostrar.
   * @returns {void}
   */
  const notificarExito = (texto) => {
    setMensajeOk(texto);
    setTimeout(() => setMensajeOk(''), 4000);
  };

  /**
   * Ejecuta la transición lineal hacia el siguiente estado validando nota obligatoria (RF-06).
   *
   * @param {React.FormEvent<HTMLFormElement>} e Evento de envío del formulario del modal.
   * @returns {Promise<void>}
   */
  const handleConfirmarCambioEstado = async (e) => {
    e.preventDefault();
    const transicion = SIGUIENTE_ETAPA[orden?.estado];
    if (!transicion) return;

    if (notaEstado.trim().length < 5) {
      setErrorModal('Debe ingresar una nota descriptiva de al menos 5 caracteres.');
      return;
    }

    try {
      setEnviandoEstado(true);
      setErrorModal('');
      const res = await apiRequest(`/api/ordenes/${id}/estado`, {
        method: 'PATCH',
        body: { estado: transicion.siguiente, nota: notaEstado.trim() },
      });

      setOrden(res.orden || orden);
      if (res.certificado) {
        setCertificadoEmitido(res.certificado);
      }
      setModalEstadoAbierto(false);
      setNotaEstado('');
      notificarExito(`Orden actualizada a etapa "${transicion.siguiente}".`);
    } catch (err) {
      setErrorModal(err.message || 'No se pudo cambiar el estado de la orden.');
    } finally {
      setEnviandoEstado(false);
    }
  };

  /**
   * Registra una refacción sustituida en la orden (RF-08).
   *
   * @param {React.FormEvent<HTMLFormElement>} e Evento de envío del formulario.
   * @returns {Promise<void>}
   */
  const handleAgregarPieza = async (e) => {
    e.preventDefault();
    if (!nuevaPieza.nombre.trim()) {
      setError('Ingresa el nombre de la pieza o refacción.');
      return;
    }
    try {
      setGuardandoPieza(true);
      setError(null);
      const res = await apiRequest(`/api/ordenes/${id}/refacciones`, {
        method: 'POST',
        body: nuevaPieza,
      });
      setOrden(res.orden || orden);
      setNuevaPieza({ nombre: '', tipo: 'original', numero_serie: '' });
      notificarExito('Refacción registrada en el expediente.');
    } catch (err) {
      setError(err.message || 'Error al registrar la refacción.');
    } finally {
      setGuardandoPieza(false);
    }
  };

  /**
   * Elimina una refacción registrada antes de cerrar la orden (RF-08).
   *
   * @param {number} refaccionId ID de la refacción a eliminar.
   * @returns {Promise<void>}
   */
  const handleEliminarPieza = async (refaccionId) => {
    try {
      setError(null);
      const res = await apiRequest(`/api/ordenes/${id}/refacciones/${refaccionId}`, {
        method: 'DELETE',
      });
      setOrden(res.orden || orden);
      notificarExito('Refacción eliminada.');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la refacción.');
    }
  };

  /**
   * Sube una o varias fotografías de evidencia para la etapa "despues" (RF-07).
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e Evento de selección de archivos.
   * @returns {Promise<void>}
   */
  const handleSubirFotosDespues = async (e) => {
    const archivos = Array.from(e.target.files || []);
    if (!archivos.length) return;

    const formData = new FormData();
    formData.append('tipo', 'despues');
    archivos.forEach((archivo) => formData.append('fotos', archivo));

    try {
      setSubiendoFotos(true);
      setError(null);
      const res = await apiRequest(`/api/ordenes/${id}/evidencias`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      setOrden(res.orden || orden);
      notificarExito('Evidencia fotográfica de salida cargada correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudieron subir las fotografías.');
    } finally {
      setSubiendoFotos(false);
      e.target.value = '';
    }
  };

  /**
   * Guarda los días y términos de cobertura de la garantía (RF-09).
   *
   * @param {React.FormEvent<HTMLFormElement>} e Evento de envío del formulario.
   * @returns {Promise<void>}
   */
  const handleGuardarGarantia = async (e) => {
    e.preventDefault();
    const dias = Number(garantiaForm.dias_garantia);
    if (!Number.isFinite(dias) || dias < 0) {
      setError('Los días de garantía deben ser 0 o mayor.');
      return;
    }
    if (!garantiaForm.terminos_garantia.trim()) {
      setError('Ingresa los términos y cobertura de la garantía.');
      return;
    }
    try {
      setGuardandoGarantia(true);
      setError(null);
      const res = await apiRequest(`/api/ordenes/${id}/garantia`, {
        method: 'PUT',
        body: {
          dias_garantia: Number(garantiaForm.dias_garantia),
          terminos_garantia: garantiaForm.terminos_garantia.trim(),
        },
      });
      setOrden(res.orden || orden);
      notificarExito('Términos de garantía guardados.');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la garantía.');
    } finally {
      setGuardandoGarantia(false);
    }
  };

  /**
   * Envía un aviso al cliente para mostrarse en el estatus público y/o correo (P10).
   *
   * @param {React.FormEvent<HTMLFormElement>} e Evento de envío del formulario.
   * @returns {Promise<void>}
   */
  const handleEnviarAviso = async (e) => {
    e.preventDefault();
    if (!avisoForm.tipo) return;
    try {
      setEnviandoAviso(true);
      setError(null);
      await apiRequest(`/api/ordenes/${id}/avisos`, {
        method: 'POST',
        body: {
          tipo: avisoForm.tipo,
          adicional: avisoForm.adicional.trim(),
          en_estatus: avisoForm.en_estatus,
          por_correo: avisoForm.por_correo,
        },
      });
      setAvisoForm((prev) => ({ ...prev, adicional: '' }));
      const resAvisos = await apiRequest(`/api/ordenes/${id}/avisos`);
      setAvisosLista(resAvisos.avisos || []);
      notificarExito('Aviso enviado y publicado en el estatus del cliente.');
    } catch (err) {
      setError(err.message || 'No se pudo enviar el aviso al cliente.');
    } finally {
      setEnviandoAviso(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center text-slate-500 font-mono text-xs">
        Cargando expediente de la orden...
      </div>
    );
  }

  if (error && !orden) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
        <p className="text-sm font-bold text-slate-800 mb-1">Ocurrió un problema</p>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <Link to="/ordenes" className="px-4 py-2 rounded-xl bg-[#0D1B3E] text-white text-xs font-semibold">
          Volver a Órdenes
        </Link>
      </div>
    );
  }

  // Reglas de visibilidad progresiva según la etapa actual
  const indiceEstado = ESTADOS.indexOf(orden?.estado);
  const esEntregado = orden?.estado === 'Entregado';
  const mostrarRefacciones = indiceEstado >= 2; // Desde Reparación en adelante
  const puedeEditarRefacciones = orden?.estado === 'Reparación';
  const mostrarAvisos = indiceEstado >= 1 && !esEntregado; // Diagnóstico, Reparación y Pruebas
  const mostrarEvidenciasDespues = indiceEstado >= 3; // Desde Pruebas en adelante
  const puedeSubirDespues = orden?.estado === 'Pruebas';
  const mostrarGarantia = indiceEstado >= 3; // En Pruebas y solo lectura en Entregado
  const puedeEditarGarantia = orden?.estado === 'Pruebas';
  const puedeAvisarListo = orden?.estado === 'Pruebas' || orden?.estado === 'Entregado';
  const tiposAvisoDisponibles = tiposAviso.filter((t) => t !== 'listo_para_recoger' || puedeAvisarListo);

  const transicionActual = SIGUIENTE_ETAPA[orden?.estado] || null;
  const fotosAntes = obtenerFotosEtapa(orden?.evidencias, 'antes');
  const fotosDespues = obtenerFotosEtapa(orden?.evidencias, 'despues');
  const tieneGarantiaGuardada = Boolean(
    (orden?.garantia?.terminos || orden?.terminos_garantia) &&
      (orden?.garantia?.dias !== undefined || orden?.dias_garantia !== undefined),
  );
  const tokenEstatus = obtenerTokenEstatus(orden);
  const tokenCertificado =
    certificadoEmitido?.token_uuid ||
    certificadoEmitido?.token ||
    orden?.certificado?.token_uuid ||
    orden?.certificado?.token ||
    orden?.token_certificado;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col lg:flex-row font-sans">
      <TallerSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior fija */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-3.5 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              to="/ordenes"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Volver a órdenes"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-[#0D1B3E] tracking-tight">
                Expediente:{' '}
                <span className="font-mono text-[#24529F]">{orden?.folio || '—'}</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                Etapa actual: <strong className="text-[#0B0D12]">{orden?.estado}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tokenEstatus && (
              <a
                href={`/estatus/${tokenEstatus}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
                title="Abrir vista pública que ve el cliente al escanear su QR"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Estatus cliente</span>
              </a>
            )}

            {transicionActual && (
              <button
                type="button"
                onClick={() => {
                  setErrorModal('');
                  setNotaEstado('');
                  setModalEstadoAbierto(true);
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                  transicionActual.siguiente === 'Entregado'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#24529F] hover:bg-[#1d4280]'
                }`}
              >
                {transicionActual.boton} ➔
              </button>
            )}
          </div>
        </header>

        <main className="p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Alertas de error o confirmación */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => setError(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {mensajeOk && (
            <div className="p-3.5 rounded-xl bg-emerald-600 border border-emerald-700 text-white text-xs font-medium flex items-center gap-2 shadow-md">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
              <span>{mensajeOk}</span>
            </div>
          )}

          {/* Stepper visual de las 5 etapas (RF-06) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-5 gap-2">
              {ESTADOS.map((etapa, idx) => {
                const completada = idx < indiceEstado || (esEntregado && etapa === 'Entregado');
                const actual = idx === indiceEstado && !esEntregado;
                return (
                  <div key={etapa} className="flex flex-col items-center text-center gap-1.5">
                    <div
                      className={`w-full h-1.5 rounded-full transition-colors ${
                        completada
                          ? 'bg-emerald-500'
                          : actual
                            ? 'bg-[#24529F]'
                            : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-semibold ${
                        actual
                          ? 'text-[#0D1B3E]'
                          : completada
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                      }`}
                    >
                      {etapa}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Banner destacado cuando la orden ya fue entregada y certificada */}
          {esEntregado && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-emerald-950">
                    Orden finalizada y certificada
                  </h2>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    El expediente está cerrado en modo solo lectura. Puedes imprimir el certificado Media Carta o abrir la verificación pública.
                  </p>
                </div>
              </div>
              {tokenCertificado && (
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/certificados/${tokenCertificado}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir Media Carta
                  </Link>
                  <a
                    href={`/verificar/${tokenCertificado}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Verificar QR
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Checklist previo en etapa Pruebas para recordar requisitos de entrega */}
          {orden?.estado === 'Pruebas' && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[#0D1B3E]">
                Requisitos obligatorios antes de entregar y emitir certificado:
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <span className={`inline-flex items-center gap-1.5 font-medium ${fotosDespues.length > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {fotosDespues.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  Foto de salida ({fotosDespues.length}/5)
                </span>
                <span className={`inline-flex items-center gap-1.5 font-medium ${tieneGarantiaGuardada ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {tieneGarantiaGuardada ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  Garantía registrada
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ================= COLUMNA IZQUIERDA (2/3) ================= */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Información del Servicio y Dispositivo (Siempre visible) */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-sm text-[#0B0D12] border-b border-slate-100 pb-3">
                  Información del Servicio y Dispositivo
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-mono block uppercase text-[10px]">Cliente</span>
                    <strong className="text-slate-800 text-sm">
                      {orden?.cliente?.nombre_completo || '—'}
                    </strong>
                    <p className="text-slate-500 font-mono">{orden?.cliente?.telefono || '—'}</p>
                    {orden?.cliente?.email && (
                      <p className="text-slate-400 text-[11px]">{orden.cliente.email}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono block uppercase text-[10px]">Dispositivo</span>
                    <strong className="text-slate-800 text-sm">
                      {orden?.dispositivo?.marca} {orden?.dispositivo?.modelo}
                    </strong>
                    <p className="text-slate-500 font-mono text-[11px]">
                      IMEI/SN: {orden?.dispositivo?.imei_o_serie || '—'}
                    </p>
                    {orden?.dispositivo?.contrasena_equipo && (
                      <p className="text-[11px] text-amber-700 mt-1 inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Lock className="w-3 h-3" />
                        PIN/Clave: <span className="font-mono font-bold">{orden.dispositivo.contrasena_equipo}</span>
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-mono block uppercase text-[10px] mb-1">
                      Falla Reportada
                    </span>
                    <p className="text-slate-700 leading-relaxed">{orden?.falla_reportada || '—'}</p>
                  </div>

                  <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-mono block uppercase text-[10px] mb-1">
                      Condición Estética Inicial
                    </span>
                    <p className="text-slate-700 leading-relaxed">{orden?.condicion_fisica || '—'}</p>
                  </div>
                </div>
              </section>

              {/* 2. Evidencias Fotográficas (Antes siempre; Después desde Reparación) */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="font-bold text-sm text-[#0B0D12] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#24529F]" />
                    Evidencias Fotográficas
                  </h2>
                </div>

                {/* Fotos de recepción */}
                <div className="space-y-2">
                  <h3 className="text-[11px] font-mono uppercase font-bold text-slate-400">
                    Recepción de falla ({fotosAntes.length})
                  </h3>
                  {fotosAntes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Sin fotografías de recepción.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {fotosAntes.map((f) => (
                        <a
                          key={f.id}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 block hover:opacity-90 transition-opacity"
                        >
                          <img src={f.url} alt="Evidencia antes" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fotos de salida (Después) — visibles a partir de Reparación */}
                {mostrarEvidenciasDespues && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-mono uppercase font-bold text-slate-400">
                        Entrega / Después ({fotosDespues.length}/5)
                      </h3>
                      {puedeSubirDespues && fotosDespues.length < 5 && (
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold cursor-pointer transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{subiendoFotos ? 'Subiendo...' : 'Subir foto después'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            multiple
                            disabled={subiendoFotos}
                            onChange={handleSubirFotosDespues}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {fotosDespues.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Aún no se han cargado fotos del equipo reparado (se requiere al menos 1 para entregar).
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                        {fotosDespues.map((f) => (
                          <a
                            key={f.id}
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 block hover:opacity-90 transition-opacity"
                          >
                            <img src={f.url} alt="Evidencia después" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* 3. Refacciones / Piezas (Desde Reparación en adelante) */}
              {mostrarRefacciones && (
                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="font-bold text-sm text-[#0B0D12]">
                      Piezas o Refacciones Sustituidas
                    </h2>
                  </div>

                  {puedeEditarRefacciones && (
                    <form
                      noValidate
                      onSubmit={handleAgregarPieza}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200"
                    >
                      <input
                        type="text"
                        placeholder="Pieza (Ej. Pantalla OLED)"
                        required
                        value={nuevaPieza.nombre}
                        onChange={(e) => setNuevaPieza({ ...nuevaPieza, nombre: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
                      />
                      <div className="relative" ref={menuPiezaRef}>
                        <button
                          type="button"
                          onClick={() => setMenuPiezaAbierto(!menuPiezaAbierto)}
                          className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 flex items-center justify-between cursor-pointer"
                        >
                          <span className="capitalize">{nuevaPieza.tipo}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuPiezaAbierto ? 'rotate-180' : ''}`} />
                        </button>
                        {menuPiezaAbierto && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1">
                            {[
                              { value: 'original', label: 'Original' },
                              { value: 'compatible', label: 'Compatible' },
                              { value: 'reacondicionada', label: 'Reacondicionada' },
                            ].map((op) => (
                              <button
                                key={op.value}
                                type="button"
                                onClick={() => {
                                  setNuevaPieza({ ...nuevaPieza, tipo: op.value });
                                  setMenuPiezaAbierto(false);
                                }}
                                className={`w-full px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer ${
                                  nuevaPieza.tipo === op.value
                                    ? 'bg-blue-50 text-[#24529F] font-semibold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span>{op.label}</span>
                                {nuevaPieza.tipo === op.value && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Serie/Lote (opcional)"
                        value={nuevaPieza.numero_serie}
                        onChange={(e) => setNuevaPieza({ ...nuevaPieza, numero_serie: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#24529F]"
                      />
                      <button
                        type="submit"
                        disabled={guardandoPieza}
                        className="px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <PackagePlus className="w-4 h-4" />
                        {guardandoPieza ? 'Agregando...' : 'Agregar'}
                      </button>
                    </form>
                  )}

                  <div className="space-y-2">
                    {!orden?.refacciones || orden.refacciones.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 text-center">
                        No se han registrado refacciones en esta orden.
                      </p>
                    ) : (
                      orden.refacciones.map((ref) => (
                        <div
                          key={ref.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs"
                        >
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-bold text-slate-800">{ref.nombre}</span>
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-[#24529F] text-[10px] font-mono uppercase">
                              {ref.tipo}
                            </span>
                            {ref.numero_serie && (
                              <span className="text-[11px] font-mono text-slate-500">
                                S/N: {ref.numero_serie}
                              </span>
                            )}
                          </div>
                          {puedeEditarRefacciones && (
                            <button
                              type="button"
                              onClick={() => handleEliminarPieza(ref.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar refacción"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}

              {/* 4. Garantía (Solo en Pruebas para editar y Entregado en solo lectura — RF-09) */}
              {mostrarGarantia && (
                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="font-bold text-sm text-[#0B0D12] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Garantía del Servicio
                    </h2>
                  </div>

                  {puedeEditarGarantia ? (
                    <form noValidate onSubmit={handleGuardarGarantia} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Días de garantía
                          </label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={garantiaForm.dias_garantia}
                            onChange={(e) =>
                              setGarantiaForm({ ...garantiaForm, dias_garantia: e.target.value })
                            }
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#24529F]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Términos y cobertura
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Cubre defectos de la pieza instalada. No aplica por golpes o humedad."
                            value={garantiaForm.terminos_garantia}
                            onChange={(e) =>
                              setGarantiaForm({ ...garantiaForm, terminos_garantia: e.target.value })
                            }
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#24529F]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={guardandoGarantia}
                          className="px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          {guardandoGarantia ? 'Guardando...' : 'Guardar garantía'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <p className="font-bold text-slate-800">
                        Cobertura: {orden?.garantia?.dias ?? orden?.dias_garantia ?? 0} días naturales
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        {orden?.garantia?.terminos || orden?.terminos_garantia || 'Sin términos registrados.'}
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* ================= COLUMNA DERECHA (1/3) ================= */}
            <div className="space-y-6">
              {/* Avisos al cliente — visible en Diagnóstico, Reparación y Pruebas */}
              {mostrarAvisos && tiposAvisoDisponibles.length > 0 && (
                <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="font-bold text-sm text-[#0B0D12] flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#24529F]" />
                      Avisar al Cliente
                    </h2>
                  </div>

                  <form noValidate onSubmit={handleEnviarAviso} className="space-y-3 text-xs">
                    <div className="relative" ref={menuAvisoRef}>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Tipo de aviso
                      </label>
                      <button
                        type="button"
                        onClick={() => setMenuAvisoAbierto(!menuAvisoAbierto)}
                        className="w-full border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 flex items-center justify-between cursor-pointer"
                      >
                        <span>
                          {avisoForm.tipo ? formatearTipoAviso(avisoForm.tipo) : 'Selecciona un aviso'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuAvisoAbierto ? 'rotate-180' : ''}`} />
                      </button>
                      {menuAvisoAbierto && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1">
                          {tiposAvisoDisponibles.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setAvisoForm({ ...avisoForm, tipo: t });
                                setMenuAvisoAbierto(false);
                              }}
                              className={`w-full px-3 py-2 text-xs flex items-center justify-between text-left cursor-pointer ${
                                avisoForm.tipo === t
                                  ? 'bg-blue-50 text-[#24529F] font-semibold'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{formatearTipoAviso(t)}</span>
                              {avisoForm.tipo === t && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Detalle para el cliente (opcional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ej. Se detectó daño adicional en batería; favor de confirmar autorización..."
                        value={avisoForm.adicional}
                        onChange={(e) => setAvisoForm({ ...avisoForm, adicional: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#24529F]"
                      />
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-600">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avisoForm.en_estatus}
                          onChange={(e) => setAvisoForm({ ...avisoForm, en_estatus: e.target.checked })}
                        />
                        Publicar en la página del cliente
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avisoForm.por_correo}
                          onChange={(e) => setAvisoForm({ ...avisoForm, por_correo: e.target.checked })}
                        />
                        Enviar correo
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={enviandoAviso}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#24529F] hover:bg-[#1d4280] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {enviandoAviso ? 'Enviando...' : 'Publicar aviso'}
                    </button>
                  </form>

                  {avisosLista.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                        Avisos enviados ({avisosLista.length})
                      </span>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {avisosLista.map((av, idx) => (
                          <div key={av.id ?? idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                            <p className="text-slate-700">{av.mensaje || av.adicional || formatearTipoAviso(av.tipo)}</p>
                            {av.fecha && (
                              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                                {new Date(av.fecha).toLocaleString('es-MX')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Historial de la orden */}
              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="font-bold text-sm text-[#0B0D12] border-b border-slate-100 pb-3">
                  Historial de la orden
                </h2>
                <div className="space-y-3">
                  {!orden?.historial || orden.historial.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Sin movimientos registrados.</p>
                  ) : (
                    orden.historial.map((h, index) => (
                      <div
                        key={h.id ?? index}
                        className="flex items-start gap-3 text-xs border-l-2 border-[#24529F] pl-3 py-1"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">{h.estado}</span>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">{h.nota}</p>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                            {h.fecha ? new Date(h.fecha).toLocaleString('es-MX') : ''}
                            {h.usuario || h.tecnico ? ` · ${h.usuario || h.tecnico}` : ''}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* ================= MODAL DE CONFIRMACIÓN DE CAMBIO DE ESTADO (RF-06) ================= */}
      {modalEstadoAbierto && transicionActual && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#24529F]">
                  {orden.estado} ➔ {transicionActual.siguiente}
                </span>
                <h3 className="text-base font-bold text-[#0B0D12] mt-0.5">
                  {transicionActual.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEstadoAbierto(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <strong>{user?.nombre || user?.email || 'Técnico'}</strong>, estás por avanzar el folio{' '}
              <span className="font-mono font-bold text-[#0D1B3E]">{orden.folio}</span> a{' '}
              <strong>{transicionActual.siguiente}</strong>. Este paso no se puede deshacer.
            </div>

            <form onSubmit={handleConfirmarCambioEstado} noValidate className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción del avance *
                </label>
                <textarea
                  rows={3}
                  placeholder={transicionActual.placeholder}
                  value={notaEstado}
                  onChange={(e) => {
                    setNotaEstado(e.target.value);
                    if (errorModal) setErrorModal('');
                  }}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
                />
                <p className="text-[11px] text-slate-400 mt-1">{transicionActual.ayuda}</p>
              </div>

              {errorModal && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorModal}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEstadoAbierto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoEstado}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 cursor-pointer ${
                    transicionActual.siguiente === 'Entregado'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-[#0D1B3E] hover:bg-[#12284A]'
                  }`}
                >
                  {enviandoEstado ? 'Guardando...' : `Confirmar ${transicionActual.siguiente}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}