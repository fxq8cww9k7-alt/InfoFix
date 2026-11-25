/**
 * @file PublicStatusPage.jsx
 * @description Página pública de seguimiento de estatus en tiempo real para el cliente (P15 / RF-13).
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../api/client';
import {
  Check,
  Wrench,
  AlertCircle,
  MapPin,
  Phone,
  Image as ImageIcon,
  ShieldCheck,
  Send,
  Clock,
} from 'lucide-react';

export default function PublicStatusPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarEstatus = useCallback(
    (silencioso = false) => {
      if (!token) return;
      if (!silencioso) setLoading(true);
      publicApi
        .consultarEstatus(token)
        .then((res) => {
          setData(res.estatus);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => {
          if (!silencioso) setLoading(false);
        });
    },
    [token],
  );

  useEffect(() => {
    cargarEstatus();
    const intervalo = setInterval(() => cargarEstatus(true), 30000);
    return () => clearInterval(intervalo);
  }, [cargarEstatus]);

  const resolverUrlFoto = (url) => {
    if (!url) return '';
    return url.startsWith('/') || url.startsWith('http') ? url : `/uploads/${url}`;
  };

  const formatearFechaCorta = (fechaStr) => {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return '';
    return new Date(fechaStr)
      .toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(',', ' ·');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] text-slate-600 flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-9 h-9 border-2 border-[#24529F]/20 border-t-[#24529F] rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-500">Consultando estatus de tu reparación...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col font-sans">
        <header className="bg-[#0D1B3E] text-white px-5 py-3.5">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#24529F] flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight">InfoFIX</span>
            </div>
            <span className="text-[11px] text-slate-300">Estatus de tu reparación</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#FDECEC] text-[#C53030] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#0B0D12] mb-2">Orden no encontrada</h2>
            <p className="text-xs text-[#5A6578] leading-relaxed">
              {error || 'El código QR o enlace no coincide con ninguna orden registrada en el taller.'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const {
    folio,
    estado,
    paso,
    total_pasos,
    dispositivo,
    fecha_recepcion,
    ultima_actualizacion,
    progreso,
    fotos_recepcion,
    avisos,
    taller,
    url_certificado,
  } = data;

  const tituloEstado =
    estado === 'Entregado' ? 'Tu equipo fue entregado' : `Tu equipo está en ${estado.toLowerCase()}`;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] pb-12 font-sans">
      {/* Cabecera Navy institucional */}
      <header className="bg-[#0D1B3E] text-white px-5 py-3.5 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#24529F] flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">InfoFIX</span>
          </div>
          <span className="text-[11px] text-slate-300">Estatus de tu reparación</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {/* Tarjeta resumen de estado */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#24529F] flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#0B0D12]">{tituloEstado}</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#24529F] mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#24529F]" />
                Paso {paso} de {total_pasos}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Folio</span>
              <strong className="font-mono text-[#0B0D12]">{folio}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Equipo</span>
              <strong className="text-[#0B0D12]">
                {dispositivo?.marca} {dispositivo?.modelo}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">IMEI / Serie</span>
              <strong className="font-mono text-[#0B0D12]">{dispositivo?.imei_o_serie}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Recibido</span>
              <span className="font-medium text-slate-800">{formatearFechaCorta(fecha_recepcion)}</span>
            </div>
            {ultima_actualizacion && (
              <div className="flex justify-between">
                <span className="text-slate-500">Última actualización</span>
                <span className="font-medium text-slate-800">{formatearFechaHora(ultima_actualizacion)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Progreso por etapas */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B0D12]">
            <Clock className="w-4 h-4 text-[#24529F]" />
            <span>Progreso</span>
          </div>

          <div className="space-y-4 relative before:absolute before:top-3 before:bottom-3 before:left-3 before:w-0.5 before:bg-slate-200">
            {progreso?.map((item, idx) => {
              const esActual = item.estado === estado;
              const esCompletado = item.completado && !esActual;
              const esSiguiente = idx === paso;

              return (
                <div key={item.estado} className="relative flex items-start gap-3.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] font-bold ${
                      esCompletado || (estado === 'Entregado' && esActual)
                        ? 'bg-[#0D1B3E] text-white'
                        : esActual
                          ? 'bg-white border-2 border-[#24529F] text-[#24529F] ring-4 ring-blue-50'
                          : 'bg-white border border-slate-300 text-slate-400'
                    }`}
                  >
                    {esCompletado || (estado === 'Entregado' && esActual) ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : esActual ? (
                      <span className="w-2 h-2 rounded-full bg-[#24529F]" />
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs ${
                          esActual || esCompletado ? 'font-bold text-[#0B0D12]' : 'font-medium text-slate-400'
                        }`}
                      >
                        {item.estado}
                      </span>
                    </div>

                    {item.fecha ? (
                      <p className="text-[10px] text-slate-400 font-mono">
                        {esActual ? `En curso · ${formatearFechaHora(item.fecha)}` : formatearFechaHora(item.fecha)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        {item.estado === 'Entregado'
                          ? 'Recibirás tu certificado con QR'
                          : esSiguiente
                            ? 'Siguiente paso'
                            : 'Pendiente'}
                      </p>
                    )}

                    {item.nota && (
                      <div className="mt-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                        {item.nota}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Certificado emitido (cuando la orden ya fue entregada) */}
        {url_certificado && (
          <section className="bg-[#E3F4EC] border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">Certificado digital emitido</p>
                <p className="text-[11px] text-emerald-800">Puedes consultar y verificar tu garantía.</p>
              </div>
            </div>
            <a
              href={url_certificado}
              className="px-3.5 py-2 rounded-xl bg-[#0D1B3E] text-white text-xs font-semibold shrink-0"
            >
              Verificar
            </a>
          </section>
        )}

        {/* Fotos de recepción */}
        {fotos_recepcion && fotos_recepcion.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B0D12]">
              <ImageIcon className="w-4 h-4 text-[#24529F]" />
              <span>Fotos de recepción</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {fotos_recepcion.map((foto, idx) => {
                const src = resolverUrlFoto(foto);
                return (
                  <a
                    key={idx}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative block group"
                  >
                    <img
                      src={src}
                      alt={`Foto de recepción ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#0D1B3E] text-white">
                      ANTES
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Avisos enviados al cliente */}
        {avisos && avisos.length > 0 ? (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B0D12]">
              <Send className="w-4 h-4 text-[#24529F]" />
              <span>Avisos del taller</span>
            </div>
            <div className="space-y-2">
              {avisos.map((aviso, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#F4F7FB] border border-slate-200/80 text-xs">
                  <p className="text-slate-700 leading-relaxed">{aviso.mensaje}</p>
                  <span className="block text-[10px] font-mono text-slate-400 mt-1">
                    {formatearFechaHora(aviso.fecha)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3 text-xs text-slate-600">
            <Send className="w-4 h-4 text-[#24529F] shrink-0" />
            <span>Aquí verás cada avance y cuándo tu equipo esté listo para recoger.</span>
          </div>
        )}

        {/* Contacto del taller */}
        {taller && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2 text-xs">
            <p className="font-bold text-[#0B0D12]">{taller.nombre || 'Taller InfoFIX'}</p>
            {taller.direccion && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{taller.direccion}</span>
              </div>
            )}
            {taller.telefono && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Tel. {taller.telefono}</span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              Por privacidad no mostramos datos personales del cliente.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
