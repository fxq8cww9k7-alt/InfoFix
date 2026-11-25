import { useState, useEffect } from 'react';
import { Package, X, FileText, Trash2, CheckCircle2 } from 'lucide-react';

export default function PiezaModal({
  isOpen,
  mode = 'crear',
  pieza = null,
  folio = '',
  equipo = '',
  estado = '',
  onClose,
  onSave,
  onDeleteClick,
}) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('original');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pieza && mode === 'editar') {
      setNombre(pieza.nombre || '');
      setTipo(pieza.tipo || 'original');
      setNumeroSerie(pieza.numero_serie || '');
    } else {
      setNombre('');
      setTipo('original');
      setNumeroSerie('');
    }
    setError(null);
  }, [pieza, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la pieza es obligatorio.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onSave({
        nombre: nombre.trim(),
        tipo,
        numero_serie: numeroSerie.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar la pieza.');
    } finally {
      setLoading(false);
    }
  };

  const tipos = [
    {
      id: 'original',
      titulo: 'Original',
      subtitulo: 'Del fabricante del equipo',
    },
    {
      id: 'compatible',
      titulo: 'Compatible',
      subtitulo: 'Genérica certificada',
    },
    {
      id: 'reacondicionada',
      titulo: 'Reacondicionada',
      subtitulo: 'Usada y revisada',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#060F1F]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-[#0A0D12]">
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2452BF] flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {mode === 'crear' ? 'Agregar pieza' : 'Editar pieza'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {folio ? `${folio} · ` : ''}
                {equipo ? `${equipo} · ` : ''}
                etapa {estado}
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Nombre de la pieza */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Nombre de la pieza *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Conector de carga Lightning / Pantalla OLED"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2452BF] focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Tipo de pieza con selector de tarjetas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Tipo de pieza *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {tipos.map((t) => {
                const isSelected = tipo === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipo(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#2452BF] bg-[#F0F6FF] shadow-xs ring-1 ring-[#2452BF]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{t.titulo}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#2452BF] bg-[#2452BF]' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight block">{t.subtitulo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* No. de serie o lote (opcional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">No. de serie o lote (opcional)</label>
            <input
              type="text"
              value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)}
              placeholder="Ej. LT-2026-0118 o DSP-A2633-88K21"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2452BF] focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 font-mono transition-all placeholder:text-slate-400"
            />
            <p className="text-[10px] text-slate-400 font-mono">
              Si la pieza no trae número de serie, deja este campo vacío.
            </p>
          </div>

          {/* Banner informativo */}
          {mode === 'crear' ? (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs">
              <FileText className="w-4 h-4 text-[#2452BF] shrink-0 mt-0.5" />
              <span>La pieza aparecerá en el certificado digital cuando se entregue el equipo.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
              <span className="font-bold text-amber-700">!</span>
              <span>Cuando la orden pase a Entregado ya no se podrán editar ni eliminar piezas.</span>
            </div>
          )}

          {/* Pie de modal con acciones */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {mode === 'editar' ? (
              <button
                type="button"
                onClick={onDeleteClick}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Eliminar pieza
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95"
              >
                {loading ? 'Guardando...' : mode === 'crear' ? 'Agregar pieza' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
