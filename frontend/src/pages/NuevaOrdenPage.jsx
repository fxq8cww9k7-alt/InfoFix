/**
 * @file NuevaOrdenPage.jsx
 * @description Pantalla para el registro de nuevos clientes, dispositivos (celulares, laptops, tablets) y creación de órdenes (P6 / T11).
 * @task T11 (RF-02, RF-03, RF-07)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import {
  Wrench,
  Smartphone,
  User,
  Phone,
  Mail,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function NuevaOrdenPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados del formulario agrupados
  const [formData, setFormData] = useState({
    // Cliente
    nombre_cliente: '',
    telefono_cliente: '',
    email_cliente: '',
    aviso_privacidad: false,

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

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  //lista de accesorios predeterminados
  const accesoriosDisponibles = [
    'Cargador',
    'Cable de Corriente',
    'Tarjeta SIM',
    'Unidad de Almacenamiento Extraible',
    'Funda / Maletín',
  ];

  //otros accesorios
  const [otroAccesorio, setOtroAccesorio] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(null);
  };

  const handleAccesoriosChange = (accesorio) => {
    setFormData((prev) => {
      const existe = prev.accesorios.includes(accesorio);
      const nuevosAccesorios = existe
        ? prev.accesorios.filter((a) => a !== accesorio)
        : [...prev.accesorios, accesorio];
      return { ...prev, accesorios: nuevosAccesorios };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones
    if (formData.telefono_cliente.length !== 10 || isNaN(formData.telefono_cliente)) {
      setError('El teléfono del cliente debe contener exactamente 10 dígitos numéricos.');
      setLoading(false);
      return;
    }

    if (!formData.aviso_privacidad) {
      setError('Es obligatorio aceptar el aviso de privacidad (LFPDPPP) para registrar al cliente[cite: 1, 2].');
      setLoading(false);
      return;
    }

    // Validación dinámica según el tipo de dispositivo (RF-03)
    if (formData.tipo_dispositivo === 'celular') {
      if (formData.imei_o_serie.length !== 15 || isNaN(formData.imei_o_serie)) {
        setError('El IMEI del celular debe contener exactamente 15 dígitos numéricos[cite: 1].');
        setLoading(false);
        return;
      }
    } else {
      if (formData.imei_o_serie.length < 4 || formData.imei_o_serie.length > 30) {
        setError('El número de serie para laptops, tablets u otros equipos debe tener entre 4 y 30 caracteres[cite: 1].');
        setLoading(false);
        return;
      }
    }

    try {
      // Envío de la orden al endpoint oficial del backend
      await apiRequest('/api/ordenes', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      // Redirigir al dashboard tras el éxito
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Ocurrió un error al registrar la orden en el sistema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col font-sans">
      {/* Barra superior de navegación */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Volver al Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-[#0D1B3E] tracking-tight">Nueva Orden de Reparación</h1>
            <p className="text-[10px] text-slate-500 font-mono">Módulo de Recepción (P6)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 hidden sm:inline">
            Técnico: <strong className="text-slate-900">{user?.nombre || 'Yahúm Hernández'}</strong>
          </span>
        </div>
      </header>

      {/* Contenido principal del formulario */}
      <main className="p-6 lg:p-10 max-w-4xl mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Verifica la información</span>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECCIÓN 1: DATOS DEL CLIENTE */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#24529F] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h2 className="font-bold text-sm text-[#0B0D12]">Información del Cliente</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="nombre_cliente"
                    required
                    value={formData.nombre_cliente}
                    onChange={handleChange}
                    placeholder="Ej. María García López"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#24529F] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Teléfono (10 dígitos) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="telefono_cliente"
                    required
                    maxLength={10}
                    value={formData.telefono_cliente}
                    onChange={handleChange}
                    placeholder="3312345678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#24529F] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Correo Electrónico (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="email_cliente"
                    value={formData.email_cliente}
                    onChange={handleChange}
                    placeholder="cliente@dominio.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#24529F] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Aviso de Privacidad obligatorio por ley */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="aviso_privacidad"
                  required
                  checked={formData.aviso_privacidad}
                  onChange={handleChange}
                  className="mt-0.5 rounded border-slate-300 text-[#24529F] focus:ring-[#24529F]"
                />
                <span className="text-xs text-slate-600 leading-normal">
                  El cliente acepta el <strong className="text-slate-800">Aviso de Privacidad</strong> para el tratamiento de sus datos personales conforme a la LFPDPPP y normativas aplicables[cite: 1, 2]. *
                </span>
              </label>
            </div>
          </section>

          {/* SECCIÓN 2: DATOS DEL DISPOSITIVO (MULTIEQUIPO) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#24529F] flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h2 className="font-bold text-sm text-[#0B0D12]">Equipo o Dispositivo a Reparar</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Tipo de Equipo *
                </label>
                <select
                  name="tipo_dispositivo"
                  value={formData.tipo_dispositivo}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
                >
                  <option value="celular">Celular</option>
                  <option value="tablet">Tablet</option>
                  <option value="laptop">Laptop</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  name="marca"
                  required
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder={formData.tipo_dispositivo === 'laptop' ? 'Ej. HP, Dell, Apple' : 'Ej. Samsung, Apple'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  name="modelo"
                  required
                  value={formData.modelo}
                  onChange={handleChange}
                  placeholder={formData.tipo_dispositivo === 'laptop' ? 'Ej. Pavilion 15' : 'Ej. iPhone 14 Pro'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="Ej. Gris platinado"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  {formData.tipo_dispositivo === 'celular' ? 'IMEI (15 dígitos obligatorios) *' : 'Número de Serie (4 a 30 caracteres) *'}
                </label>
                <input
                  type="text"
                  name="imei_o_serie"
                  required
                  value={formData.imei_o_serie}
                  onChange={handleChange}
                  placeholder={formData.tipo_dispositivo === 'celular' ? '356984091234567' : 'SN-ABC12345678'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#24529F]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Contraseña o PIN de desbloqueo (Opcional / Privado)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="contrasena_equipo"
                    value={formData.contrasena_equipo}
                    onChange={handleChange}
                    placeholder="Contraseña de usuario o sesión para pruebas (nunca se publica en el QR)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: DIAGNÓSTICO Y ACCESORIOS */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#24529F] flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h2 className="font-bold text-sm text-[#0B0D12]">Diagnóstico Inicial y Accesorios</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Falla Reportada por el Cliente *
                </label>
                <textarea
                  name="falla_reportada"
                  required
                  rows={2}
                  value={formData.falla_reportada}
                  onChange={handleChange}
                  placeholder="Ej. No enciende al presionar el botón de encendido, posible daño en cargador o batería."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Condición Física Estética *
                </label>
                <textarea
                  name="condicion_fisica"
                  required
                  rows={2}
                  value={formData.condicion_fisica}
                  onChange={handleChange}
                  placeholder="Ej. Equipo con marcas de uso normales, sin abolladuras profundas en la carcasa."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
                />
              </div>

              {/* Accesorios estandarizados y personalizados */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
                  Accesorios Recibidos con el Equipo
                </label>
                
                {/* Lista de accesorios predefinidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                  {accesoriosDisponibles.map((acc) => (
                    <label
                      key={acc}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.accesorios.includes(acc)}
                        onChange={() => handleAccesoriosChange(acc)}
                        className="rounded border-slate-300 text-[#24529F]"
                      />
                      <span className="text-slate-700 font-medium">{acc}</span>
                    </label>
                  ))}
                </div>

                {/* Opción extra "Otro" con campo de texto libre */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Otro accesorio personalizado:</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otroAccesorio}
                      onChange={(e) => setOtroAccesorio(e.target.value)}
                      placeholder="Ej. Adaptador USB-C a HDMI, lápiz óptico..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (otroAccesorio.trim() && !formData.accesorios.includes(otroAccesorio.trim())) {
                          setFormData((prev) => ({
                            ...prev,
                            accesorios: [...prev.accesorios, otroAccesorio.trim()],
                          }));
                          setOtroAccesorio('');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shrink-0 transition-colors"
                    >
                      Agregar
                    </button>
                  </div>

                  {/* Mostrar los accesorios personalizados que ya fueron agregados a la lista */}
                  {formData.accesorios.filter((a) => !accesoriosDisponibles.includes(a)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {formData.accesorios
                        .filter((a) => !accesoriosDisponibles.includes(a))
                        .map((customAcc) => (
                          <span
                            key={customAcc}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#24529F] border border-blue-200 text-[11px] font-medium"
                          >
                            {customAcc}
                            <button
                              type="button"
                              onClick={() => handleAccesoriosChange(customAcc)}
                              className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                              title="Eliminar"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Botones de acción final */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Generando orden...' : 'Registrar Orden y Generar Folio'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}