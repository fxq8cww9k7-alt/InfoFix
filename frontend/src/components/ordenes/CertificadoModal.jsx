import { useState, useEffect, useCallback } from 'react';
import { X, Printer, Copy, Check, Wrench } from 'lucide-react';
import { apiRequest } from '../../api/client';

export default function CertificadoModal({ isOpen, ordenId, onClose }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const cargarCertificado = useCallback(async () => {
    if (!ordenId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest(`/api/ordenes/${ordenId}/certificado`);
      setDatos(res);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el certificado.');
    } finally {
      setLoading(false);
    }
  }, [ordenId]);

  useEffect(() => {
    if (isOpen && ordenId) {
      cargarCertificado();
    }
  }, [isOpen, ordenId, cargarCertificado]);

  if (!isOpen) return null;

  const handleCopiarEnlace = () => {
    if (datos?.certificado?.url_publica) {
      navigator.clipboard.writeText(datos.certificado.url_publica);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const orden = datos?.orden;
  const certificado = datos?.certificado;
  const taller = datos?.taller || {};
  const historialEtapas = (orden?.historial || []).filter((h) => h.tipo === 'estado');
  const fotosAntes = orden?.evidencias?.antes || [];
  const fotosDespues = orden?.evidencias?.despues || [];

  return (
    <div className="fixed inset-0 z-50 bg-[#060F1F]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden text-[#0A0D12] print:border-none print:shadow-none print:rounded-none print:max-w-none">
        {/* Barra superior de herramientas */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Entregado · orden bloqueada
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarEnlace}
              disabled={!certificado?.url_publica}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Enlace copiado' : 'Copiar enlace'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading || !orden}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Guardar PDF / Imprimir</span>
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

        {/* Hoja del Certificado Digital (P13 Figma) */}
        <div className="p-8 space-y-5 text-xs text-slate-800 print:p-6 print:space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-mono text-xs">
              Recuperando certificado oficial y código QR...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-semibold">
              {error}
            </div>
          ) : orden ? (
            <>
              {/* Encabezado */}
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
                  <p className="text-[10px] font-mono text-emerald-700 uppercase tracking-wider font-bold">
                    CERTIFICADO DIGITAL DE REPARACIÓN
                  </p>
                  <h1 className="text-xl font-black text-slate-900 font-mono tracking-tight">
                    Folio {orden.folio}
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    Escanea el código para comprobar que este documento es auténtico y no fue modificado.
                  </p>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <div className="p-2 bg-white border border-slate-200 rounded-xl">
                    {certificado?.qr ? (
                      <img src={certificado.qr} alt="QR Verificación" className="w-24 h-24 object-contain" />
                    ) : (
                      <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[9px] font-mono text-slate-400">
                        Sin QR
                      </div>
                    )}
                  </div>
                  {certificado?.url_publica && (
                    <span className="text-[9px] font-mono text-slate-400 mt-1 max-w-[130px] truncate">
                      {certificado.url_publica.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </div>
              </div>

              {/* Resumen de equipo y fechas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 print:bg-white print:border-slate-300">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">EQUIPO</span>
                  <strong className="text-slate-900 text-[11px]">
                    {orden.dispositivo?.marca} {orden.dispositivo?.modelo}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">SN / IMEI</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{orden.dispositivo?.imei_o_serie}</strong>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">RECEPCIÓN</span>
                  <strong className="text-slate-900 text-[11px]">
                    {orden.fecha_recepcion
                      ? new Date(orden.fecha_recepcion).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">ENTREGA</span>
                  <strong className="text-slate-900 text-[11px]">
                    {orden.fecha_entrega
                      ? new Date(orden.fecha_entrega).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </strong>
                </div>
              </div>

              {/* Falla y piezas reemplazadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold mb-1">
                    FALLA Y ESTADO INICIAL
                  </span>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 print:border-slate-200 text-slate-800 leading-relaxed">
                    {orden.falla_reportada}
                    {Array.isArray(orden.accesorios) && orden.accesorios.length > 0
                      ? ` · Accesorios: ${orden.accesorios.join(', ')}.`
                      : ''}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold mb-1">
                    PIEZAS REEMPLAZADAS
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 print:border-slate-200 space-y-1.5">
                    {!orden.refacciones || orden.refacciones.length === 0 ? (
                      <p className="text-slate-400 italic">No se requirió cambio de refacciones.</p>
                    ) : (
                      orden.refacciones.map((r, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">{r.nombre}</span>
                          <span className="text-[10px] font-mono text-slate-500 capitalize">{r.tipo}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Historial del servicio */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold mb-1.5">
                  HISTORIAL DEL SERVICIO
                </span>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {historialEtapas.map((h, i) => (
                    <div key={i} className="px-3.5 py-2 flex items-start gap-3 text-[11px]">
                      <span className="font-bold text-slate-900 w-24 shrink-0">{h.estado}</span>
                      <span className="font-mono text-slate-400 w-24 shrink-0">
                        {new Date(h.fecha).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-slate-700 flex-1">{h.nota}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidencias y Garantía */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold mb-1.5">
                    EVIDENCIAS
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {fotosAntes.slice(0, 2).map((f, i) => (
                      <div
                        key={`a-${i}`}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                      >
                        <img src={f.url} alt={`Antes ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[7px] font-mono font-bold bg-[#0D1B3E] text-white">
                          ANTES
                        </span>
                      </div>
                    ))}
                    {fotosDespues.slice(0, 2).map((f, i) => (
                      <div
                        key={`d-${i}`}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                      >
                        <img src={f.url} alt={`Después ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[7px] font-mono font-bold bg-emerald-600 text-white">
                          DESPUÉS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold mb-1.5">
                    GARANTÍA
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          orden.garantia?.estado === 'Vigente'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        ● {orden.garantia?.estado || 'Vigente'}
                      </span>
                      <span className="font-bold text-slate-900">
                        {orden.garantia?.dias} días
                        {orden.garantia?.fin
                          ? ` · hasta ${new Date(orden.garantia.fin).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}`
                          : ''}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed">{orden.garantia?.terminos}</p>
                  </div>
                </div>
              </div>

              {/* Pie: Token UUID y Técnico responsable */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
                  <span className="uppercase font-bold text-slate-400 block">TOKEN DEL CERTIFICADO</span>
                  <p className="text-slate-800 break-all">{certificado?.token_uuid}</p>
                  <p className="text-slate-400">
                    Emitido{' '}
                    {certificado?.fecha_emision
                      ? new Date(certificado.fecha_emision).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </p>
                </div>

                <div className="border-t border-slate-400 pt-1.5 text-center min-w-[160px]">
                  <p className="text-[10px] text-slate-500">Técnico responsable</p>
                  <p className="text-[11px] font-bold text-slate-800">
                    {orden.tecnico?.nombre || 'Personal del taller'}
                  </p>
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
