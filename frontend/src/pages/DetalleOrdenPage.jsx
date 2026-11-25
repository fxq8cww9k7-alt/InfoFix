/**
 * @file DetalleOrdenPage.jsx
 * @description Pantalla integral de Detalle de la Orden (P7) de InfoFIX.
 *              Incluye expediente, línea de tiempo inmutable, evidencias reales antes/después con lightbox,
 *              piezas reemplazadas, datos de cliente y equipo, configuración de garantía, checklist
 *              de certificación y todas las variantes oficiales (recién creada, en reparación, entregada/bloqueada, móvil).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import {
  Wrench,
  Home,
  ClipboardList,
  Plus,
  Users,
  Smartphone,
  FileCheck,
  Search,
  Bell,
  Printer,
  Send,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  ShieldCheck,
  AlertCircle,
  Lock,
  Camera,
  X,
  Trash2,
  Edit3,
  ChevronRight,
  Package,
  QrCode,
  Copy,
  LogOut,
} from 'lucide-react';

import VerFotoModal from '../components/ordenes/VerFotoModal';
import PiezaModal from '../components/ordenes/PiezaModal';
import EliminarPiezaModal from '../components/ordenes/EliminarPiezaModal';
import SubirFotoModal from '../components/ordenes/SubirFotoModal';
import NotificarClienteModal from '../components/ordenes/NotificarClienteModal';
import AvanzarEstadoModal from '../components/ordenes/AvanzarEstadoModal';
import EditarEstadoInicialModal from '../components/ordenes/EditarEstadoInicialModal';
import NotaServicioModal from '../components/ordenes/NotaServicioModal';
import CertificadoModal from '../components/ordenes/CertificadoModal';
import DispositivoIlustracion from '../components/ordenes/DispositivoIlustracion';

const ESTADOS_ORDEN = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];

export default function DetalleOrdenPage() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [orden, setOrden] = useState(null);
  const [certificadoQr, setCertificadoQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumenActivas, setResumenActivas] = useState(0);
  const [imgErrors, setImgErrors] = useState({});

  // Formulario de garantía (vacío hasta que se guarde o exista en BD)
  const [diasGarantia, setDiasGarantia] = useState('');
  const [terminosGarantia, setTerminosGarantia] = useState('');
  const [guardandoGarantia, setGuardandoGarantia] = useState(false);

  // Notificaciones (campana)
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [notifAbierto, setNotifAbierto] = useState(false);
  const notifRef = useRef(null);

  // Modales
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);
  const [fotoActualIndex, setFotoActualIndex] = useState(0);
  const [modalPiezaAbierto, setModalPiezaAbierto] = useState(false);
  const [modoPieza, setModoPieza] = useState('crear');
  const [piezaSeleccionada, setPiezaSeleccionada] = useState(null);
  const [modalEliminarPiezaAbierto, setModalEliminarPiezaAbierto] = useState(false);
  const [modalSubirFotoAbierto, setModalSubirFotoAbierto] = useState(false);
  const [modalNotificarAbierto, setModalNotificarAbierto] = useState(false);
  const [modalAvanzarAbierto, setModalAvanzarAbierto] = useState(false);
  const [modalEditarInicialAbierto, setModalEditarInicialAbierto] = useState(false);
  const [modalNotaServicioAbierto, setModalNotaServicioAbierto] = useState(false);
  const [modalCertificadoAbierto, setModalCertificadoAbierto] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const garantiaRef = useRef(null);

  const cargarNotificaciones = useCallback(async () => {
    try {
      const data = await apiRequest('/api/notificaciones');
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas || 0);
    } catch {
      // Silencioso
    }
  }, []);

  const cargarDetalle = useCallback(
    async (silencioso = false) => {
      try {
        if (!silencioso) setLoading(true);
        setError(null);
        const data = await apiRequest(`/api/ordenes/${id}`);
        const o = data.orden || data;
        setOrden(o);
        setImgErrors({});

        if (o.garantia?.dias !== null && o.garantia?.dias !== undefined) {
          setDiasGarantia(String(o.garantia.dias));
        } else {
          setDiasGarantia('');
        }
        setTerminosGarantia(o.garantia?.terminos || '');

        if (o.bloqueada || o.estado === 'Entregado') {
          apiRequest(`/api/ordenes/${id}/certificado`)
            .then((certRes) => {
              if (certRes?.certificado?.qr) {
                setCertificadoQr(certRes.certificado.qr);
              }
            })
            .catch(() => {});
        } else {
          setCertificadoQr(null);
        }
      } catch (err) {
        setError(err.message || 'No se pudo cargar la orden solicitada.');
      } finally {
        if (!silencioso) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    apiRequest('/api/dashboard')
      .then((data) => {
        if (data.indicadores?.activas !== undefined) {
          setResumenActivas(data.indicadores.activas);
        }
      })
      .catch(() => {});
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  useEffect(() => {
    function handleOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const mostrarToast = (titulo, subtitulo = 'Se actualizó la línea del tiempo') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ titulo, subtitulo });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
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
      // Silencioso
    }
  };

  const handleGuardarGarantia = async (e) => {
    e.preventDefault();
    if (diasGarantia === '' || diasGarantia === null) {
      mostrarToast('Selecciona los días', 'Elige un plazo de cobertura para guardar la garantía.');
      return;
    }
    if (!terminosGarantia.trim()) {
      mostrarToast('Faltan términos', 'Los términos de garantía son obligatorios.');
      return;
    }

    try {
      setGuardandoGarantia(true);
      await apiRequest(`/api/ordenes/${id}/garantia`, {
        method: 'PUT',
        body: {
          dias_garantia: Number(diasGarantia),
          terminos_garantia: terminosGarantia.trim(),
        },
      });
      await cargarDetalle(true);
      mostrarToast('Garantía guardada', 'Válida al entregar el equipo');
    } catch (err) {
      mostrarToast('Error al guardar garantía', err.message);
    } finally {
      setGuardandoGarantia(false);
    }
  };

  const handleGuardarPieza = async (piezaData) => {
    if (modoPieza === 'crear') {
      await apiRequest(`/api/ordenes/${id}/refacciones`, {
        method: 'POST',
        body: piezaData,
      });
      await cargarDetalle(true);
      mostrarToast('Pieza agregada', 'Se registró en la línea de tiempo');
    } else {
      await apiRequest(`/api/ordenes/${id}/refacciones/${piezaSeleccionada.id}`, {
        method: 'PUT',
        body: piezaData,
      });
      await cargarDetalle(true);
      mostrarToast('Pieza actualizada', 'Se guardaron los cambios');
    }
  };

  const handleEliminarPieza = async () => {
    if (!piezaSeleccionada) return;
    await apiRequest(`/api/ordenes/${id}/refacciones/${piezaSeleccionada.id}`, {
      method: 'DELETE',
    });
    await cargarDetalle(true);
    mostrarToast('Pieza eliminada', 'Se removió del expediente');
  };

  const handleSubirFoto = async (formData) => {
    await apiRequest(`/api/ordenes/${id}/evidencias`, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
    await cargarDetalle(true);
    mostrarToast('Fotografía subida', 'Se añadió a las evidencias');
  };

  const handleNotificar = async (datosAviso) => {
    await apiRequest(`/api/ordenes/${id}/avisos`, {
      method: 'POST',
      body: datosAviso,
    });
    await cargarDetalle(true);
    cargarNotificaciones();
    mostrarToast('Aviso enviado al cliente', 'Notificación registrada con éxito');
  };

  const handleAvanzarEstado = async ({ estado, nota }) => {
    await apiRequest(`/api/ordenes/${id}/estado`, {
      method: 'PATCH',
      body: { estado, nota },
    });
    await cargarDetalle(true);
    cargarNotificaciones();
    apiRequest('/api/dashboard')
      .then((d) => {
        if (d.indicadores?.activas !== undefined) setResumenActivas(d.indicadores.activas);
      })
      .catch(() => {});
    mostrarToast(`Estado actualizado a ${estado}`, 'Se actualizó la línea del tiempo');
  };

  const handleGuardarEstadoInicial = async (datosIniciales) => {
    await apiRequest(`/api/ordenes/${id}/estado-inicial`, {
      method: 'PATCH',
      body: datosIniciales,
    });
    await cargarDetalle(true);
    mostrarToast('Estado inicial actualizado', 'Se actualizaron la falla y accesorios');
  };

  const handleAbrirLightbox = (index) => {
    setFotoActualIndex(index);
    setModalFotoAbierto(true);
  };

  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return '';
    return new Date(fechaStr)
      .toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(',', ' ·');
  };

  const formatearFechaSoloDia = (fechaStr) => {
    if (!fechaStr) return '';
    return new Date(fechaStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const todasEvidencias = [
    ...(orden?.evidencias?.antes || []),
    ...(orden?.evidencias?.despues || []),
  ];

  const indiceEstadoActual = orden ? ESTADOS_ORDEN.indexOf(orden.estado) : -1;
  const siguienteEstado =
    indiceEstadoActual >= 0 && indiceEstadoActual < ESTADOS_ORDEN.length - 1
      ? ESTADOS_ORDEN[indiceEstadoActual + 1]
      : null;

  const esBloqueada = Boolean(orden?.bloqueada || orden?.estado === 'Entregado');
  const puedeAgregarPieza =
    !esBloqueada && (orden?.estado === 'Diagnóstico' || orden?.estado === 'Reparación');
  const esRecienCreada = Boolean(
    orden?.estado === 'Recibido' &&
      (orden.historial?.length <= 1 || location.state?.recienCreada),
  );

  const menuTaller = [
    { label: 'Inicio', icon: Home, path: '/dashboard' },
    {
      label: 'Órdenes',
      icon: ClipboardList,
      path: '/ordenes',
      badge: resumenActivas > 0 ? resumenActivas : null,
      activo: true,
    },
    { label: 'Nueva orden', icon: Plus, path: '/ordenes/nueva' },
  ];

  const menuRegistros = [
    { label: 'Clientes', icon: Users, path: '/clientes' },
    { label: 'Dispositivos', icon: Smartphone, path: '/dispositivos' },
    { label: 'Certificados', icon: FileCheck, path: '/certificados' },
  ];

  const nombreUsuario = user?.nombre || user?.email || 'Personal del taller';
  const subtituloUsuario = user?.email || 'Personal del taller';
  const inicialesUsuario =
    nombreUsuario
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'IF';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center font-sans text-slate-500 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2452BF]/20 border-t-[#2452BF] rounded-full animate-spin" />
          <span className="font-mono">Cargando expediente de la orden...</span>
        </div>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center font-sans">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-base font-bold text-slate-900 mb-1">Expediente no disponible</h2>
        <p className="text-xs text-slate-500 mb-6 max-w-sm">
          {error || 'La orden especificada no existe.'}
        </p>
        <Link
          to="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all"
        >
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const disp = orden.dispositivo || {};
  const cliente = orden.cliente || {};
  const garantiaDias = orden.garantia?.dias ?? 0;
  const garantiaRestantes = orden.garantia?.dias_restantes ?? 0;
  const garantiaVigente = orden.garantia?.estado === 'Vigente';
  const garantiaPorcentaje =
    garantiaDias > 0 ? Math.min(100, Math.max(0, (garantiaRestantes / garantiaDias) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0A0D12] flex flex-col lg:flex-row font-sans">
      {/* BARRA LATERAL IZQUIERDA (ESCRITORIO) */}
      <aside className="hidden lg:flex w-64 bg-[#0D1B3E] text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800">
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
                        ? 'bg-white/10 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2452BF] text-white">
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
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
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

        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#12204A] border border-blue-400/30 text-blue-200 font-bold text-xs flex items-center justify-center shrink-0">
              {inicialesUsuario}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{nombreUsuario}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{subtituloUsuario}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabecera móvil (P7 web en celular) */}
        <header className="lg:hidden bg-[#0D1B3E] text-white px-4 py-3.5 sticky top-0 z-20 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="p-1.5 rounded-lg bg-white/10 text-white shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold truncate">{orden.folio}</p>
                <p className="text-[11px] text-slate-300 truncate">
                  {disp.marca} {disp.modelo} · {cliente.nombre_completo}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2452BF] text-white shrink-0">
              {orden.estado}
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-300 pl-9">
            Paso {indiceEstadoActual + 1} de {ESTADOS_ORDEN.length} · {orden.estado}
          </p>
        </header>

        {/* Cabecera superior escritorio */}
        <header className="hidden lg:flex bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-20 items-center justify-between">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
              Órdenes
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-800 font-semibold">{orden.folio}</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente, teléfono o IMEI"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim().length >= 3) {
                    navigate(`/dashboard?q=${encodeURIComponent(e.target.value.trim())}`);
                  }
                }}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2452BF] transition-all"
              />
            </div>

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
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Notificaciones {noLeidas > 0 ? `(${noLeidas})` : ''}
                    </span>
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
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notificaciones.length === 0 ? (
                      <p className="p-5 text-center text-xs text-slate-400">Sin notificaciones recientes.</p>
                    ) : (
                      notificaciones.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.leida) handleMarcarLeidas([n.id]);
                            if (n.orden_id) {
                              setNotifAbierto(false);
                              navigate(`/ordenes/${n.orden_id}`);
                            }
                          }}
                          className={`px-4 py-3 text-xs hover:bg-slate-50 cursor-pointer ${
                            !n.leida ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <p className="font-semibold text-slate-900">{n.mensaje}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {formatearFechaHora(n.fecha)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Cuerpo del expediente */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Acciones rápidas en móvil (P7 móvil) */}
          {!esBloqueada && (
            <div className="lg:hidden space-y-3">
              {siguienteEstado && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">Siguiente paso</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Cuando termines esta etapa, avanza la orden a {siguienteEstado} y escribe la nota técnica.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAvanzarAbierto(true)}
                    className="w-full py-2.5 rounded-xl bg-[#0D1B3E] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <span>Avanzar a {siguienteEstado}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalSubirFotoAbierto(true)}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <Camera className="w-4 h-4 text-[#2452BF]" />
                  <span>Subir foto</span>
                </button>
                <button
                  type="button"
                  disabled={!puedeAgregarPieza}
                  onClick={() => {
                    setPiezaSeleccionada(null);
                    setModoPieza('crear');
                    setModalPiezaAbierto(true);
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-slate-800 disabled:opacity-50"
                >
                  <Package className="w-4 h-4 text-[#2452BF]" />
                  <span>Agregar pieza</span>
                </button>
                <button
                  type="button"
                  onClick={() => garantiaRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <ShieldCheck className="w-4 h-4 text-[#2452BF]" />
                  <span>Garantía</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalNotificarAbierto(true)}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-slate-800"
                >
                  <Send className="w-4 h-4 text-[#2452BF]" />
                  <span>Notificar</span>
                </button>
              </div>
            </div>
          )}

          {/* Fila principal del título y acciones (escritorio) */}
          <div className="hidden lg:flex flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {orden.folio}
                </h1>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    orden.estado === 'Recibido'
                      ? 'bg-[#E1ECF8] text-[#2452BF]'
                      : orden.estado === 'Diagnóstico'
                        ? 'bg-[#E1ECF8] text-[#12204A]'
                        : orden.estado === 'Reparación'
                          ? 'bg-[#2452BF] text-white'
                          : orden.estado === 'Pruebas'
                            ? 'bg-[#081833] text-white'
                            : 'bg-[#E3F4EC] text-[#1F8A5B]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {orden.estado}
                </span>

                {esBloqueada && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                    <Lock className="w-3 h-3 text-slate-600" />
                    Orden bloqueada
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1 font-mono">
                {disp.marca} {disp.modelo}
                {disp.color ? ` · ${disp.color}` : ''} · recibido{' '}
                {formatearFechaHora(orden.fecha_recepcion)}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {!esBloqueada ? (
                <>
                  <button
                    onClick={() => setModalNotaServicioAbierto(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Imprimir nota (QR)</span>
                  </button>

                  <button
                    onClick={() => setModalNotificarAbierto(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-500" />
                    <span>Notificar</span>
                  </button>

                  {siguienteEstado && (
                    <button
                      onClick={() => setModalAvanzarAbierto(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Avanzar a {siguienteEstado}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setModalCertificadoAbierto(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Ver certificado</span>
                </button>
              )}
            </div>
          </div>

          {/* Banners informativos */}
          {esRecienCreada && !esBloqueada && (
            <div className="p-4 rounded-2xl bg-[#E6F4EA] border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">Orden {orden.folio} creada</p>
                  <p className="text-[11px] text-emerald-800">
                    Imprime la nota de servicio y entrégala al cliente: con su QR podrá consultar el estatus.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalNotaServicioAbierto(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-xs shrink-0 self-start sm:self-auto transition-all cursor-pointer"
              >
                Imprimir nota (QR)
              </button>
            </div>
          )}

          {esBloqueada && (
            <div className="p-4 rounded-2xl bg-[#0D1B3E] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/10">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white tracking-wide">
                    Esta orden ya se entregó y está bloqueada
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Fotos, piezas y garantía ya no se pueden modificar para que el certificado no cambie.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalCertificadoAbierto(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold shadow-xs shrink-0 self-start sm:self-auto transition-all cursor-pointer"
              >
                Ver certificado
              </button>
            </div>
          )}

          {/* Stepper horizontal (escritorio) */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl p-6 shadow-xs overflow-x-auto">
            <div className="flex items-center justify-between min-w-[620px] relative">
              {ESTADOS_ORDEN.map((etapa, idx) => {
                const etapaIdx = ESTADOS_ORDEN.indexOf(etapa);
                const actualIdx = ESTADOS_ORDEN.indexOf(orden.estado);
                const isCompleted = orden.estado === 'Entregado' ? etapaIdx <= actualIdx : etapaIdx < actualIdx;
                const isCurrent = orden.estado !== 'Entregado' && etapaIdx === actualIdx;

                const evento = orden.historial?.find((h) => h.tipo === 'estado' && h.estado === etapa);
                const subtexto = isCompleted
                  ? evento?.fecha
                    ? formatearFechaHora(evento.fecha)
                    : 'completado'
                  : isCurrent
                    ? 'en curso'
                    : etapa === 'Entregado'
                      ? 'genera certificado'
                      : 'pendiente';

                return (
                  <div key={etapa} className="flex-1 flex items-center relative">
                    <div className="flex items-center gap-3 relative z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all shadow-xs ${
                          isCompleted
                            ? 'bg-[#0D1B3E] text-white'
                            : isCurrent
                              ? 'border-2 border-[#2452BF] text-[#2452BF] bg-white ring-4 ring-blue-50'
                              : 'border border-slate-300 text-slate-400 bg-slate-50'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div>
                        <p
                          className={`text-xs tracking-tight ${
                            isCompleted || isCurrent ? 'font-bold text-slate-900' : 'text-slate-400 font-medium'
                          }`}
                        >
                          {etapa}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{subtexto}</p>
                      </div>
                    </div>

                    {idx < ESTADOS_ORDEN.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 ${
                          idx < actualIdx ? 'bg-[#0D1B3E]' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CUADRÍCULA DE DOS COLUMNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMNA IZQUIERDA */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Línea de tiempo inmutable */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Línea de tiempo</h2>
                  <span className="text-[10px] font-mono text-slate-400">
                    {esBloqueada ? 'Solo lectura' : 'Eventos inmutables'}
                  </span>
                </div>

                <div className="space-y-4">
                  {orden.historial && orden.historial.length > 0 ? (
                    [...orden.historial].reverse().map((item, i) => {
                      const esActual = i === 0;
                      return (
                        <div key={item.id || i} className="flex items-start gap-3.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs ${
                              esActual
                                ? 'bg-[#0D1B3E] text-white'
                                : 'bg-blue-50 text-[#2452BF] border border-blue-100'
                            }`}
                          >
                            {item.estado === 'Recibido' && <Clock className="w-3.5 h-3.5" />}
                            {item.estado === 'Diagnóstico' && <Search className="w-3.5 h-3.5" />}
                            {item.estado === 'Reparación' && <Wrench className="w-3.5 h-3.5" />}
                            {item.estado === 'Pruebas' && <Clock className="w-3.5 h-3.5" />}
                            {item.estado === 'Entregado' && <Check className="w-3.5 h-3.5" />}
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{item.estado}</span>
                                {esActual && (
                                  <span className="px-2 py-0.2 rounded-full bg-blue-100 text-[#2452BF] text-[9px] font-mono font-bold uppercase">
                                    Actual
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                {formatearFechaHora(item.fecha)}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans">
                              {item.nota}
                            </div>

                            <p className="text-[10px] text-slate-400 font-mono">
                              por {item.usuario || orden.tecnico?.nombre || 'Personal del taller'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">Sin registros de auditoría.</p>
                  )}
                </div>
              </section>

              {/* 2. Estado inicial (RF-05) - solo editable en Recibido */}
              {orden.estado === 'Recibido' && (
                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 tracking-tight">Estado inicial</h2>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-[#2452BF] font-semibold">
                        RF-05
                      </span>
                    </div>
                    {!esBloqueada && (
                      <button
                        onClick={() => setModalEditarInicialAbierto(true)}
                        className="px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                        FALLA REPORTADA
                      </span>
                      <p className="text-slate-800 leading-relaxed">{orden.falla_reportada}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                        CONDICIÓN FÍSICA
                      </span>
                      <p className="text-slate-800 leading-relaxed">{orden.condicion_fisica}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      ACCESORIOS RECIBIDOS
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(orden.accesorios) && orden.accesorios.length > 0 ? (
                        orden.accesorios.map((acc, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50/60 border border-blue-100 text-blue-900 text-xs font-semibold"
                          >
                            <Check className="w-3.5 h-3.5 text-[#2452BF]" />
                            <span>{acc}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Ningún accesorio registrado</span>
                      )}
                    </div>
                  </div>

                  {orden.evidencias?.antes?.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                        FOTOS DE RECEPCIÓN · {orden.evidencias.antes.length} / 5
                      </span>
                      <div className="flex gap-2.5 overflow-x-auto pb-1">
                        {orden.evidencias.antes.map((f, i) => {
                          const key = `ini-${f.id || i}`;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleAbrirLightbox(i)}
                              className="relative w-20 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 group hover:ring-2 hover:ring-[#2452BF] transition-all shadow-xs flex items-center justify-center cursor-pointer"
                            >
                              <span className="absolute top-1.5 left-1.5 z-10 px-1 py-0.2 rounded text-[7px] font-mono font-bold bg-[#0D1B3E] text-white">
                                ANTES
                              </span>
                              {f.url && !imgErrors[key] ? (
                                <img
                                  src={f.url}
                                  alt={`Recepción ${i + 1}`}
                                  onError={() => setImgErrors((p) => ({ ...p, [key]: true }))}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <DispositivoIlustracion esAntes={true} className="w-14 h-20 p-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 font-mono">
                    Puedes editar el estado inicial hasta que la orden pase a Diagnóstico.
                  </p>
                </section>
              )}

              {/* 3. Evidencias reales (Fotos Antes y Después) */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">Evidencias</h2>
                    <span className="text-[11px] font-mono text-slate-400">
                      Antes {orden.evidencias?.antes?.length || 0}/5 · Después{' '}
                      {orden.evidencias?.despues?.length || 0}/5
                    </span>
                  </div>
                  {!esBloqueada ? (
                    <button
                      onClick={() => setModalSubirFotoAbierto(true)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Subir foto</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Bloqueado
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {todasEvidencias.length > 0 ? (
                    todasEvidencias.map((foto, idx) => {
                      const esAntes = (foto.tipo || '').toLowerCase() === 'antes';
                      const key = `ev-${foto.id || idx}`;
                      return (
                        <div
                          key={key}
                          onClick={() => handleAbrirLightbox(idx)}
                          className="bg-slate-100 rounded-2xl h-40 sm:h-44 relative flex items-center justify-center cursor-pointer border border-slate-200 hover:ring-2 hover:ring-[#2452BF] transition-all shadow-xs group overflow-hidden"
                        >
                          <span
                            className={`absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase shadow-xs ${
                              esAntes ? 'bg-[#0D1B3E] text-white' : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {esAntes ? 'ANTES' : 'DESPUÉS'}
                          </span>

                          {foto.url && !imgErrors[key] ? (
                            <img
                              src={foto.url}
                              alt={`Evidencia ${esAntes ? 'Antes' : 'Después'} ${idx + 1}`}
                              onError={() => setImgErrors((p) => ({ ...p, [key]: true }))}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-24 h-36 flex items-center justify-center p-1">
                              <DispositivoIlustracion esAntes={esAntes} className="w-full h-full" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-slate-400 font-mono text-xs border-2 border-dashed border-slate-200 rounded-xl">
                      No se han subido evidencias fotográficas en esta orden.
                    </div>
                  )}
                </div>
              </section>

              {/* 4. Piezas reemplazadas (RF-08) */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Piezas reemplazadas</h2>
                  {!esBloqueada ? (
                    <button
                      disabled={!puedeAgregarPieza}
                      onClick={() => {
                        setPiezaSeleccionada(null);
                        setModoPieza('crear');
                        setModalPiezaAbierto(true);
                      }}
                      title={
                        puedeAgregarPieza
                          ? 'Agregar pieza reemplazada'
                          : 'Disponible en las etapas Diagnóstico o Reparación'
                      }
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                      <span>Agregar pieza</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Bloqueado
                    </span>
                  )}
                </div>

                {!orden.refacciones || orden.refacciones.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
                      <Package className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Aún no hay piezas</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Se agregan en las etapas Diagnóstico o Reparación.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase font-bold">
                        <tr>
                          <th className="px-4 py-2.5">PIEZA</th>
                          <th className="px-4 py-2.5">TIPO</th>
                          <th className="px-4 py-2.5">NO. DE SERIE / LOTE</th>
                          {!esBloqueada && <th className="px-4 py-2.5 text-right">ACCIONES</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orden.refacciones.map((pieza) => {
                          const tipoChip = {
                            original: { label: 'Original', color: 'bg-blue-50 text-[#2452BF] border-blue-100' },
                            compatible: { label: 'Compatible', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                            reacondicionada: {
                              label: 'Reacondicionada',
                              color: 'bg-amber-50 text-amber-700 border-amber-200',
                            },
                          }[pieza.tipo] || { label: pieza.tipo, color: 'bg-slate-100 text-slate-700' };

                          return (
                            <tr key={pieza.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-900">{pieza.nombre}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${tipoChip.color}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {tipoChip.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                                {pieza.numero_serie || '—'}
                              </td>
                              {!esBloqueada && (
                                <td className="px-4 py-3 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setPiezaSeleccionada(pieza);
                                        setModoPieza('editar');
                                        setModalPiezaAbierto(true);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Editar pieza"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPiezaSeleccionada(pieza);
                                        setModalEliminarPiezaAbierto(true);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Eliminar pieza"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            {/* COLUMNA DERECHA */}
            <div className="lg:col-span-5 space-y-6">
              {/* 1. Cliente y equipo */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-3">
                  Cliente y equipo
                </h2>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0D1B3E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {cliente.nombre_completo
                      ? cliente.nombre_completo
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()
                      : 'CL'}
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      {cliente.nombre_completo || 'Sin nombre'}
                    </strong>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {cliente.telefono || 'Sin teléfono'}
                      {cliente.email ? ` · ${cliente.email}` : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Tipo</span>
                    <span className="font-semibold text-slate-800 capitalize">{disp.tipo || 'Dispositivo'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Marca / modelo</span>
                    <span className="font-bold text-slate-900">
                      {disp.marca} {disp.modelo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Color</span>
                    <span className="font-semibold text-slate-800">{disp.color || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">IMEI / Serie</span>
                    <span className="font-mono text-slate-900 font-semibold">{disp.imei_o_serie}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Accesorios</span>
                    <span className="text-slate-800 font-medium text-right">
                      {Array.isArray(orden.accesorios) && orden.accesorios.length > 0
                        ? orden.accesorios.join(', ')
                        : 'Ninguno'}
                    </span>
                  </div>
                  {disp.contrasena_equipo && (
                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100">
                      <span className="text-slate-500 font-medium">Contraseña/PIN</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {disp.contrasena_equipo}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reparaciones previas reales */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs">
                  <Clock className="w-4 h-4 text-[#2452BF] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-blue-950 block">
                      {disp.reparaciones_previas || 0}{' '}
                      {disp.reparaciones_previas === 1 ? 'reparación previa' : 'reparaciones previas'}
                    </span>
                    {disp.reparaciones_previas_detalle?.length > 0 ? (
                      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-blue-800 font-mono">
                        {disp.reparaciones_previas_detalle.map((prev) => (
                          <Link
                            key={prev.id}
                            to={`/ordenes/${prev.id}`}
                            className="hover:underline"
                          >
                            {prev.folio} ({prev.falla_reportada})
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-blue-800/80 font-mono">
                        Primera reparación registrada para este equipo.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* 2. Garantía */}
              <section
                ref={garantiaRef}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Garantía</h2>
                  {esBloqueada ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        garantiaVigente
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {orden.garantia?.estado || 'Sin garantía'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      Inicia al entregar
                    </span>
                  )}
                </div>

                {esBloqueada ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex items-baseline gap-1 text-slate-900 font-mono">
                        <strong className="text-xl font-black">{garantiaRestantes}</strong>
                        <span className="text-xs text-slate-500">
                          de {garantiaDias} días restantes
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${garantiaVigente ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${garantiaPorcentaje}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 pt-1 text-[11px] font-mono text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Inicio:</span>
                        <span>{formatearFechaSoloDia(orden.fecha_entrega)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vence:</span>
                        <span className="font-bold text-slate-800">
                          {formatearFechaSoloDia(orden.garantia?.fin)}
                        </span>
                      </div>
                    </div>

                    {orden.garantia?.terminos && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-sans">
                        {orden.garantia.terminos}
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleGuardarGarantia} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Días de cobertura</label>
                      <select
                        value={diasGarantia}
                        onChange={(e) => setDiasGarantia(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2452BF] text-xs text-slate-900 bg-white transition-all"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="0">0 días (Sin garantía)</option>
                        <option value="30">30 días</option>
                        <option value="60">60 días</option>
                        <option value="90">90 días</option>
                        <option value="180">180 días (6 meses)</option>
                        <option value="365">365 días (1 año)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Términos y exclusiones</label>
                      <textarea
                        rows={3}
                        required
                        value={terminosGarantia}
                        onChange={(e) => setTerminosGarantia(e.target.value)}
                        placeholder="Escribe qué cubre la garantía y qué no..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2452BF] text-xs text-slate-900 transition-all resize-none"
                      />
                    </div>

                    {diasGarantia !== '' && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        Vence {diasGarantia} días después de la fecha de entrega.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={guardandoGarantia}
                      className="w-full py-2.5 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      {guardandoGarantia ? 'Guardando...' : 'Guardar garantía'}
                    </button>
                  </form>
                )}
              </section>

              {/* 3. Certificado digital o Checklist para entregar */}
              {esBloqueada ? (
                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-3">
                    Certificado digital
                  </h2>

                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center justify-center shrink-0">
                      {certificadoQr ? (
                        <img src={certificadoQr} alt="QR Certificado" className="w-full h-full object-contain" />
                      ) : (
                        <QrCode className="w-10 h-10 text-slate-400" />
                      )}
                    </div>

                    <div className="space-y-1 text-xs min-w-0">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        TOKEN OFICIAL
                      </span>
                      <p className="font-mono text-[10px] text-slate-800 break-all leading-tight">
                        {orden.certificado?.token_uuid || '—'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        Emitido: {formatearFechaSoloDia(orden.certificado?.fecha_emision || orden.fecha_entrega)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={!orden.certificado?.token_uuid}
                      onClick={() => {
                        const url =
                          orden.certificado?.url_publica ||
                          `${window.location.origin}/verificar/${orden.certificado?.token_uuid}`;
                        navigator.clipboard.writeText(url);
                        mostrarToast('Enlace copiado', 'URL de verificación copiada al portapapeles');
                      }}
                      className="py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar enlace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalCertificadoAbierto(true)}
                      className="py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-white" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </section>
              ) : (
                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                  <h2 className="text-xs font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-2.5">
                    Para entregar y certificar
                  </h2>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      {(orden.evidencias?.antes?.length || 0) >= 1 ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                      <span
                        className={
                          (orden.evidencias?.antes?.length || 0) >= 1
                            ? 'text-slate-700 font-medium'
                            : 'text-amber-800 font-semibold'
                        }
                      >
                        Foto de recepción (antes)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {(orden.evidencias?.despues?.length || 0) >= 1 ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                      <span
                        className={
                          (orden.evidencias?.despues?.length || 0) >= 1
                            ? 'text-slate-700 font-medium'
                            : 'text-amber-800 font-semibold'
                        }
                      >
                        Foto de entrega (después)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {orden.garantia?.dias !== null &&
                      orden.garantia?.dias !== undefined &&
                      orden.garantia?.terminos ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                      <span
                        className={
                          orden.garantia?.dias !== null &&
                          orden.garantia?.dias !== undefined &&
                          orden.garantia?.terminos
                            ? 'text-slate-700 font-medium'
                            : 'text-amber-800 font-semibold'
                        }
                      >
                        {orden.garantia?.dias !== null &&
                        orden.garantia?.dias !== undefined &&
                        orden.garantia?.terminos
                          ? `Garantía guardada (${orden.garantia.dias} días)`
                          : 'Garantía sin guardar'}
                      </span>
                    </div>

                    {(() => {
                      const estadosHistorial = new Set(
                        (orden.historial || []).filter((h) => h.tipo === 'estado').map((h) => h.estado),
                      );
                      const pasoDiagnostico = estadosHistorial.has('Diagnóstico');
                      const pasoReparacion = estadosHistorial.has('Reparación');
                      const pasoPruebas = estadosHistorial.has('Pruebas');
                      const completos = pasoDiagnostico && pasoReparacion && pasoPruebas;

                      let faltanteTexto = '';
                      if (!pasoDiagnostico) faltanteTexto = 'Falta pasar por Diagnóstico';
                      else if (!pasoReparacion) faltanteTexto = 'Falta pasar por Reparación';
                      else if (!pasoPruebas) faltanteTexto = 'Falta pasar por Pruebas';

                      return (
                        <div className="flex items-center gap-2">
                          {completos ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span
                            className={completos ? 'text-slate-700 font-medium' : 'text-amber-800 font-semibold'}
                          >
                            {completos
                              ? 'Pasó por Diagnóstico, Reparación y Pruebas'
                              : faltanteTexto}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOAST FLOTANTE */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-[#0B0D12] px-4 py-3 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{toast.titulo}</p>
            <p className="text-[10px] text-slate-500 font-mono">{toast.subtitulo}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MODALES */}
      <VerFotoModal
        isOpen={modalFotoAbierto}
        fotos={todasEvidencias}
        fotoActualIndex={fotoActualIndex}
        setFotoActualIndex={setFotoActualIndex}
        onClose={() => setModalFotoAbierto(false)}
        bloqueada={esBloqueada}
        folio={orden.folio}
        equipo={`${disp.marca} ${disp.modelo}`}
        tecnicoNombre={orden.tecnico?.nombre}
      />

      <PiezaModal
        isOpen={modalPiezaAbierto}
        mode={modoPieza}
        pieza={piezaSeleccionada}
        folio={orden.folio}
        equipo={`${disp.marca} ${disp.modelo}`}
        estado={orden.estado}
        onClose={() => setModalPiezaAbierto(false)}
        onSave={handleGuardarPieza}
        onDeleteClick={() => {
          setModalPiezaAbierto(false);
          setModalEliminarPiezaAbierto(true);
        }}
      />

      <EliminarPiezaModal
        isOpen={modalEliminarPiezaAbierto}
        pieza={piezaSeleccionada}
        folio={orden.folio}
        equipo={`${disp.marca} ${disp.modelo}`}
        onClose={() => setModalEliminarPiezaAbierto(false)}
        onConfirm={handleEliminarPieza}
      />

      <SubirFotoModal
        isOpen={modalSubirFotoAbierto}
        folio={orden.folio}
        equipo={`${disp.marca} ${disp.modelo}`}
        estado={orden.estado}
        conteoAntes={orden.evidencias?.antes?.length || 0}
        conteoDespues={orden.evidencias?.despues?.length || 0}
        onClose={() => setModalSubirFotoAbierto(false)}
        onUpload={handleSubirFoto}
      />

      <NotificarClienteModal
        isOpen={modalNotificarAbierto}
        orden={orden}
        onClose={() => setModalNotificarAbierto(false)}
        onSend={handleNotificar}
      />

      <AvanzarEstadoModal
        isOpen={modalAvanzarAbierto}
        orden={orden}
        estadoActual={orden.estado}
        siguienteEstado={siguienteEstado || ''}
        onClose={() => setModalAvanzarAbierto(false)}
        onConfirmAvanzar={handleAvanzarEstado}
        onAbrirSubirFoto={() => setModalSubirFotoAbierto(true)}
        onFocusGarantia={() => {
          if (garantiaRef.current) {
            garantiaRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      <EditarEstadoInicialModal
        isOpen={modalEditarInicialAbierto}
        orden={orden}
        onClose={() => setModalEditarInicialAbierto(false)}
        onSave={handleGuardarEstadoInicial}
      />

      <NotaServicioModal
        isOpen={modalNotaServicioAbierto}
        ordenId={orden.id}
        onClose={() => setModalNotaServicioAbierto(false)}
      />

      <CertificadoModal
        isOpen={modalCertificadoAbierto}
        ordenId={orden.id}
        onClose={() => setModalCertificadoAbierto(false)}
      />
    </div>
  );
}
