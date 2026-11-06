import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import {
  Wrench,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Smartphone,
  ShieldCheck,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ExternalLink,
} from 'lucide-react';

export default function NuevaOrdenPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Estados de pasos / datos
  const [paso, setPaso] = useState(1); // 1: Cliente & Dispositivo, 2: Falla & Fotos
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ordenCreada, setOrdenCreada] = useState(null);

  // Cliente
  const [telefono, setTelefono] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [emailCliente, setEmailCliente] = useState('');

  // Dispositivo
  const [imei, setImei] = useState('');
  const [dispositivoEncontrado, setDispositivoEncontrado] = useState(null);
  const [tipoDispositivo, setTipoDispositivo] = useState('celular');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const [contrasenaEquipo, setContrasenaEquipo] = useState('');

  // Detalles de la Orden
  const [fallaReportada, setFallaReportada] = useState('');
  const [condicionFisica, setCondicionFisica] = useState('');
  const [accesorios, setAccesorios] = useState('');
  const [fotos, setFotos] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // string[]

  // Búsqueda automática de cliente por teléfono (10 dígitos)
  const handleTelefonoChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setTelefono(val);

    if (val.length === 10) {
      try {
        const res = await apiRequest(`/api/clientes?telefono=${val}`);
        if (res.cliente) {
          setClienteEncontrado(res.cliente);
          setNombreCompleto(res.cliente.nombre_completo);
          setEmailCliente(res.cliente.email || '');
        } else {
          setClienteEncontrado(null);
        }
      } catch {
        setClienteEncontrado(null);
      }
    } else {
      setClienteEncontrado(null);
    }
  };

  // Búsqueda automática de dispositivo por IMEI
  const handleImeiChange = async (e) => {
    const val = e.target.value.trim();
    setImei(val);

    if (val.length >= 8) {
      try {
        const res = await apiRequest(`/api/dispositivos?imei_o_serie=${encodeURIComponent(val)}`);
        if (res.dispositivo) {
          setDispositivoEncontrado(res.dispositivo);
          setTipoDispositivo(res.dispositivo.tipo);
          setMarca(res.dispositivo.marca);
          setModelo(res.dispositivo.modelo);
          setColor(res.dispositivo.color || '');
        } else {
          setDispositivoEncontrado(null);
        }
      } catch {
        setDispositivoEncontrado(null);
      }
    } else {
      setDispositivoEncontrado(null);
    }
  };

  // Manejo de fotografías
  const handleFotosSelect = (e) => {
    const seleccionadas = Array.from(e.target.files || []);
    if (fotos.length + seleccionadas.length > 5) {
      setError('El límite máximo es de 5 fotografías de recepción');
      return;
    }

    const validas = [];
    const nuevasPreviews = [];

    for (const f of seleccionadas) {
      if (f.size > 5 * 1024 * 1024) {
        setError(`El archivo ${f.name} excede el límite de 5 MB`);
        return;
      }
      validas.push(f);
      nuevasPreviews.push(URL.createObjectURL(f));
    }

    setFotos((prev) => [...prev, ...validas]);
    setPreviews((prev) => [...prev, ...nuevasPreviews]);
    setError(null);
  };

  const handleEliminarFoto = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setFotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Enviar orden completa
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (fotos.length === 0) {
      setError('Es obligatoria al menos 1 fotografía de recepción (RF-05 / ERS)');
      return;
    }

    setLoading(true);

    try {
      // 1. Obtener o crear Cliente
      let clienteId = clienteEncontrado?.id;
      if (!clienteId) {
        const resCliente = await apiRequest('/api/clientes', {
          method: 'POST',
          body: {
            nombre_completo: nombreCompleto,
            telefono,
            email: emailCliente || null,
            aviso_privacidad: true,
          },
        });
        clienteId = resCliente.cliente.id;
      }

      // 2. Obtener o crear Dispositivo
      let dispositivoId = dispositivoEncontrado?.id;
      if (!dispositivoId) {
        const resDisp = await apiRequest('/api/dispositivos', {
          method: 'POST',
          body: {
            cliente_id: clienteId,
            tipo: tipoDispositivo,
            marca,
            modelo,
            color: color || null,
            imei_o_serie: imei,
            contrasena_equipo: contrasenaEquipo || null,
          },
        });
        dispositivoId = resDisp.dispositivo.id;
      }

      // 3. Crear Orden con Multipart (Fotos)
      const formData = new FormData();
      formData.append('dispositivo_id', dispositivoId);
      formData.append('falla_reportada', fallaReportada);
      formData.append('condicion_fisica', condicionFisica);
      if (accesorios) formData.append('accesorios', accesorios);
      for (const f of fotos) {
        formData.append('fotos', f);
      }

      const resOrden = await apiRequest('/api/ordenes', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });

      setOrdenCreada(resOrden);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Si la orden ya se creó con éxito, mostramos la Nota de Recepción con QR
  if (ordenCreada) {
    const { orden, nota_servicio, estatus } = ordenCreada;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="text-center">
            <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              ORDEN REGISTRADA EXITOSAMENTE
            </span>
            <h1 className="text-2xl font-bold text-white mt-2 font-mono">
              Folio: {orden.folio}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {marca} {modelo} • Cliente: {nombreCompleto}
            </p>
          </div>

          {/* QR de la Nota */}
          {estatus?.qr && (
            <div className="my-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center">
              <img
                src={estatus.qr}
                alt="QR de seguimiento"
                className="w-36 h-36 bg-white p-2 rounded-lg shadow-md"
              />
              <span className="text-[11px] font-mono text-slate-400 mt-3 text-center">
                Código QR para consulta pública del cliente
              </span>
              <span className="text-[10px] text-cyan-400 font-mono mt-0.5">
                /estatus/{orden.token_estatus}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir Nota
            </button>
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
            >
              Ir al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Cabecera */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white tracking-wider">InfoFIX</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                  RECEPCIÓN
                </span>
              </div>
              <h1 className="text-sm font-semibold text-slate-200">Apertura de Orden de Servicio (P6)</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bloque 1: Cliente */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-4 pb-2 border-b border-slate-800">
              <User className="w-4 h-4" />
              <span>1. Identificación del Cliente</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Teléfono (10 dígitos) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={handleTelefonoChange}
                    placeholder="3312345678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                {clienteEncontrado && (
                  <span className="text-[10px] text-emerald-400 font-mono mt-1 block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Cliente recurrente detectado
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Correo Electrónico (opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={emailCliente}
                    onChange={(e) => setEmailCliente(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Dispositivo */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-4 pb-2 border-b border-slate-800">
              <Smartphone className="w-4 h-4" />
              <span>2. Datos del Equipo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  IMEI o Serie *
                </label>
                <input
                  type="text"
                  required
                  value={imei}
                  onChange={handleImeiChange}
                  placeholder="15 dígitos o serie"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                {dispositivoEncontrado && (
                  <span className="text-[10px] text-emerald-400 font-mono mt-1 block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Equipo registrado previamente
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Tipo de Equipo
                </label>
                <select
                  value={tipoDispositivo}
                  onChange={(e) => setTipoDispositivo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="celular">Celular</option>
                  <option value="tablet">Tablet</option>
                  <option value="laptop">Laptop</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Marca *
                </label>
                <input
                  type="text"
                  required
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Ej. Samsung, Apple"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Modelo *
                </label>
                <input
                  type="text"
                  required
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ej. Galaxy S21, iPhone 13"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Color
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Ej. Negro Mate, Azul"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  PIN / Patrón de desbloqueo (opcional)
                </label>
                <input
                  type="text"
                  value={contrasenaEquipo}
                  onChange={(e) => setContrasenaEquipo(e.target.value)}
                  placeholder="Para pruebas de pantalla y componentes"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Bloque 3: Falla y Condición Física */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-4 pb-2 border-b border-slate-800">
              <FileText className="w-4 h-4" />
              <span>3. Diagnóstico Inicial y Recepción</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Falla Reportada por el Cliente * (mín. 5 caracteres)
                </label>
                <textarea
                  required
                  rows={2}
                  value={fallaReportada}
                  onChange={(e) => setFallaReportada(e.target.value)}
                  placeholder="Describe la falla manifestada (ej. No da imagen tras caída, la batería se descarga en 1 hora...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    Condición Física de Recepción * (mín. 5 caracteres)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={condicionFisica}
                    onChange={(e) => setCondicionFisica(e.target.value)}
                    placeholder="Rayones en pantalla, tapa rota, esquinas golpeadas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    Accesorios Dejados (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={accesorios}
                    onChange={(e) => setAccesorios(e.target.value)}
                    placeholder="Funda protectora, cable, cargador, tarjeta SIM..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 4: Evidencias Fotográficas Obligatorias (RF-05) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                <Camera className="w-4 h-4" />
                <span>4. Evidencias Fotográficas de Recepción (1 a 5 fotos obligatorias)</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{fotos.length} de 5</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {previews.map((src, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative group"
                >
                  <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleEliminarFoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-[9px] font-mono bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-300">
                    Foto {idx + 1}
                  </span>
                </div>
              ))}

              {fotos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/50 hover:bg-slate-900/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-cyan-400 transition-all"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] font-mono font-medium">Subir Foto</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFotosSelect}
              multiple
              accept="image/jpeg,image/png"
              className="hidden"
            />
          </div>

          {/* Botón de Envío */}
          <div className="flex justify-end gap-3 pt-4">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Generando Folio y QR...' : 'Emitir Orden de Servicio'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
