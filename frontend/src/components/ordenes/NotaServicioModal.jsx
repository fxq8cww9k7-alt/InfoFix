import { useState, useEffect, useCallback } from 'react';
import { X, Printer, Wrench, Check } from 'lucide-react';
import { apiRequest } from '../../api/client';

export default function NotaServicioModal({ isOpen, ordenId, onClose }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarNota = useCallback(async () => {
    if (!ordenId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest(`/api/ordenes/${ordenId}/nota-servicio`);
      setDatos(res);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la nota de servicio.');
    } finally {
      setLoading(false);
    }
  }, [ordenId]);

  useEffect(() => {
    if (isOpen && ordenId) {
      cargarNota();
    }
  }, [isOpen, ordenId, cargarNota]);

  if (!isOpen) return null;

  const orden = datos?.orden;
  const taller = datos?.taller || {};
  // El backend regresa `estatus: { url_estatus, qr }`
  const qrDataUrl = datos?.estatus?.qr;
  const urlEstatus = datos?.estatus?.url_estatus;
  const fotosAntes = orden?.evidencias?.antes || [];

  return (
    <div className="fixed inset-0 z-50 bg-[#060F1F]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden text-[#0A0D12] print:border-none print:shadow-none print:rounded-none print:max-w-none">
        {/* Barra superior de acciones */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              {orden?.estado || 'Recibido'} · folio generado
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading || !orden}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir nota de servicio (QR)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido imprimible de la nota (P12 Figma) */}
        <div className="p-8 space-y-5 text-xs text-slate-800 print:p-6 print:space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-mono text-xs">
              Cargando documento imprimible y generando QR...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-semibold">
              {error}
            </div>
          ) : orden ? (
            <>
              {/* Encabezado: InfoFIX + Taller + QR */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#0D1B3E]">
                    <div className="w-7 h-7 rounded-lg bg-[#24529F] flex items-center justify-center text-white">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <span className="text-base font-black tracking-tight">InfoFIX</span>
                    {(taller.nombre && taller.nombre !== 'InfoFIX' || taller.direccion) && (
                      <span className="text-[11px] text-slate-500 font-normal">
                        {[taller.nombre !== 'InfoFIX' ? taller.nombre : null, taller.direccion].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                    NOTA DE SERVICIO · RECEPCIÓN
                  </p>
                  <h1 className="text-xl font-black text-slate-900 font-mono tracking-tight">
                    Folio {orden.folio}
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    Escanea el código para ver en tiempo real cómo va la reparación de tu equipo.
                  </p>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <div className="p-2 bg-white border border-slate-200 rounded-xl">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Seguimiento" className="w-24 h-24 object-contain" />
                    ) : (
                      <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[9px] font-mono text-slate-400">
                        Sin QR
                      </div>
                    )}
                  </div>
                  {urlEstatus && (
                    <span className="text-[9px] font-mono text-slate-400 mt-1 max-w-[130px] truncate">
                      {urlEstatus.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </div>
              </div>

              {/* Resumen horizontal de recepción */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 print:bg-white print:border-slate-300">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">RECEPCIÓN</span>
                  <strong className="text-slate-900 text-[11px]">
                    {new Date(orden.fecha_recepcion).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">EQUIPO</span>
                  <strong className="text-slate-900 text-[11px]">
                    {orden.dispositivo?.marca} {orden.dispositivo?.modelo}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">IMEI / SERIE</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{orden.dispositivo?.imei_o_serie}</strong>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">ESTADO ACTUAL</span>
                  <strong className="text-slate-900 text-[11px]">{orden.estado}</strong>
                </div>
              </div>

              {/* Cliente y Accesorios recibidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">CLIENTE</span>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Nombre</span>
                    <strong className="text-slate-900">{orden.cliente?.nombre_completo}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Teléfono</span>
                    <strong className="text-slate-900 font-mono">{orden.cliente?.telefono}</strong>
                  </div>
                  {orden.cliente?.email && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Correo</span>
                      <span className="text-slate-700 font-mono">{orden.cliente.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                    ACCESORIOS RECIBIDOS
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Array.isArray(orden.accesorios) && orden.accesorios.length > 0 ? (
                      orden.accesorios.map((acc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50/70 border border-blue-100 text-[#0D1B3E] font-medium text-[11px]"
                        >
                          <Check className="w-3 h-3 text-[#24529F]" />
                          {acc}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">Ningún accesorio entregado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Falla reportada y condición física */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold mb-1">
                    FALLA REPORTADA
                  </span>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 print:border-slate-200 text-slate-800 leading-relaxed">
                    {orden.falla_reportada}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold mb-1">
                    CONDICIÓN FÍSICA
                  </span>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 print:border-slate-200 text-slate-800 leading-relaxed">
                    {orden.condicion_fisica}
                  </p>
                </div>
              </div>

              {/* Fotos de recepción e Importante (P12 Figma) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold mb-1.5">
                    FOTOS DE RECEPCIÓN
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {fotosAntes.length > 0 ? (
                      fotosAntes.map((f, idx) => (
                        <div
                          key={f.id || idx}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                        >
                          <img src={f.url} alt={`Recepción ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[7px] font-mono font-bold bg-[#0D1B3E] text-white">
                            ANTES
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Sin fotografías registradas</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold mb-1.5">
                    IMPORTANTE
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4">
                    <li>Presenta esta nota para recoger tu equipo.</li>
                    <li>Al entregar recibirás un certificado digital con la garantía.</li>
                  </ul>
                </div>
              </div>

              {/* Firmas */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div className="border-t border-slate-400 text-center pt-1.5">
                  <p className="text-[10px] text-slate-500">Firma del cliente</p>
                  <p className="text-[11px] font-bold text-slate-800">{orden.cliente?.nombre_completo}</p>
                </div>
                <div className="border-t border-slate-400 text-center pt-1.5">
                  <p className="text-[10px] text-slate-500">Recibió</p>
                  <p className="text-[11px] font-bold text-slate-800">{orden.tecnico?.nombre || 'Personal del taller'}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: 148mm 215mm;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
}
