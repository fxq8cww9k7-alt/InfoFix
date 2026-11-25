import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import DispositivoIlustracion from './DispositivoIlustracion';

export default function VerFotoModal({
  isOpen,
  fotos = [],
  fotoActualIndex = 0,
  setFotoActualIndex,
  onClose,
  bloqueada = false,
  equipo = '',
  tecnicoNombre = '',
}) {
  const [imageError, setImageError] = useState(false);
  const [thumbErrors, setThumbErrors] = useState({});
  const foto = fotos[fotoActualIndex] || fotos[0];

  useEffect(() => {
    setImageError(false);
  }, [fotoActualIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && fotoActualIndex > 0) {
        setFotoActualIndex(fotoActualIndex - 1);
      }
      if (e.key === 'ArrowRight' && fotoActualIndex < fotos.length - 1) {
        setFotoActualIndex(fotoActualIndex + 1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, fotoActualIndex, fotos.length, onClose, setFotoActualIndex]);

  if (!isOpen || !foto) return null;

  const esAntes = (foto.tipo || '').toLowerCase() === 'antes';
  const fechaFormateada = foto.fecha_subida
    ? new Date(foto.fecha_subida).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-[#060F1F]/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Barra superior del visor */}
      <div className="flex items-center justify-between text-white max-w-6xl mx-auto w-full pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide uppercase ${
                esAntes ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-emerald-600 text-white'
              }`}
            >
              {esAntes ? 'ANTES' : 'DESPUÉS'}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Foto {fotoActualIndex + 1} de {fotos.length}
            </h2>
          </div>
          <p className="text-[11px] text-slate-300 font-mono mt-0.5">
            {equipo ? `${equipo} · ` : ''}
            {fechaFormateada ? `Subida el ${fechaFormateada}` : ''}
            {tecnicoNombre ? ` por ${tecnicoNombre}` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10 active:scale-95 cursor-pointer"
          title="Cerrar visor (Esc)"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar foto</span>
        </button>
      </div>

      {/* Área central: Imagen y Controles de navegación */}
      <div className="flex-1 flex items-center justify-center my-4 relative max-w-5xl mx-auto w-full">
        {fotos.length > 1 && (
          <button
            type="button"
            onClick={() => setFotoActualIndex(Math.max(0, fotoActualIndex - 1))}
            disabled={fotoActualIndex === 0}
            className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/10 shadow-lg active:scale-95 cursor-pointer"
            title="Foto anterior (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="bg-slate-900/70 rounded-2xl p-4 sm:p-6 max-h-[62vh] w-full max-w-2xl flex items-center justify-center relative shadow-2xl overflow-hidden border border-white/10">
          <span
            className={`absolute top-4 left-4 z-10 px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-wider uppercase shadow-md ${
              esAntes ? 'bg-[#0D1B3E] text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {esAntes ? 'ANTES' : 'DESPUÉS'}
          </span>

          {foto.url && !imageError ? (
            <img
              src={foto.url}
              alt={`Evidencia ${esAntes ? 'Antes' : 'Después'} ${fotoActualIndex + 1}`}
              onError={() => setImageError(true)}
              className="max-h-[54vh] max-w-full object-contain rounded-xl shadow-inner"
            />
          ) : (
            <div className="w-56 h-80 flex items-center justify-center p-2 drop-shadow-xl">
              <DispositivoIlustracion esAntes={esAntes} className="w-full h-full" />
            </div>
          )}
        </div>

        {fotos.length > 1 && (
          <button
            type="button"
            onClick={() => setFotoActualIndex(Math.min(fotos.length - 1, fotoActualIndex + 1))}
            disabled={fotoActualIndex === fotos.length - 1}
            className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/10 shadow-lg active:scale-95 cursor-pointer"
            title="Siguiente foto (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Tira inferior de miniaturas reales */}
      <div className="max-w-3xl mx-auto w-full flex flex-col items-center space-y-2 pb-2">
        <div className="flex items-center gap-2.5 overflow-x-auto p-2 max-w-full">
          {fotos.map((f, idx) => {
            const fEsAntes = (f.tipo || '').toLowerCase() === 'antes';
            const isActive = idx === fotoActualIndex;
            const thumbKey = f.id || idx;
            return (
              <button
                key={thumbKey}
                type="button"
                onClick={() => setFotoActualIndex(idx)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all bg-slate-800 flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/50 scale-105 shadow-md'
                    : 'border-white/20 opacity-60 hover:opacity-90'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 z-10 px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${
                    fEsAntes ? 'bg-[#0D1B3E] text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {fEsAntes ? 'ANT' : 'DES'}
                </span>
                {f.url && !thumbErrors[thumbKey] ? (
                  <img
                    src={f.url}
                    alt={`Miniatura ${idx + 1}`}
                    onError={() => setThumbErrors((prev) => ({ ...prev, [thumbKey]: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <DispositivoIlustracion esAntes={fEsAntes} className="w-12 h-14 p-1" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-400 font-mono text-center">
          {bloqueada
            ? 'Las fotos no se pueden eliminar cuando la orden ya está Entregada.'
            : 'Usa las flechas del teclado ← → para navegar o Esc para cerrar.'}
        </p>
      </div>
    </div>
  );
}
