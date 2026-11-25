import { useState, useEffect } from 'react';
import { Edit3, X, Check, Plus } from 'lucide-react';

export default function EditarEstadoInicialModal({
  isOpen,
  orden,
  onClose,
  onSave,
}) {
  const [falla, setFalla] = useState('');
  const [condicion, setCondicion] = useState('');
  const [accesorios, setAccesorios] = useState([]);
  const [otroAccesorio, setOtroAccesorio] = useState('');
  const [mostrarOtroInput, setMostrarOtroInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const accesoriosBase = ['Funda', 'Tarjeta SIM', 'Cargador', 'Memoria SD', 'Ninguno'];

  useEffect(() => {
    if (orden) {
      setFalla(orden.falla_reportada || '');
      setCondicion(orden.condicion_fisica || '');
      setAccesorios(Array.isArray(orden.accesorios) ? [...orden.accesorios] : []);
    }
    setOtroAccesorio('');
    setMostrarOtroInput(false);
    setError(null);
  }, [isOpen, orden]);

  if (!isOpen || !orden) return null;

  const toggleAccesorio = (acc) => {
    if (acc === 'Ninguno') {
      if (accesorios.includes('Ninguno')) {
        setAccesorios([]);
      } else {
        setAccesorios(['Ninguno']);
      }
      return;
    }

    const sinNinguno = accesorios.filter((a) => a !== 'Ninguno');
    if (sinNinguno.includes(acc)) {
      setAccesorios(sinNinguno.filter((a) => a !== acc));
    } else {
      setAccesorios([...sinNinguno, acc]);
    }
  };

  const handleAgregarOtro = (e) => {
    e.preventDefault();
    const valor = otroAccesorio.trim();
    if (valor && !accesorios.includes(valor)) {
      const sinNinguno = accesorios.filter((a) => a !== 'Ninguno');
      setAccesorios([...sinNinguno, valor]);
      setOtroAccesorio('');
      setMostrarOtroInput(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!falla.trim()) {
      setError('La falla reportada es obligatoria.');
      return;
    }
    if (!condicion.trim()) {
      setError('La condición física inicial es obligatoria.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        falla_reportada: falla.trim(),
        condicion_fisica: condicion.trim(),
        accesorios,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar el estado inicial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060F1F]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-[#0A0D12]">
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2452BF] flex items-center justify-center shadow-xs">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Editar estado inicial</h2>
              <p className="text-xs text-slate-500 font-mono">
                {orden.folio} · Solo editable en estado Recibido (RF-05)
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

          {/* Falla reportada */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Falla reportada *</label>
            <textarea
              rows={3}
              required
              value={falla}
              onChange={(e) => setFalla(e.target.value)}
              placeholder="Describe detalladamente el problema que reporta el cliente..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2452BF] focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 transition-all resize-none"
            />
          </div>

          {/* Condición física inicial */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Condición física inicial *</label>
            <textarea
              rows={2}
              required
              value={condicion}
              onChange={(e) => setCondicion(e.target.value)}
              placeholder="Detalla golpes, rayones en pantalla o chasis al recibir..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2452BF] focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 transition-all resize-none"
            />
          </div>

          {/* Accesorios recibidos */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Accesorios recibidos</label>
            <div className="flex flex-wrap gap-2">
              {accesoriosBase.map((acc) => {
                const activo = accesorios.includes(acc);
                return (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => toggleAccesorio(acc)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      activo
                        ? 'bg-[#0D1B3E] text-white border-[#0D1B3E] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {activo && <Check className="w-3.5 h-3.5" />}
                    <span>{acc}</span>
                  </button>
                );
              })}

              {/* Otros accesorios personalizados ya agregados */}
              {accesorios
                .filter((a) => !accesoriosBase.includes(a))
                .map((otro) => (
                  <button
                    key={otro}
                    type="button"
                    onClick={() => toggleAccesorio(otro)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-[#0D1B3E] text-white border-[#0D1B3E] shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{otro}</span>
                  </button>
                ))}

              {/* Botón para añadir otro accesorio */}
              {!mostrarOtroInput ? (
                <button
                  type="button"
                  onClick={() => setMostrarOtroInput(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Otro...</span>
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={otroAccesorio}
                    onChange={(e) => setOtroAccesorio(e.target.value)}
                    placeholder="Ej. Stylus"
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#2452BF] w-24"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAgregarOtro(e);
                      if (e.key === 'Escape') setMostrarOtroInput(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAgregarOtro}
                    className="px-2 py-1 rounded-lg bg-[#0D1B3E] text-white text-xs font-semibold"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-mono">
            Puedes editar el estado inicial hasta que la orden pase a Diagnóstico.
          </p>

          {/* Pie de modal */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
