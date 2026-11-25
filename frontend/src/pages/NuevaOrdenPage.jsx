/**
 * @file NuevaOrdenPage.jsx
 * @description Recepción de órdenes con búsqueda/actualización de clientes, reutilización de equipos por IMEI/SN,
 *              tipos de dispositivo extendidos y redirección a la nota de servicio imprimible con QR (P6 / P12).
 * @task T11 (RF-02, RF-03, RF-04, RF-05, RF-07)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import {
  Search,
  CheckCircle2,
  Users,
  Camera,
  X,
  Plus,
  Check,
  AlertCircle,
  Smartphone,
  Tablet,
  Laptop,
  Printer,
  Monitor,
  HardDrive,
  ChevronDown,
  Edit3,
  History,
} from 'lucide-react';

const TIPOS_DISPOSITIVO = [
  { value: 'celular', label: 'Celular', icon: Smartphone },
  { value: 'tablet', label: 'Tablet', icon: Tablet },
  { value: 'laptop', label: 'Laptop', icon: Laptop },
  { value: 'impresora', label: 'Impresora', icon: Printer },
  { value: 'pc_escritorio', label: 'PC de escritorio', icon: Monitor },
  { value: 'otro', label: 'Otro equipo', icon: HardDrive },
];

const PLACEHOLDERS_EQUIPO = {
  celular: { marca: 'Ej. Samsung, Apple', modelo: 'Ej. Galaxy A54 5G' },
  tablet: { marca: 'Ej. Apple, Samsung', modelo: 'Ej. iPad Air 5' },
  laptop: { marca: 'Ej. HP, Dell, Apple', modelo: 'Ej. Pavilion 15' },
  impresora: { marca: 'Ej. Epson, HP, Canon', modelo: 'Ej. EcoTank L3110' },
  pc_escritorio: { marca: 'Ej. Dell, HP, Ensamblada', modelo: 'Ej. OptiPlex 7090' },
  otro: { marca: 'Ej. Sony, Nintendo', modelo: 'Ej. Consola o equipo' },
};

const ACCESORIOS_PREDEFINIDOS = [
  'Cargador / Adaptador',
  'Cable de corriente',
  'Funda / Maletín',
  'Tarjeta SIM',
  'Memoria SD / USB',
  'Ninguno',
];

/**
 * Extrae el ID numérico de una orden recién creada sin importar cómo venga anidada la respuesta.
 *
 * @param {Object|null|undefined} res Respuesta JSON del endpoint POST /api/ordenes.
 * @returns {number|string|null} Identificador de la orden o null si no se encuentra.
 */
function extraerIdOrdenCreada(res) {
  if (!res) return null;
  return (
    res?.orden?.id ??
    res?.id ??
    res?.data?.orden?.id ??
    res?.data?.id ??
    null
  );
}

/**
 * Pantalla de alta de nueva orden de reparación con prevención de clientes y equipos duplicados.
 *
 * @returns {JSX.Element} Formulario de recepción en dos columnas con resumen reactivo.
 */
export default function NuevaOrdenPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre_cliente: '',
    telefono_cliente: '',
    email_cliente: '',
    tipo_dispositivo: 'celular',
    marca: '',
    modelo: '',
    color: '',
    imei_o_serie: '',
    contrasena_equipo: '',
    falla_reportada: '',
    condicion_fisica: '',
    accesorios: [],
  });

  // Búsqueda y reutilización de cliente existente
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);
  const [clienteExistente, setClienteExistente] = useState(null);
  const [editandoTelCliente, setEditandoTelCliente] = useState(false);
  const [nuevoTelCliente, setNuevoTelCliente] = useState('');
  const [actualizandoTel, setActualizandoTel] = useState(false);

  // Equipos previos del cliente y detección por IMEI/SN
  const [equiposCliente, setEquiposCliente] = useState([]);
  const [dispositivoExistente, setDispositivoExistente] = useState(null);

  const [folioEstimado, setFolioEstimado] = useState('RP-2026-0001');
  const [fotos, setFotos] = useState([]);
  const [otroAccesorio, setOtroAccesorio] = useState('');
  const [mostrarOtroInput, setMostrarOtroInput] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular folio estimado
  useEffect(() => {
    apiRequest('/api/ordenes?por_pagina=1')
      .then((data) => {
        const anio = new Date().getFullYear();
        let siguienteNum = 1;
        const ultimaOrden = data.ordenes?.[0];
        if (ultimaOrden?.folio) {
          const num = parseInt(ultimaOrden.folio.split('-')[2], 10);
          if (!isNaN(num)) siguienteNum = num + 1;
        } else if (data.resumen?.total || data.total) {
          siguienteNum = (data.resumen?.total || data.total) + 1;
        }
        setFolioEstimado(`RP-${anio}-${String(siguienteNum).padStart(4, '0')}`);
      })
      .catch(() => {
        setFolioEstimado(`RP-${new Date().getFullYear()}-0001`);
      });
  }, []);

  // Buscador de clientes por nombre, teléfono o correo (evita duplicados)
  useEffect(() => {
    const q = busquedaCliente.trim();
    if (q.length < 2 || clienteExistente) {
      setSugerenciasClientes([]);
      return;
    }
    const timer = setTimeout(() => {
      apiRequest(`/api/clientes?q=${encodeURIComponent(q)}`)
        .then((data) => setSugerenciasClientes((data.clientes || []).slice(0, 5)))
        .catch(() => setSugerenciasClientes([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaCliente, clienteExistente]);

  // Búsqueda automática por teléfono exacto de 10 dígitos si no se seleccionó del buscador
  useEffect(() => {
    if (clienteExistente) return;
    const tel = formData.telefono_cliente.replace(/\D/g, '');
    if (tel.length === 10) {
      apiRequest(`/api/clientes?telefono=${tel}`)
        .then((data) => {
          if (data.cliente) seleccionarClienteExistente(data.cliente);
        })
        .catch(() => {});
    }
  }, [formData.telefono_cliente]);

  // Detección automática de equipo recurrente por IMEI o S/N
  useEffect(() => {
    const serie = formData.imei_o_serie.trim();
    const validoParaBuscar =
      formData.tipo_dispositivo === 'celular' ? serie.length === 15 : serie.length >= 4;

    if (!validoParaBuscar) {
      setDispositivoExistente(null);
      return;
    }

    const timer = setTimeout(() => {
      apiRequest(`/api/dispositivos?imei_o_serie=${encodeURIComponent(serie)}`)
        .then((data) => {
          if (data.dispositivo) {
            setDispositivoExistente(data.dispositivo);
            setFormData((prev) => ({
              ...prev,
              tipo_dispositivo: data.dispositivo.tipo || prev.tipo_dispositivo,
              marca: data.dispositivo.marca || prev.marca,
              modelo: data.dispositivo.modelo || prev.modelo,
              color: data.dispositivo.color || prev.color,
            }));
          }
        })
        .catch(() => setDispositivoExistente(null));
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.imei_o_serie, formData.tipo_dispositivo]);

  /**
   * Selecciona un cliente existente y carga sus dispositivos registrados para reutilizarlos en un clic.
   *
   * @param {Object} cli Objeto cliente seleccionado.
   * @returns {Promise<void>}
   */
  const seleccionarClienteExistente = async (cli) => {
    setClienteExistente(cli);
    setSugerenciasClientes([]);
    setBusquedaCliente('');
    setEditandoTelCliente(false);
    setNuevoTelCliente(cli.telefono || '');
    setFormData((prev) => ({
      ...prev,
      nombre_cliente: cli.nombre_completo || '',
      telefono_cliente: cli.telefono || '',
      email_cliente: cli.email || '',
    }));

    try {
      const ficha = await apiRequest(`/api/clientes/${cli.id}`);
      setEquiposCliente(ficha.dispositivos || []);
    } catch {
      setEquiposCliente([]);
    }
  };

  /**
   * Desvincula al cliente seleccionado para registrar un cliente nuevo (p. ej. homónimo).
   *
   * @returns {void}
   */
  const limpiarClienteSeleccionado = () => {
    setClienteExistente(null);
    setEquiposCliente([]);
    setEditandoTelCliente(false);
    setDispositivoExistente(null);
    setFormData((prev) => ({
      ...prev,
      nombre_cliente: '',
      telefono_cliente: '',
      email_cliente: '',
    }));
  };

  /**
   * Actualiza el teléfono de un cliente recurrente en la BD conservando su historial (RF-02).
   *
   * @returns {Promise<void>}
   */
  const handleActualizarTelefonoCliente = async () => {
    if (!clienteExistente?.id) return;
    const telLimpio = nuevoTelCliente.replace(/\D/g, '');
    if (telLimpio.length !== 10) {
      setError('El nuevo teléfono debe contener exactamente 10 dígitos.');
      return;
    }

    try {
      setActualizandoTel(true);
      setError(null);
      const res = await apiRequest(`/api/clientes/${clienteExistente.id}`, {
        method: 'PATCH',
        body: { telefono: telLimpio },
      });
      setClienteExistente(res.cliente);
      setFormData((prev) => ({ ...prev, telefono_cliente: res.cliente.telefono }));
      setEditandoTelCliente(false);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el teléfono del cliente.');
    } finally {
      setActualizandoTel(false);
    }
  };

  /**
   * Rellena la sección de dispositivo con un equipo previo del cliente seleccionado.
   *
   * @param {Object} eq Dispositivo registrado previamente.
   * @returns {void}
   */
  const seleccionarEquipoPrevio = (eq) => {
    setDispositivoExistente(eq);
    setFormData((prev) => ({
      ...prev,
      tipo_dispositivo: eq.tipo || 'otro',
      marca: eq.marca || '',
      modelo: eq.modelo || '',
      color: eq.color || '',
      imei_o_serie: eq.imei_o_serie || '',
    }));
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const seleccionarTipoDispositivo = (tipo) => {
    setFormData((prev) => ({ ...prev, tipo_dispositivo: tipo }));
    setDropdownAbierto(false);
    setError(null);
  };

  const toggleAccesorio = (acc) => {
    setError(null);
    setFormData((prev) => {
      if (acc === 'Ninguno') {
        return { ...prev, accesorios: prev.accesorios.includes('Ninguno') ? [] : ['Ninguno'] };
      }
      const sinNinguno = prev.accesorios.filter((a) => a !== 'Ninguno');
      const existe = sinNinguno.includes(acc);
      return {
        ...prev,
        accesorios: existe ? sinNinguno.filter((a) => a !== acc) : [...sinNinguno, acc],
      };
    });
  };

  const handleAgregarOtroAccesorio = () => {
    if (otroAccesorio.trim() && !formData.accesorios.includes(otroAccesorio.trim())) {
      setFormData((prev) => ({
        ...prev,
        accesorios: [...prev.accesorios.filter((a) => a !== 'Ninguno'), otroAccesorio.trim()],
      }));
      setOtroAccesorio('');
      setMostrarOtroInput(false);
      setError(null);
    }
  };

  /**
   * Valida formato (JPG/PNG), tamaño (<= 5 MB) y límite (5 fotos) de las evidencias iniciales (RF-05, RF-07).
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e Evento de selección de archivos.
   * @returns {void}
   */
  const handleFotoUpload = (e) => {
    setError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxBytes = 5 * 1024 * 1024;

    for (const f of files) {
      if (!formatosPermitidos.includes(f.type) && !/\.(jpg|jpeg|png)$/i.test(f.name)) {
        setError(`El archivo "${f.name}" no es compatible. Solo se permiten imágenes JPG o PNG.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (f.size > maxBytes) {
        setError(`El archivo "${f.name}" supera el límite máximo permitido de 5 MB.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    const disponibles = 5 - fotos.length;
    if (files.length > disponibles) {
      setError('Solo puedes adjuntar hasta 5 fotografías de recepción en total.');
    }

    const porAgregar = files.slice(0, disponibles).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setFotos((prev) => [...prev, ...porAgregar]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const eliminarFoto = (id) => {
    setFotos((prev) => {
      const aEliminar = prev.find((f) => f.id === id);
      if (aEliminar?.previewUrl) URL.revokeObjectURL(aEliminar.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  // Validaciones reactivas
  const esCelular = formData.tipo_dispositivo === 'celular';
  const nombreLleno = formData.nombre_cliente.trim().length > 0;
  const telefonoLimpio = formData.telefono_cliente.replace(/\D/g, '');
  const telefonoValido = telefonoLimpio.length === 10;
  const datosClienteCompletos = nombreLleno && telefonoValido;

  const imeiLleno = formData.imei_o_serie.trim().length > 0;
  const imeiValido = esCelular
    ? formData.imei_o_serie.trim().length === 15 && !isNaN(formData.imei_o_serie.trim())
    : formData.imei_o_serie.trim().length >= 4 && formData.imei_o_serie.trim().length <= 30;

  const marcaLlena = formData.marca.trim().length > 0;
  const modeloLleno = formData.modelo.trim().length > 0;
  const fallaValida = formData.falla_reportada.trim().length > 0;
  const condicionValida = formData.condicion_fisica.trim().length > 0;
  const accesoriosValidos = formData.accesorios.length > 0;
  const fotosValidas = fotos.length >= 1;

  const nombreRecibe = user?.nombre || user?.email || '—';
  const formularioListo =
    datosClienteCompletos &&
    imeiValido &&
    marcaLlena &&
    modeloLleno &&
    fallaValida &&
    condicionValida &&
    accesoriosValidos &&
    fotosValidas;

  const tipoActual =
    TIPOS_DISPOSITIVO.find((t) => t.value === formData.tipo_dispositivo) || TIPOS_DISPOSITIVO[0];
  const IconoTipoActual = tipoActual.icon;
  const placeholders = PLACEHOLDERS_EQUIPO[formData.tipo_dispositivo] || PLACEHOLDERS_EQUIPO.otro;

  /**
   * Crea o reutiliza cliente y dispositivo, registra la orden y abre la nota de servicio imprimible (P12).
   *
   * @param {React.FormEvent<HTMLFormElement>} e Evento de envío del formulario.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (
      !datosClienteCompletos ||
      !marcaLlena ||
      !modeloLleno ||
      !imeiValido ||
      !fallaValida ||
      !condicionValida ||
      !accesoriosValidos ||
      !fotosValidas
    ) {
      setError('Por favor completa todos los campos obligatorios y adjunta al menos 1 fotografía.');
      setLoading(false);
      return;
    }

    try {
      // 1. Resolver Cliente
      let clienteId = clienteExistente?.id;
      if (!clienteId) {
        try {
          const resCli = await apiRequest('/api/clientes', {
            method: 'POST',
            body: {
              nombre_completo: formData.nombre_cliente.trim(),
              telefono: telefonoLimpio,
              email: formData.email_cliente.trim() || undefined,
              aviso_privacidad: true,
            },
          });
          clienteId = resCli.cliente.id;
        } catch (err) {
          if (err.data?.cliente?.id) {
            clienteId = err.data.cliente.id;
          } else {
            throw err;
          }
        }
      }

      // 2. Resolver Dispositivo (reutiliza si ya existe por IMEI/SN)
      let dispositivoId = dispositivoExistente?.id;
      if (!dispositivoId) {
        try {
          const resDisp = await apiRequest('/api/dispositivos', {
            method: 'POST',
            body: {
              cliente_id: clienteId,
              tipo: formData.tipo_dispositivo,
              marca: formData.marca.trim(),
              modelo: formData.modelo.trim(),
              color: formData.color.trim() || undefined,
              imei_o_serie: formData.imei_o_serie.trim(),
              contrasena_equipo: formData.contrasena_equipo.trim() || undefined,
            },
          });
          dispositivoId = resDisp.dispositivo.id;
        } catch (err) {
          if (err.data?.dispositivo?.id) {
            dispositivoId = err.data.dispositivo.id;
          } else {
            throw err;
          }
        }
      }

      // 3. Crear Orden con fotos multipart
      const orderData = new FormData();
      orderData.append('dispositivo_id', dispositivoId);
      orderData.append('falla_reportada', formData.falla_reportada.trim());
      orderData.append('condicion_fisica', formData.condicion_fisica.trim());
      orderData.append('accesorios', JSON.stringify(formData.accesorios));
      fotos.forEach((f) => orderData.append('fotos', f.file));

      const resOrden = await apiRequest('/api/ordenes', {
        method: 'POST',
        body: orderData,
        isFormData: true,
      });

      const ordenCreadaId = extraerIdOrdenCreada(resOrden);
      if (ordenCreadaId) {
        navigate(`/ordenes/${ordenCreadaId}/nota`);
      } else {
        const folioGenerado = resOrden?.orden?.folio || resOrden?.folio;
        if (folioGenerado) {
          const lista = await apiRequest(`/api/ordenes?q=${encodeURIComponent(folioGenerado)}`);
          const encontrada =
            lista?.ordenes?.find((o) => o.folio === folioGenerado) || lista?.ordenes?.[0];
          if (encontrada?.id) {
            navigate(`/ordenes/${encontrada.id}/nota`);
            return;
          }
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al registrar la orden en el sistema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col font-sans pb-16">
      {/* Barra superior */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link to="/dashboard" className="hover:text-[#24529F] transition-colors">
            Inicio
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">Nueva orden</span>
        </nav>
      </header>

      {/* Encabezado */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B0D12] tracking-tight">
            Nueva orden de reparación
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Busca un cliente recurrente o registra uno nuevo. Al guardar se abrirá la nota imprimible con QR.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
        >
          Cancelar
        </Link>
      </div>

      {/* Contenido en 2 columnas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Verifica la información</span>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMNA IZQUIERDA (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* CARD 1: CLIENTE */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    {datosClienteCompletos ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#0D1B3E] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
                        1
                      </div>
                    )}
                    <h2 className="font-bold text-base text-[#0B0D12]">Cliente</h2>
                  </div>

                  {clienteExistente && (
                    <button
                      type="button"
                      onClick={limpiarClienteSeleccionado}
                      className="text-xs font-semibold text-[#24529F] hover:underline cursor-pointer"
                    >
                      Cambiar / Registrar cliente nuevo
                    </button>
                  )}
                </div>

                {/* Buscador rápido de cliente existente */}
                {!clienteExistente && (
                  <div className="relative">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      ¿Ya ha venido antes? Búscalo por nombre, teléfono o correo
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
                      <input
                        type="text"
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                        placeholder="Ej. Adair Hernandez o 3312345678..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#24529F]"
                      />
                    </div>
                    {sugerenciasClientes.length > 0 && (
                      <div className="mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 overflow-hidden">
                        {sugerenciasClientes.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => seleccionarClienteExistente(c)}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">{c.nombre_completo}</p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                {c.telefono} {c.email ? `· ${c.email}` : ''}
                              </p>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#24529F] border border-blue-200 shrink-0">
                              Seleccionar
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Banner de cliente existente con opción de actualizar teléfono */}
                {clienteExistente && (
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Users className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-[#1E3A8A]">
                            Cliente recurrente vinculado: {clienteExistente.nombre_completo}
                          </p>
                          <p className="text-[11px] text-[#2563EB] mt-0.5">
                            Esta orden se sumará a su historial existente sin duplicar su registro.
                          </p>
                        </div>
                      </div>
                      {!editandoTelCliente && (
                        <button
                          type="button"
                          onClick={() => setEditandoTelCliente(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E3A8A] hover:underline shrink-0 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          ¿Cambió de teléfono?
                        </button>
                      )}
                    </div>

                    {editandoTelCliente && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-200/80">
                        <input
                          type="tel"
                          maxLength={10}
                          value={nuevoTelCliente}
                          onChange={(e) => setNuevoTelCliente(e.target.value)}
                          placeholder="Nuevo teléfono (10 dígitos)"
                          className="bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-mono w-48 focus:outline-none focus:border-[#24529F]"
                        />
                        <button
                          type="button"
                          disabled={actualizandoTel}
                          onClick={handleActualizarTelefonoCliente}
                          className="px-3 py-1.5 rounded-lg bg-[#0D1B3E] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          {actualizandoTel ? 'Guardando...' : 'Actualizar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoTelCliente(false)}
                          className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="nombre_cliente"
                      required
                      disabled={Boolean(clienteExistente)}
                      value={formData.nombre_cliente}
                      onChange={handleChange}
                      placeholder="Ej. Carlos Mendoza"
                      className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-500 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#24529F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Teléfono *
                    </label>
                    <input
                      type="text"
                      name="telefono_cliente"
                      required
                      maxLength={10}
                      disabled={Boolean(clienteExistente)}
                      value={formData.telefono_cliente}
                      onChange={handleChange}
                      placeholder="Ej. 3312345678"
                      className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-500 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#24529F]"
                    />
                    {telefonoValido && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ 10 dígitos</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Correo (opcional)
                    </label>
                    <input
                      type="email"
                      name="email_cliente"
                      disabled={Boolean(clienteExistente)}
                      value={formData.email_cliente}
                      onChange={handleChange}
                      placeholder="Ej. cliente@correo.com"
                      className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-500 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#24529F]"
                    />
                  </div>
                </div>
              </section>

              {/* CARD 2: DISPOSITIVO */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#0D1B3E] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      2
                    </div>
                    <h2 className="font-bold text-base text-[#0B0D12]">Dispositivo</h2>
                  </div>
                  {dispositivoExistente && (
                    <button
                      type="button"
                      onClick={() => {
                        setDispositivoExistente(null);
                        setFormData((prev) => ({
                          ...prev,
                          marca: '',
                          modelo: '',
                          imei_o_serie: '',
                          color: '',
                        }));
                      }}
                      className="text-xs font-semibold text-[#24529F] hover:underline cursor-pointer"
                    >
                      Registrar otro equipo
                    </button>
                  )}
                </div>

                {/* Equipos previos del cliente seleccionado */}
                {equiposCliente.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Equipos registrados de este cliente (clic para reutilizar y acumular historial):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {equiposCliente.map((eq) => {
                        const seleccionado = dispositivoExistente?.id === eq.id;
                        return (
                          <button
                            key={eq.id}
                            type="button"
                            onClick={() => seleccionarEquipoPrevio(eq)}
                            className={`px-3 py-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              seleccionado
                                ? 'bg-blue-50 border-[#24529F] text-[#0D1B3E]'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className="font-semibold block">
                              {eq.marca} {eq.modelo}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {eq.imei_o_serie}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {dispositivoExistente && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-800">
                    <History className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Equipo reconocido por su {esCelular ? 'IMEI' : 'S/N'}. Esta orden se agregará a su historial técnico (RF-15).
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Desplegable de Tipo de Dispositivo */}
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Tipo de dispositivo *
                    </label>
                    <button
                      type="button"
                      onClick={() => setDropdownAbierto(!dropdownAbierto)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 flex items-center justify-between transition-all focus:outline-none focus:border-[#24529F] shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <IconoTipoActual className="w-4 h-4 text-[#24529F]" />
                        <span className="font-medium">{tipoActual.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          dropdownAbierto ? 'rotate-180 text-[#24529F]' : ''
                        }`}
                      />
                    </button>

                    {dropdownAbierto && (
                      <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5">
                        {TIPOS_DISPOSITIVO.map((t) => {
                          const Icono = t.icon;
                          const seleccionado = t.value === formData.tipo_dispositivo;
                          return (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => seleccionarTipoDispositivo(t.value)}
                              className={`w-full px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                seleccionado
                                  ? 'bg-blue-50 text-[#24529F] font-semibold'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icono className={`w-4 h-4 ${seleccionado ? 'text-[#24529F]' : 'text-slate-400'}`} />
                                <span>{t.label}</span>
                              </div>
                              {seleccionado && <Check className="w-3.5 h-3.5 text-[#24529F]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Marca *
                      </label>
                      <input
                        type="text"
                        name="marca"
                        required
                        value={formData.marca}
                        onChange={handleChange}
                        placeholder={placeholders.marca}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#24529F]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Modelo *
                      </label>
                      <input
                        type="text"
                        name="modelo"
                        required
                        value={formData.modelo}
                        onChange={handleChange}
                        placeholder={placeholders.modelo}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#24529F]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Contraseña (opcional)
                      </label>
                      <input
                        type="text"
                        name="contrasena_equipo"
                        value={formData.contrasena_equipo}
                        onChange={handleChange}
                        placeholder="Ej. 1234 o patrón"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#24529F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      {esCelular ? 'IMEI *' : 'Número de serie (S/N) *'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="imei_o_serie"
                        required
                        value={formData.imei_o_serie}
                        onChange={handleChange}
                        placeholder={esCelular ? 'Ej. 356984091234567' : 'Ej. SN-ABC12345678'}
                        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none transition-all ${
                          imeiLleno && !imeiValido
                            ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 focus:border-[#24529F]'
                        }`}
                      />
                      {esCelular && (
                        <span className="absolute right-3.5 top-2.5 text-[11px] font-mono text-slate-400 select-none">
                          {formData.imei_o_serie.length}/15
                        </span>
                      )}
                    </div>
                    {imeiLleno && !imeiValido && (
                      <p className="text-[11px] text-rose-600 mt-1">
                        {esCelular
                          ? 'El IMEI debe contener exactamente 15 dígitos numéricos'
                          : 'El número de serie (S/N) debe tener entre 4 y 30 caracteres'}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* CARD 3: ESTADO INICIAL */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#0D1B3E] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      3
                    </div>
                    <h2 className="font-bold text-base text-[#0B0D12]">Estado inicial</h2>
                  </div>
                  <span className="text-xs text-slate-400">
                    Esta información queda asentada en la nota de recepción
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Falla reportada por el cliente *
                    </label>
                    <textarea
                      name="falla_reportada"
                      required
                      rows={3}
                      value={formData.falla_reportada}
                      onChange={handleChange}
                      placeholder="Ej. No enciende o no detecta cartuchos de tinta..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#24529F] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Condición física *
                    </label>
                    <textarea
                      name="condicion_fisica"
                      required
                      rows={3}
                      value={formData.condicion_fisica}
                      onChange={handleChange}
                      placeholder="Ej. Carcasa con rayones leves de uso; pantalla sin grietas."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#24529F] resize-none"
                    />
                  </div>
                </div>

                {/* Accesorios recibidos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Accesorios recibidos *
                    </label>
                    {!accesoriosValidos && (
                      <span className="text-[11px] text-amber-600 font-medium">
                        Selecciona al menos uno o marca &ldquo;Ninguno&rdquo;
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {ACCESORIOS_PREDEFINIDOS.map((acc) => {
                      const activo = formData.accesorios.includes(acc);
                      return (
                        <button
                          key={acc}
                          type="button"
                          onClick={() => toggleAccesorio(acc)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            activo
                              ? 'border-blue-600 bg-blue-50 text-[#1E3A8A] shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                              activo ? 'bg-[#24529F] text-white' : 'border border-slate-300'
                            }`}
                          >
                            {activo && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <span>{acc}</span>
                        </button>
                      );
                    })}

                    {formData.accesorios
                      .filter((a) => !ACCESORIOS_PREDEFINIDOS.includes(a))
                      .map((cust) => (
                        <span
                          key={cust}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 text-[#1E3A8A] border border-blue-600"
                        >
                          <Check className="w-3 h-3 text-[#24529F]" />
                          <span>{cust}</span>
                          <button
                            type="button"
                            onClick={() => toggleAccesorio(cust)}
                            className="text-slate-400 hover:text-rose-600 ml-0.5 font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                    {mostrarOtroInput ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={otroAccesorio}
                          onChange={(e) => setOtroAccesorio(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarOtroAccesorio())}
                          placeholder="Ej. Cable USB, Mouse..."
                          autoFocus
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-xl w-36 focus:outline-none focus:border-[#24529F]"
                        />
                        <button
                          type="button"
                          onClick={handleAgregarOtroAccesorio}
                          className="px-2.5 py-1 bg-[#0D1B3E] text-white text-xs rounded-xl font-medium cursor-pointer"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setMostrarOtroInput(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMostrarOtroInput(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Otro...</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Fotografías de recepción */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Fotografías de recepción *{' '}
                    <span className="text-slate-400 font-normal">· mínimo 1, máximo 5 · JPG o PNG hasta 5 MB</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={handleFotoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    {fotos.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-36 h-36 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer group shrink-0"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#24529F] border border-blue-100 mb-2 group-hover:scale-105 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Tomar o subir foto</span>
                        <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          Arrastra aquí o usa la cámara
                        </span>
                      </button>
                    )}

                    {fotos.map((foto) => (
                      <div
                        key={foto.id}
                        className="w-36 h-36 rounded-2xl overflow-hidden relative border border-slate-200 bg-slate-100 shrink-0 shadow-sm"
                      >
                        <img
                          src={foto.previewUrl}
                          alt="Evidencia recepción"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-[#0D1B3E]/90 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-sm">
                          ANTES
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarFoto(foto.id)}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-rose-600 text-white rounded-full p-1 transition-colors shadow-sm cursor-pointer"
                          title="Eliminar foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="w-28 h-36 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-xs font-mono text-slate-400 shrink-0">
                      {fotos.length} / 5
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* COLUMNA DERECHA: RESUMEN (4 cols) */}
            <div className="lg:col-span-4 sticky top-20 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-[#0B0D12]">Resumen</h3>

                <div className="bg-[#0D1B3E] rounded-2xl p-4 text-white shadow-inner space-y-2.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                    FOLIO A GENERAR
                  </span>
                  <div className="text-xl font-bold font-mono tracking-wide text-white">
                    {folioEstimado}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                    <span className="text-slate-300">Estado inicial</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-slate-900 font-semibold text-[11px] shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                      Recibido
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Cliente</span>
                    <span className="font-medium text-slate-900 truncate max-w-[180px] text-right">
                      {formData.nombre_cliente.trim() || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Equipo</span>
                    <span className="font-medium text-slate-900 truncate max-w-[180px] text-right">
                      {formData.marca.trim() || formData.modelo.trim()
                        ? `${formData.marca.trim()} ${formData.modelo.trim()}`.trim()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Accesorios</span>
                    <span className="font-medium text-slate-900 truncate max-w-[180px] text-right">
                      {formData.accesorios.length > 0 ? formData.accesorios.join(', ') : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Fotos</span>
                    <span className="font-medium text-slate-900">
                      {fotos.length} de recepción
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Recibe</span>
                    <span className="font-medium text-slate-900 truncate max-w-[180px] text-right">
                      {nombreRecibe}
                    </span>
                  </div>
                </div>

                {/* Checklist reactivo */}
                <div className="space-y-1.5 text-xs">
                  {datosClienteCompletos ? (
                    <div className="text-emerald-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Datos del cliente completos</span>
                    </div>
                  ) : (
                    <div className="text-amber-600 font-medium flex items-center gap-1.5">
                      <span className="w-3.5 text-center font-bold">•</span>
                      <span>Datos del cliente pendientes</span>
                    </div>
                  )}

                  {imeiValido ? (
                    <div className="text-emerald-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{esCelular ? 'IMEI válido' : 'Número de serie (S/N) válido'}</span>
                    </div>
                  ) : imeiLleno ? (
                    <div className="text-rose-600 font-medium flex items-center gap-1.5">
                      <span className="w-3.5 text-center font-bold">✕</span>
                      <span>
                        {esCelular
                          ? `IMEI incompleto (${formData.imei_o_serie.length}/15)`
                          : 'S/N inválido (4 a 30 caracteres)'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-amber-600 font-medium flex items-center gap-1.5">
                      <span className="w-3.5 text-center font-bold">•</span>
                      <span>{esCelular ? 'IMEI pendiente' : 'Número de serie (S/N) pendiente'}</span>
                    </div>
                  )}

                  {fallaValida && condicionValida && accesoriosValidos && fotosValidas ? (
                    <div className="text-emerald-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Estado inicial y fotos listos</span>
                    </div>
                  ) : (
                    <div className="text-amber-600 font-medium flex items-center gap-1.5">
                      <span className="w-3.5 text-center font-bold">•</span>
                      <span>Falla, accesorios o fotos pendientes</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !formularioListo}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${
                    formularioListo && !loading
                      ? 'bg-[#24529F] hover:bg-[#1a3d7c] text-white active:scale-[0.98] cursor-pointer'
                      : 'bg-slate-300 text-white cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Creando orden...' : 'Crear orden y generar nota QR'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}