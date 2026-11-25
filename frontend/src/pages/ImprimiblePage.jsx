/**
 * @file ImprimiblePage.jsx
 * @description Vista imprimible del certificado digital de entrega y garantía (P13 / T22).
 * Optimizada para formato de impresión Media Carta.
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';

export default function ImprimiblePage() {
  const { token } = useParams();
  const [certificado, setCertificado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarCertificado = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest(`/api/certificados/${token}`);
      setCertificado(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el certificado digital.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    cargarCertificado();
  }, [cargarCertificado]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 font-mono text-xs">
        Generando certificado digital...
      </div>
    );
  }

  if (error || !certificado) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-bold text-rose-600 mb-2">Error de validación</p>
        <p className="text-xs text-slate-600 mb-4">{error || 'Certificado no encontrado.'}</p>
        <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-[#0D1B3E] text-white text-xs font-semibold">
          Volver al Sistema
        </Link>
      </div>
    );
  }

  const tallerNombre = certificado.taller?.nombre || 'InfoFIX';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4 font-sans print:bg-white print:p-0">
      <div className="max-w-[148mm] w-full flex items-center justify-between mb-4 print:hidden">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D1B3E] text-white text-xs font-semibold shadow-sm hover:bg-[#12284A] transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Imprimir / Guardar PDF (Media Carta)
        </button>
      </div>

      <div className="w-[148mm] bg-white border border-slate-200 shadow-xl rounded-2xl p-6 print:w-full print:border-none print:shadow-none print:p-4 text-[#0B0D12] text-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-base font-extrabold text-[#0D1B3E] tracking-tight">{tallerNombre}</h1>
            <p className="text-[10px] text-slate-500 font-mono">Certificado Oficial de Reparación y Garantía</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Folio de Orden</span>
            <strong className="text-sm font-mono text-[#24529F]">{certificado.folio}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 print:bg-transparent print:border-slate-200">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Dispositivo</span>
            <strong className="text-slate-800">
              {certificado.dispositivo?.marca} {certificado.dispositivo?.modelo}
            </strong>
            <p className="text-[11px] font-mono text-slate-600 capitalize">Tipo: {certificado.dispositivo?.tipo}</p>
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Identificador (IMEI / Serie)</span>
            <strong className="font-mono text-slate-800">{certificado.dispositivo?.imei_o_serie}</strong>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Falla Reportada</span>
          <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 print:border-slate-200">
            {certificado.falla_reportada}
          </p>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">
            Refacciones / Componentes Instalados
          </span>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                <tr>
                  <th className="p-2">Componente</th>
                  <th className="p-2">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!certificado.refacciones || certificado.refacciones.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="p-2 text-center text-slate-400 italic">
                      No se requirió cambio de refacciones.
                    </td>
                  </tr>
                ) : (
                  certificado.refacciones.map((ref, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium text-slate-800">{ref.nombre}</td>
                      <td className="p-2 text-slate-600 uppercase font-mono text-[10px]">{ref.tipo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 items-center pt-2 border-t border-slate-200">
          <div className="col-span-2 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4" /> Garantía de {certificado.garantia?.dias ?? 0} días naturales
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">{certificado.garantia?.terminos}</p>
            {certificado.garantia?.fin && (
              <span className="text-[9px] font-mono text-slate-400 block pt-1">
                Vigencia hasta: {new Date(certificado.garantia.fin).toLocaleDateString('es-MX')}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl">
            {certificado.qr ? (
              <img src={certificado.qr} alt="QR de verificación" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 bg-slate-200 flex items-center justify-center text-[9px] font-mono text-slate-500 text-center">
                Sin QR
              </div>
            )}
            <span className="text-[8px] font-mono text-slate-500 mt-1 text-center">Escanee para verificar</span>
          </div>
        </div>

        <div className="text-center pt-3 border-t border-slate-100 text-[9px] text-slate-400 font-mono">
          Token: {certificado.token} • Emitido el{' '}
          {certificado.fecha_emision ? new Date(certificado.fecha_emision).toLocaleDateString('es-MX') : ''}
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: 148mm 215mm;
            margin: 10mm;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
