/**
 * @file PublicVerifyPage.jsx
 * @description Página pública de verificación de autenticidad del certificado digital y garantía (P16 / RF-12, RF-15).
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../api/client';
import {
  ShieldCheck,
  AlertCircle,
  Check,
  Wrench,
  Clock,
  Image as ImageIcon,
  X,
  Search,
} from 'lucide-react';

export default function PublicVerifyPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelado = false;
    publicApi
      .verificarCertificado(token)
      .then((res) => {
        if (!cancelado) {
          setData(res.certificado);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelado) setError(err.message);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [token]);

  const resolverUrlFoto = (ev) => {
    const raw = typeof ev === 'string' ? ev : ev?.url || ev?.archivo || '';
    if (!raw) return '';
    return raw.startsWith('/') || raw.startsWith('http') ? raw : `/uploads/${raw}`;
  };

  const formatearFechaCorta = (fechaStr) => {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] text-slate-600 flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-9 h-9 border-2 border-[#1F8A5B]/20 border-t-[#1F8A5B] rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-500">Verificando autenticidad del certificado...</p>
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
            <span className="text-[11px] text-slate-300">Verificación pública</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-5">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FDECEC] border border-[#F8B4B4] text-[#C53030] flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-[#0B0D12]">Certificado no encontrado</h1>
              <p className="text-xs text-[#5A6578] mt-1.5 leading-relaxed">
                Verifica que el enlace o código QR corresponda a un certificado emitido por el taller.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-500 truncate">
              {window.location.href}
            </div>

            <p className="text-[11px] text-slate-400 pt-2">
              Si crees que es un error, comunícate con el taller que reparó tu equipo.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const {
    folio,
    dispositivo,
    fecha_recepcion,
    fecha_entrega,
    falla_reportada,
    refacciones,
    linea_tiempo,
    garantia,
    evidencias,
    historial,
    taller,
  } = data;

  const garantiaVigente = garantia?.estado === 'Vigente';
  const totalReparaciones = historial?.reparaciones_certificadas || 1;
  const fotosAntes = Array.isArray(evidencias?.antes) ? evidencias.antes : [];
  const fotosDespues = Array.isArray(evidencias?.despues) ? evidencias.despues : [];

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
          <span className="text-[11px] text-slate-300">Verificación pública</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {/* Tarjeta 1: Certificado auténtico */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E3F4EC] text-[#1F8A5B] flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#0B0D12]">Certificado auténtico</h1>
              <p className="text-[11px] text-slate-500">La información no ha sido modificada.</p>
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
              <span className="text-slate-500">Recepción</span>
              <span className="font-medium text-slate-800">{formatearFechaCorta(fecha_recepcion)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Entrega</span>
              <span className="font-medium text-slate-800">{formatearFechaCorta(fecha_entrega)}</span>
            </div>
          </div>
        </section>

        {/* Tarjeta 2: Garantía */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B0D12]">
              {garantiaVigente ? (
                <ShieldCheck className="w-4 h-4 text-[#1F8A5B]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#C53030]" />
              )}
              <span>Garantía</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                garantiaVigente
                  ? 'bg-[#E3F4EC] text-[#1F8A5B]'
                  : 'bg-[#FDECEC] text-[#C53030]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {garantia?.estado || 'Vencida'}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 text-xs">
            <strong className="text-[#0B0D12]">
              {garantiaVigente
                ? `Quedan ${garantia?.dias_restantes ?? 0} de ${garantia?.dias ?? 0} días`
                : `Venció el ${formatearFechaCorta(garantia?.fin)}`}
            </strong>
            <span className="text-[11px] text-slate-400">
              {garantiaVigente
                ? `hasta ${formatearFechaCorta(garantia?.fin)}`
                : `${garantia?.dias ?? 0} días`}
            </span>
          </div>

          {garantiaVigente ? (
            garantia?.terminos && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                {garantia.terminos}
              </div>
            )
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
              El certificado sigue siendo válido como comprobante del servicio.
            </div>
          )}
        </section>

        {/* Tarjeta 3: Trabajo realizado */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B0D12]">
            <Wrench className="w-4 h-4 text-[#24529F]" />
            <span>Trabajo realizado</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-3 h-3" />
              </div>
              <div>
                <p className="font-bold text-[#0B0D12]">
                  Falla reportada{' '}
                  <span className="font-normal font-mono text-[10px] text-slate-400">
                    {formatearFechaCorta(fecha_recepcion)}
                  </span>
                </p>
                <p className="text-slate-600 text-[11px] mt-0.5">{falla_reportada}</p>
              </div>
            </div>

            {linea_tiempo &&
              linea_tiempo.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-[#24529F] flex items-center justify-center shrink-0 mt-0.5">
                    {h.estado === 'Entregado' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : h.estado === 'Diagnóstico' ? (
                      <Search className="w-3 h-3" />
                    ) : (
                      <Wrench className="w-3 h-3" />
                    )}
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-bold text-[#0B0D12]">{h.estado}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatearFechaCorta(h.fecha)}
                    </span>
                  </div>
                </div>
              ))}

            {refacciones && refacciones.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Refacciones instaladas
                </span>
                {refacciones.map((ref, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]"
                  >
                    <span className="font-medium text-slate-800">{ref.nombre}</span>
                    <span className="font-mono text-slate-500 capitalize">{ref.tipo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Tarjeta 4: Evidencia fotográfica */}
        {(fotosAntes.length > 0 || fotosDespues.length > 0) && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B0D12]">
              <ImageIcon className="w-4 h-4 text-[#24529F]" />
              <span>Evidencia fotográfica</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {fotosAntes.map((ev, idx) => {
                const src = resolverUrlFoto(ev);
                return (
                  <a
                    key={`a-${idx}`}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative block group"
                  >
                    <img
                      src={src}
                      alt={`Antes ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#0D1B3E] text-white">
                      ANTES
                    </span>
                  </a>
                );
              })}

              {fotosDespues.map((ev, idx) => {
                const src = resolverUrlFoto(ev);
                return (
                  <a
                    key={`d-${idx}`}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative block group"
                  >
                    <img
                      src={src}
                      alt={`Después ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#1F8A5B] text-white">
                      DESPUÉS
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Tarjeta 5: Historial acumulado de reparaciones certificadas */}
        {totalReparaciones > 1 ? (
          <div className="bg-[#0D1B3E] text-white rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
            <span className="text-2xl font-black font-mono shrink-0">{totalReparaciones}</span>
            <p className="text-xs text-slate-200 leading-snug">
              reparaciones certificadas registradas en el taller para este equipo
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-600 shadow-xs">
            <Clock className="w-4 h-4 text-[#24529F] shrink-0" />
            <span>Primera reparación certificada registrada para este equipo.</span>
          </div>
        )}

        {/* Pie de privacidad */}
        <p className="text-center text-[10px] text-slate-400 leading-relaxed pt-1">
          Por privacidad no mostramos datos personales del cliente.
          {taller?.nombre && taller.nombre !== 'InfoFIX'
            ? ` · Certificado emitido por ${taller.nombre} con InfoFIX.`
            : ' · Certificado emitido con InfoFIX.'}
        </p>
      </main>
    </div>
  );
}
