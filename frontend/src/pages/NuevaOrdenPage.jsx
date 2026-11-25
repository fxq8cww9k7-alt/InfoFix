/**
 * @file NuevaOrdenPage.jsx
 * @description Pantalla para el registro de nuevos clientes, dispositivos y creación de órdenes (P6).
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
} from 'lucide-react';

const TIPOS_DISPOSITIVO = [
  { value: 'celular', apiTipo: 'celular', label: 'Celular', icon: Smartphone },
  { value: 'tablet', apiTipo: 'tablet', label: 'Tablet', icon: Tablet },
  { value: 'laptop', apiTipo: 'laptop', label: 'Laptop', icon: Laptop },
  { value: 'pc_escritorio', apiTipo: 'otro', label: 'PC de escritorio', icon: Monitor },
  { value: 'impresora', apiTipo: 'otro', label: 'Impresora', icon: Printer },
  { value: 'otro', apiTipo: 'otro', label: 'Otro equipo', icon: HardDrive },
];

const PLACEHOLDERS_EQUIPO = {
  celular: { marca: 'Ej. Samsung, Apple', modelo: 'Ej. Galaxy A54 5G' },
  tablet: { marca: 'Ej. Apple, Samsung', modelo: 'Ej. iPad Air 5' },
  laptop: { marca: 'Ej. HP, Dell, Apple', modelo: 'Ej. Pavilion 15' },
  impresora: { marca: 'Ej. Epson, HP, Canon', modelo: 'Ej. EcoTank L3250' },
  pc_escritorio: { marca: 'Ej. Dell, HP, Ensamblada', modelo: 'Ej. OptiPlex 7090' },
  otro: { marca: 'Ej. Sony, Nintendo', modelo: 'Ej. Consola o equipo' },
};

/**
 * Pantalla de recepción y alta de nueva orden de reparación (RF-02 a RF-05, RF-07).
 *
 * @returns {JSX.Element} Formulario de captura de cliente, dispositivo y estado inicial.
 */
export default function NuevaOrdenPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    // Cliente
    nombre_cliente: '',
    telefono_cliente: '',
    email_cliente: '',

    // Dispositivo
    tipo_dispositivo: 'celular',
    marca: '',
    modelo: '',
    color: '',
    imei_o_serie: '',
    contrasena_equipo: '',

    // Orden de Reparación
    falla_reportada: '',
    condicion_fisica: '',
    accesorios: [],
  });

  const [clienteExistente, setClienteExistente] = useState(null);
  const [folioEstimado, setFolioEstimado] = useState('RP-2026-0001');
  const [fotos, setFotos] = useState([]);
  const [otroAccesorio, setOtroAccesorio] = useState('');
  const [mostrarOtroInput, setMostrarOtroInput] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const accesoriosPredefinidos = [
    'Funda',
    'Tarjeta SIM',
    'Cargador',
    'Memoria SD',
    'Ninguno',
  ];

  // Cerrar menú desplegable al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular siguiente folio autoincremental real consultando la base de datos
  useEffect(() => {
    apiRequest('/api/ordenes?por_pagina=1')
      .then((data) => {
        const anio = new Date().getFullYear();
        let siguienteNum = 1;
        const ultimaOrden = data.ordenes?.[0];
        if (ultimaOrden?.folio) {
          const partes = ultimaOrden.folio.split('-');
          const num = parseInt(partes[2], 10);
          if (!isNaN(num)) siguienteNum = num + 1;
        } else if (data.resumen?.total || data.total) {
          siguienteNum = (data.resumen?.total || data.total) + 1;
        }
        setFolioEstimado(`RP-${anio}-${String(siguienteNum).padStart(4, '0')}`);
      })
      .catch(() => {
        const anio = new Date().getFullYear();
        setFolioEstimado(`RP-${anio}-0001`);
      });
  }, []);

  // Búsqueda automática de cliente existente al completar 10 dígitos en el teléfono
  useEffect(() => {
    const tel = formData.telefono_cliente.trim();
    if (tel.length === 10 && !isNaN(tel)) {
      apiRequest(`/api/clientes?telefono=${tel}`)
        .then((data) => {
          if (data.cliente) {
            setClienteExistente(data.cliente);
            setFormData((prev) => ({
              ...prev,
              nombre_cliente: prev.nombre_cliente || data.cliente.nombre_completo,
              email_cliente: prev.email_cliente || data.cliente.email || '',
            }));
          }
        })
        .catch(() => {
          setClienteExistente(null);
        });
    } else {
      setClienteExistente(null);
    }
  }, [formData.telefono_cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  /**
   * Actualiza el tipo de dispositivo seleccionado en el desplegable.
   *
   * @param {string} tipo Valor visual del tipo de equipo.
   * @returns {void}
   */
  const seleccionarTipoDispositivo = (tipo) => {
    setFormData((prev) => ({
      ...prev,
      tipo_dispositivo: tipo,
    }));
    setDropdownAbierto(false);
    setError(null);
  };

  const toggleAccesorio = (acc) => {
    setError(null);
    setFormData((prev) => {
      if (acc === 'Ninguno') {
        const yaTieneNinguno = prev.accesorios.includes('Ninguno');
        return {
          ...prev,
          accesorios: yaTieneNinguno ? [] : ['Ninguno'],
        };
      }

      const sinNinguno = prev.accesorios.filter((a) => a !== 'Ninguno');
      const existe = sinNinguno.includes(acc);
      const nuevos = existe ? sinNinguno.filter((a) => a !== acc) : [...sinNinguno, acc];
      return { ...prev, accesorios: nuevos };
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
   * Valida formato (JPG/PNG), tamaño (<= 5 MB) y cantidad (máx. 5) de las fotos de recepción (RF-05, RF-07).
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e Evento de selección de archivos.
   * @returns {void}
   */
  const handleFotoUpload = (e) => {
    setError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxBytes = 5 * 1024 * 1024; // 5 MB

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

  // Estados de validación
  const esCelular = formData.tipo_dispositivo === 'celular';
  const nombreLleno = formData.nombre_cliente.trim().length > 0;
  const telefonoValido = formData.telefono_cliente.trim().length === 10 && !isNaN(formData.telefono_cliente.trim());
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

  const tipoActual = TIPOS_DISPOSITIVO.find((t) => t.value === formData.tipo_dispositivo) || TIPOS_DISPOSITIVO[0];
  const IconoTipoActual = tipoActual.icon;
  const placeholders = PLACEHOLDERS_EQUIPO[formData.tipo_dispositivo] || PLACEHOLDERS_EQUIPO.otro;

  /**
   * Registra cliente, dispositivo (mapeando tipos visuales al catálogo del backend) y orden con fotos.
   *
   * @param {React.FormEvent<HTMLFormElement>} e Evento de envío del formulario.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!datosClienteCompletos) {
      setError('Por favor ingresa el nombre del cliente y un teléfono válido de 10 dígitos.');
      setLoading(false);
      return;
    }

    if (!marcaLlena || !modeloLleno) {
      setError('Por favor completa la marca y el modelo del dispositivo.');
      setLoading(false);
      return;
    }

    if (!imeiValido) {
      setError(
        esCelular
          ? 'El IMEI del celular debe contener exactamente 15 dígitos numéricos.'
          : 'El número de serie (S/N) debe tener entre 4 y 30 caracteres.',
      );
      setLoading(false);
      return;
    }

    if (!fallaValida || !condicionValida) {
      setError('Por favor describe la falla reportada y la condición física del equipo.');
      setLoading(false);
      return;
    }

    if (!accesoriosValidos) {
      setError('Debes seleccionar al menos un accesorio recibido o marcar la opción "Ninguno".');
      setLoading(false);
      return;
    }

    if (!fotosValidas) {
      setError('Debes adjuntar al menos una fotografía de recepción del equipo (mínimo 1, máximo 5).');
      setLoading(false);
      return;
    }

    try {
      // 1. Resolver Cliente (crear o reutilizar)
      let clienteId = clienteExistente?.id;
      if (!clienteId) {
        try {
          const resCli = await apiRequest('/api/clientes', {
            method: 'POST',
            body: {
              nombre_completo: formData.nombre_cliente.trim(),
              telefono: formData.telefono_cliente.trim(),
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

      // 2. Resolver Dispositivo (impresora y pc_escritorio se guardan como "otro" para respetar el esquema SQL)
      let dispositivoId;
      try {
        const resDisp = await apiRequest('/api/dispositivos', {
          method: 'POST',
          body: {
            cliente_id: clienteId,
            tipo: tipoActual.apiTipo,
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

      // 3. Crear Orden con fotos multipart
      const orderData = new FormData();
      orderData.append('dispositivo_id', dispositivoId);
      orderData.append('falla_reportada', formData.falla_reportada.trim());
      orderData.append('condicion_fisica', formData.condicion_fisica.trim());
      orderData.append('accesorios', JSON.stringify(formData.accesorios));

      fotos.forEach((f) => {
        orderData.append('fotos', f.file);
      });

      await apiRequest('/api/ordenes', {
        method: 'POST',
        body: orderData,
        isFormData: true,
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Ocurrió un error al registrar la orden en el sistema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col font-sans pb-16">
      {/* ================= BARRA SUPERIOR Y NAVEGACIÓN ================= */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link to="/dashboard" className="hover:text-[#24529F] transition-colors">
            Inicio
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">Nueva orden</span>
        </nav>

        <div className="relative hidden md:block w-72 lg:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            readOnly
            placeholder="Buscar por folio, cliente, teléfono o IMEI"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-600 focus:outline-none"
          />
        </div>
      </header>

      {/* ================= ENCABEZADO DE PÁGINA ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B0D12] tracking-tight">
            Nueva orden de reparación
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Captura cliente, equipo y estado inicial. El folio se genera al guardar.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
        >
          Cancelar
        </Link>
      </div>

      {/* ================= CONTENIDO PRINCIPAL EN 2 COLUMNAS ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Verifica la información</span>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ================= COLUMNA IZQUIERDA: FORMULARIO (8 cols) ================= */}
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#24529F] border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#24529F]" />
                      Cliente existente
                    </span>
                  )}
                </div>

                {clienteExistente && (
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3.5 flex items-start gap-3 animate-in fade-in">
                    <Users className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#1E3A8A]">
                        Encontramos a este cliente por su teléfono
                      </p>
                      <p className="text-[11px] text-[#2563EB] mt-0.5">
                        {clienteExistente.nombre_completo} · {clienteExistente.num_ordenes || 1} órdenes anteriores. Sus datos se reutilizan.
                      </p>
                    </div>
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
                      value={formData.nombre_cliente}
                      onChange={handleChange}
                      placeholder="Ej. Carlos Mendoza"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#24529F] focus:ring-1 focus:ring-[#24529F] transition-all"
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
                      value={formData.telefono_cliente}
                      onChange={handleChange}
                      placeholder="Ej. 33 1234 5678"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#24529F] focus:ring-1 focus:ring-[#24529F] transition-all"
                    />
                    {telefonoValido && (
                      <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                        ✓ 10 dígitos
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Correo (opcional)
                    </label>
                    <input
                      type="email"
                      name="email_cliente"
                      value={formData.email_cliente}
                      onChange={handleChange}
                      placeholder="Ej. cliente@correo.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#24529F] focus:ring-1 focus:ring-[#24529F] transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* CARD 2: DISPOSITIVO */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-[#0D1B3E] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
                    2
                  </div>
                  <h2 className="font-bold text-base text-[#0B0D12]">Dispositivo</h2>
                </div>

                <div className="space-y-4">
                  {/* Menú desplegable de Tipo de Dispositivo */}
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
                      <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-in fade-in zoom-in-95">
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
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#24529F] transition-all"
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
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#24529F] transition-all"
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
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#24529F] transition-all"
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
                  <span className="text-xs text-slate-400 font-normal">
                    Esta opción no se podrá modificar tras recibir
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
                      placeholder="Ej. La pantalla se quedó en negro después de una caída; vibra y suena al recibir llamadas."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#24529F] transition-all resize-none"
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
                      placeholder="Ej. Cristal estrellado en la esquina inferior derecha. Marco con rayones leves. Tapa trasera sin daños."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#24529F] transition-all resize-none"
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
                    {accesoriosPredefinidos.map((acc) => {
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
                      .filter((a) => !accesoriosPredefinidos.includes(a))
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
                          placeholder="Ej. Mochila, Stylus..."
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-700">
                      Fotografías de recepción * <span className="text-slate-400 font-normal">· mínimo 1, máximo 5 · JPG o PNG hasta 5 MB</span>
                    </label>
                  </div>

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
                        className="w-36 h-36 rounded-2xl overflow-hidden relative border border-slate-200 bg-slate-100 group shrink-0 shadow-sm"
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

            {/* ================= COLUMNA DERECHA: RESUMEN STICKY (4 cols) ================= */}
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
                      {fotos.length > 0 ? `${fotos.length} de recepción` : '0 de recepción'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Recibe</span>
                    <span className="font-medium text-slate-900 truncate max-w-[180px] text-right">
                      {nombreRecibe}
                    </span>
                  </div>
                </div>

                {/* Checklist de validación reactiva */}
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
                  {loading ? 'Creando orden...' : 'Crear orden'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}