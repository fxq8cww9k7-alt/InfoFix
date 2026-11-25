import { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, CheckCircle2, Check, X, FileCheck } from 'lucide-react';

export default function AvanzarEstadoModal({
  isOpen,
  orden,
  estadoActual = '',
  siguienteEstado = '',
  onClose,
  onConfirmAvanzar,
  onAbrirSubirFoto,
  onFocusGarantia,
}) {
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const esEntrega = siguienteEstado === 'Entregado';

  useEffect(() => {
    setNota('');
    setError(null);
  }, [isOpen, siguienteEstado]);

  if (!isOpen || !orden) return null;

  const disp = orden.dispositivo || {};
  const cliente = orden.cliente || {};

  // Validación de requisitos para entrega final (RF-10)
  const tieneFotoAntes = (orden.evidencias?.antes?.length || 0) >= 1;
  const tieneFotoDespues = (orden.evidencias?.despues?.length || 0) >= 1;
  const tieneGarantia = Boolean(
    orden.garantia?.dias !== null &&
    orden.garantia?.dias !== undefined &&
    orden.garantia?.terminos,
  );

  // Verificación de historial de etapas previas (solo tipo === 'estado')
  const estadosHistorial = new Set(
    (orden.historial || []).filter((h) => h.tipo === 'estado').map((h) => h.estado),
  );
  const pasoEtapasPrevias =
    estadosHistorial.has('Diagnóstico') &&
    estadosHistorial.has('Reparación') &&
    estadosHistorial.has('Pruebas');

  const faltanRequisitos =
    esEntrega && (!tieneFotoAntes || !tieneFotoDespues || !tieneGarantia || !pasoEtapasPrevias);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nota.trim() || nota.trim().length < 5) {
      setError('Debe ingresar una nota descriptiva de al menos 5 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirmAvanzar({
        estado: siguienteEstado,
        nota: nota.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al avanzar el estado de la orden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060F1F]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-[#0A0D12]">
        {esEntrega && faltanRequisitos ? (
          <div>
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">No se puede entregar todavía</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {orden.folio} · {disp.marca} {disp.modelo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 font-semibold">
                Para emitir el certificado digital completa estos puntos:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  {tieneFotoAntes ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className={tieneFotoAntes ? 'text-slate-700' : 'text-rose-700 font-semibold'}>
                    Foto de recepción (antes)
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {tieneFotoDespues ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className={tieneFotoDespues ? 'text-slate-700' : 'text-rose-700 font-semibold'}>
                    Foto de entrega (después)
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {tieneGarantia ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className={tieneGarantia ? 'text-slate-700' : 'text-rose-700 font-semibold'}>
                    Garantía con días y términos
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {pasoEtapasPrevias ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className={pasoEtapasPrevias ? 'text-slate-700' : 'text-rose-700 font-semibold'}>
                    Pasó por Diagnóstico, Reparación y Pruebas
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                {!tieneFotoDespues && onAbrirSubirFoto && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAbrirSubirFoto();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Subir foto de entrega
                  </button>
                )}
                {tieneFotoDespues && !tieneGarantia && onFocusGarantia && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFocusGarantia();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Configurar garantía
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : esEntrega ? (
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Entregar y generar certificado
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {orden.folio} · {disp.marca} {disp.modelo} · {cliente.nombre_completo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-mono font-semibold">
                <span className="text-slate-600">● {estadoActual}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-emerald-700 font-bold">● {siguienteEstado}</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-950 space-y-2 text-xs">
                <p className="font-bold text-emerald-800">Todo listo para entregar</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Foto de recepción (antes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Foto de entrega (después)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Garantía: {orden.garantia?.dias} días naturales · inicia al entregar
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pasó por Diagnóstico, Reparación y Pruebas</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Nota de entrega *</label>
                <textarea
                  rows={3}
                  required
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Describe cómo se entrega el equipo y qué verificó el cliente..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2452BF] focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 transition-all resize-none"
                />
                <p className="text-[10px] text-slate-400 font-mono">
                  Mínimo 5 caracteres · queda registrada en la línea de tiempo
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs">
                <FileCheck className="w-4 h-4 text-[#2452BF] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Se generará el certificado con QR</p>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    La orden quedará bloqueada: ya no se podrán cambiar fotos, piezas ni garantía.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {loading ? 'Entregando...' : 'Entregar y generar certificado'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2452BF] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Avanzar a {siguienteEstado}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {orden.folio} · {disp.marca} {disp.modelo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-mono font-semibold">
                <span className="text-slate-600">● {estadoActual}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#2452BF] font-bold">● {siguienteEstado}</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Nota técnica *</label>
                <textarea
                  rows={4}
                  required
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder={`Describe el diagnóstico, procedimiento o pruebas para ${siguienteEstado}...`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2452BF] focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 transition-all resize-none placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-400 font-mono">
                  Mínimo 5 caracteres · queda registrada en la línea de tiempo
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {loading ? 'Avanzando...' : 'Confirmar cambio'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
