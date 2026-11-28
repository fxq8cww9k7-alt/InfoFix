/**
 * @file PublicStatusPage.jsx
 * @description Página pública de seguimiento de estatus en tiempo real para el cliente mediante QR (RF-13).
 * @task T23 (RF-13)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../api/client';
import {
  Smartphone,
  CheckCircle2,
  Wrench,
  AlertCircle,
  MapPin,
  Phone,
  Image as ImageIcon,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

/**
 * Enmascara el IMEI o número de serie dejando visibles únicamente los últimos 4 caracteres (LFPDPPP).
 *
 * @param {string|null|undefined} valor Identificador del dispositivo.
 * @returns {string} Identificador enmascarado o 'N/A'.
 */
function formatearIdentificadorPublico(valor) {
  if (!valor) return 'N/A';
  const str = String(valor);
  if (str.includes('*')) return str;
  if (str.length <= 4) return str;
  return '*'.repeat(str.length - 4) + str.slice(-4);
}

/**
 * Normaliza la ruta de una fotografía de evidencia evitando duplicar el prefijo "/uploads/".
 *
 * @param {string|Object} foto Ruta en texto o entidad de evidencia devuelta por la API.
 * @returns {string} URL lista para renderizarse en una etiqueta <img>.
 */
function normalizarUrlFoto(foto) {
  const ruta = typeof foto === 'string' ? foto : foto?.url || foto?.ruta || foto?.archivo || '';
  if (!ruta) return '';
  if (ruta.startsWith('/') || ruta.startsWith('http')) return ruta;
  return `/uploads/${ruta}`;
}

/**
 * Vista pública de consulta de estatus en vivo sin inicio de sesión (escaneo de QR de recepción).
 *
 * @returns {JSX.Element} Pantalla pública de progreso, línea de tiempo, evidencias y avisos del taller.
 */
export default function PublicStatusPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    publicApi
      .consultarEstatus(token)
      .then((res) => setData(res.estatus))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-9 h-9 border-2 border-[#24529F]/20 border-t-[#24529F] rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-wider text-slate-500 uppercase">
          Consultando orden de servicio...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col justify-center items-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#0B0D12] mb-2">Orden no encontrada</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            {error || 'El código QR o enlace no coincide con ninguna orden activa en el sistema.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-xs font-semibold text-white transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const {
    folio,
    estado,
    paso,
    total_pasos,
    dispositivo,
    progreso,
    fotos_recepcion,
    avisos,
    taller,
    url_certificado,
  } = data;

  const porcentajeProgreso = total_pasos ? Math.min(100, Math.round((paso / total_pasos) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] pb-16 font-sans">
      {/* Barra superior pública */}
      <header className="bg-[#0D1B3E] text-white sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#24529F] flex items-center justify-center text-white shadow-sm">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight block leading-none">
                InfoFIX
              </span>
              <span className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">
                Seguimiento de servicio
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Folio</span>
            <div className="font-mono text-xs font-bold text-white">{folio}</div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* Tarjeta del dispositivo y progreso */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-[#24529F] flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0B0D12] leading-tight">
                  {dispositivo?.marca} {dispositivo?.modelo}
                </h1>
                <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                  <span className="block capitalize">Tipo: {dispositivo?.tipo || 'Equipo'}</span>
                  <span className="block font-mono text-slate-600">
                    IMEI/SN: {formatearIdentificadorPublico(dispositivo?.imei_o_serie)}
                  </span>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1D4ED8] border border-blue-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
              {estado}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
              <span className="font-mono uppercase text-[11px]">Progreso de servicio</span>
              <span className="text-[#0D1B3E] font-bold font-mono">
                Paso {paso} de {total_pasos}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#24529F] h-full rounded-full transition-all duration-500"
                style={{ width: `${porcentajeProgreso}%` }}
              />
            </div>
          </div>
        </div>

        {/* Enlace al Certificado si ya está entregado */}
        {url_certificado && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">Certificado Oficial Emitido</h3>
                <p className="text-xs text-emerald-800">
                  Tu equipo fue entregado. Consulta aquí tu garantía y evidencia completa.
                </p>
              </div>
            </div>
            <a
              href={url_certificado}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shrink-0"
            >
              <span>Ver certificado</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Línea de tiempo del servicio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-5">
            Línea de Tiempo del Servicio
          </h2>
          <div className="space-y-5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {progreso?.map((item, idx) => {
              const esActivo = item.estado === estado;
              return (
                <div key={item.estado} className="relative flex items-start gap-4">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                      item.completado
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : esActivo
                          ? 'bg-[#24529F] text-white shadow-sm ring-4 ring-blue-100'
                          : 'bg-white text-slate-400 border-2 border-slate-200'
                    }`}
                  >
                    {item.completado ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-bold ${
                          esActivo
                            ? 'text-[#0D1B3E]'
                            : item.completado
                              ? 'text-slate-800'
                              : 'text-slate-400'
                        }`}
                      >
                        {item.estado}
                      </span>
                      {item.fecha && (
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(item.fecha).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    {item.nota && (
                      <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {item.nota}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Avisos especiales del taller al cliente */}
        {avisos && avisos.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#24529F]" />
              <span>Comunicaciones del Taller</span>
            </h2>
            <div className="space-y-2.5">
              {avisos.map((aviso, idx) => (
                <div
                  key={aviso.id ?? idx}
                  className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs"
                >
                  <p className="text-slate-800 leading-relaxed">{aviso.mensaje || aviso.adicional}</p>
                  {aviso.fecha && (
                    <span className="block text-[10px] font-mono text-slate-400 mt-1.5">
                      {new Date(aviso.fecha).toLocaleString('es-MX')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fotos de Recepción (Evidencia) */}
        {fotos_recepcion && fotos_recepcion.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              <ImageIcon className="w-4 h-4 text-[#24529F]" />
              <span>Evidencia Fotográfica de Recepción</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fotos_recepcion.map((foto, idx) => {
                const url = normalizarUrlFoto(foto);
                return (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group relative block"
                  >
                    <img
                      src={url}
                      alt={`Evidencia de recepción ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono bg-[#0D1B3E]/80 px-2 py-0.5 rounded-md text-white">
                      Foto {idx + 1}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Contacto del Taller */}
        {taller && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs text-slate-500 space-y-2 shadow-sm">
            <div className="font-bold text-[#0B0D12] text-sm">{taller.nombre}</div>
            {taller.direccion && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#24529F] shrink-0" />
                <span>{taller.direccion}</span>
              </div>
            )}
            {taller.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#24529F] shrink-0" />
                <span className="font-mono">{taller.telefono}</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}