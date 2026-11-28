/**
 * @file PublicVerifyPage.jsx
 * @description Página pública de verificación de autenticidad del certificado digital y garantía post-servicio.
 * @task T24 (RF-12, RF-15)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../api/client';
import {
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Layers,
  Award,
  Printer,
  Image as ImageIcon,
  History,
} from 'lucide-react';

/**
 * Enmascara el IMEI o número de serie dejando visibles solo los últimos 4 caracteres (RF-12 / LFPDPPP).
 *
 * @param {string|null|undefined} valor Identificador del equipo.
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
 * Normaliza la lista de evidencias (en formato arreglo o agrupado por antes/despues) con URLs limpias.
 *
 * @param {Object|Array|undefined} evidencias Evidencias recibidas desde /api/verificar/:token.
 * @returns {Array<{url: string, etapa: string}>} Arreglo uniforme de fotos con su etiqueta de etapa.
 */
function normalizarEvidencias(evidencias) {
  if (!evidencias) return [];

  const listaCruda = Array.isArray(evidencias)
    ? evidencias
    : [
        ...(evidencias.antes || []).map((e) => (typeof e === 'string' ? { ruta: e, etapa: 'Antes' } : { ...e, etapa: 'Antes' })),
        ...(evidencias.despues || []).map((e) => (typeof e === 'string' ? { ruta: e, etapa: 'Después' } : { ...e, etapa: 'Después' })),
      ];

  return listaCruda
    .map((ev, idx) => {
      const ruta = typeof ev === 'string' ? ev : ev.url || ev.ruta || ev.archivo || '';
      if (!ruta) return null;
      const url = ruta.startsWith('/') || ruta.startsWith('http') ? ruta : `/uploads/${ruta}`;
      const etapaCruda = typeof ev === 'object' ? ev.etapa || ev.tipo : '';
      const etapa =
        etapaCruda === 'antes' || etapaCruda === 'Antes'
          ? 'Antes'
          : etapaCruda === 'despues' || etapaCruda === 'Después'
            ? 'Después'
            : idx === 0
              ? 'Antes'
              : 'Después';
      return { url, etapa };
    })
    .filter(Boolean);
}

/**
 * Vista pública de verificación del certificado digital y vigencia de garantía (RF-12 y RF-15).
 *
 * @returns {JSX.Element} Certificado verificable con historial de reparaciones, refacciones y evidencias.
 */
export default function PublicVerifyPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    publicApi
      .verificarCertificado(token)
      .then((res) => setData(res.certificado))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col justify-center items-center p-6 font-sans">
        <div className="w-9 h-9 border-2 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-wider text-slate-500 uppercase">
          Verificando autenticidad del certificado...
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
          <h2 className="text-lg font-bold text-[#0B0D12] mb-2">Certificado no encontrado</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            {error ||
              'Certificado no encontrado. Verifique que el enlace o código QR corresponda a un certificado emitido por el taller.'}
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
    token: certToken,
    fecha_emision,
    dispositivo,
    fecha_recepcion,
    fecha_entrega,
    falla_reportada,
    refacciones,
    garantia,
    evidencias,
    total_reparaciones_equipo,
  } = data;

  const garantiaVigente = garantia?.vigente ?? garantia?.estado === 'Vigente';
  const fechaVencimiento = garantia?.fecha_fin || garantia?.fin;
  const totalReparaciones =
    total_reparaciones_equipo ?? data.historial?.reparaciones_certificadas ?? 1;
  const fotosNormalizadas = normalizarEvidencias(evidencias);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] pb-16 font-sans print:bg-white print:pb-0">
      {/* Barra superior pública */}
      <header className="bg-[#0D1B3E] text-white sticky top-0 z-30 px-6 py-4 shadow-sm print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight block leading-none">
                InfoFIX
              </span>
              <span className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">
                Certificado digital
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm print:border-slate-300 print:shadow-none">
          {/* Cabecera del certificado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                CERTIFICADO AUTÉNTICO VERIFICADO
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B0D12] tracking-tight">
                Garantía y Trazabilidad de Servicio
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Folio Oficial: <span className="text-[#24529F] font-bold">{folio}</span>
              </p>
            </div>

            <div className="text-left sm:text-right font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Emitido el</span>
              <span className="text-xs text-[#0B0D12] font-semibold">
                {fecha_emision
                  ? new Date(fecha_emision).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Fecha registrada'}
              </span>
            </div>
          </div>

          {/* Estado de la Garantía */}
          <div
            className={`mt-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              garantiaVigente
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">
                Estatus de garantía legal
              </span>
              <div className="flex items-center gap-2 mt-1">
                {garantiaVigente ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-slate-500" />
                )}
                <span
                  className={`text-sm font-bold ${
                    garantiaVigente ? 'text-emerald-800' : 'text-slate-700'
                  }`}
                >
                  {garantiaVigente ? 'GARANTÍA VIGENTE' : 'GARANTÍA VENCIDA'}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right text-xs font-mono text-slate-600">
              <span className="font-semibold text-[#0B0D12]">{garantia?.dias || 0} días de cobertura</span>
              {fechaVencimiento && (
                <span className="block text-[11px] text-slate-500">
                  Vence: {new Date(fechaVencimiento).toLocaleDateString('es-MX')}
                </span>
              )}
            </div>
          </div>

          {/* Datos del equipo y falla */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Dispositivo certificado
              </span>
              <div className="text-sm font-bold text-[#0B0D12]">
                {dispositivo?.marca} {dispositivo?.modelo}
              </div>
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                <span className="block capitalize">Tipo: {dispositivo?.tipo || 'Equipo'}</span>
                <span className="block font-mono text-slate-700">
                  IMEI/Serie: {formatearIdentificadorPublico(dispositivo?.imei_o_serie)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Falla reportada en recepción
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{falla_reportada || '—'}</p>
              {(fecha_recepcion || fecha_entrega) && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500 flex justify-between">
                  {fecha_recepcion && (
                    <span>Ingreso: {new Date(fecha_recepcion).toLocaleDateString('es-MX')}</span>
                  )}
                  {fecha_entrega && (
                    <span>Entrega: {new Date(fecha_entrega).toLocaleDateString('es-MX')}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Historial acumulado del dispositivo (RF-15) */}
          <div className="mt-4 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-2.5 text-xs text-slate-700">
            <History className="w-4 h-4 text-[#24529F] shrink-0" />
            <span>
              {totalReparaciones > 1
                ? `Este dispositivo acumula ${totalReparaciones} reparaciones certificadas registradas en el taller.`
                : 'Primera reparación certificada registrada para este equipo.'}
            </span>
          </div>

          {/* Refacciones sustituidas (RF-08) */}
          {refacciones && refacciones.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#24529F]" />
                Refacciones y Componentes Sustituidos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {refacciones.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex justify-between items-center gap-2"
                  >
                    <span className="font-semibold text-slate-800">{ref.nombre}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-[#24529F] border border-blue-200 capitalize shrink-0">
                      {ref.tipo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidencias fotográficas antes / después (RF-07 / RF-12) */}
          {fotosNormalizadas.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200 print:hidden">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-400 mb-3 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-[#24529F]" />
                Evidencia Fotográfica del Servicio (Antes y Después)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fotosNormalizadas.map((ev, idx) => (
                  <a
                    key={idx}
                    href={ev.url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group relative block"
                  >
                    <img
                      src={ev.url}
                      alt={`Evidencia ${ev.etapa} ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono uppercase bg-[#0D1B3E]/85 px-2 py-0.5 rounded-md text-white">
                      {ev.etapa}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Términos de Garantía */}
          {garantia?.terminos && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-400 mb-2">
                Términos y Condiciones de la Garantía
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                {garantia.terminos}
              </p>
            </div>
          )}

          {/* Sello UUID */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Sello digital UUID: {certToken}</span>
            <span>NOM-174-SCFI-2007 • InfoFIX CUCEI</span>
          </div>
        </div>
      </main>
    </div>
  );
}