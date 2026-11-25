import { useState } from 'react';
import { Trash2, X } from 'lucide-react';

export default function EliminarPiezaModal({
  isOpen,
  pieza = null,
  folio = '',
  equipo = '',
  onClose,
  onConfirm,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !pieza) return null;

  const handleEliminar = async () => {
    try {
      setLoading(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al eliminar la pieza.');
    } finally {
      setLoading(false);
    }
  };

  const tipoLabel = {
    original: 'Original',
    compatible: 'Compatible',
    reacondicionada: 'Reacondicionada',
  }[pieza.tipo] || pieza.tipo;

  return (
    <div className="fixed inset-0 z-50 bg-[#060F1F]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-[#0A0D12]">
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">¿Eliminar esta pieza?</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {folio ? `${folio} · ` : ''}
                {equipo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Tarjeta de resumen de la pieza */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">{pieza.nombre}</p>
              {pieza.numero_serie && (
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">SN: {pieza.numero_serie}</p>
              )}
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#2452BF] text-[10px] font-mono font-bold uppercase">
              {tipoLabel}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            La pieza se quitará de la orden y no aparecerá en el certificado. Esta acción no se puede deshacer.
          </p>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleEliminar}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? 'Eliminando...' : 'Eliminar pieza'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
