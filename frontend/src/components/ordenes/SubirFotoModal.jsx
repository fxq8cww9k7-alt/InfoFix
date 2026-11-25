import { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Trash2, RefreshCw } from 'lucide-react';

export default function SubirFotoModal({
  isOpen,
  folio = '',
  equipo = '',
  estado = '',
  conteoAntes = 0,
  conteoDespues = 0,
  onClose,
  onUpload,
}) {
  const fileInputRef = useRef(null);
  const esRecibido = estado === 'Recibido';

  const [tipo, setTipo] = useState(esRecibido ? 'antes' : 'despues');
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTipo(esRecibido ? 'antes' : 'despues');
    setArchivo(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }, [isOpen, esRecibido]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const esImagenValida =
      ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type) ||
      /\.(jpg|jpeg|png)$/i.test(file.name);
    if (!esImagenValida) {
      setError('Formato no válido (solo JPG o PNG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Tamaño excedido: máximo 5 MB por fotografía.');
      return;
    }

    setError(null);
    setArchivo(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleEliminarArchivo = () => {
    setArchivo(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo) {
      setError('Selecciona una fotografía para subir.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('fotos', archivo);

      await onUpload(formData);
      handleEliminarArchivo();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al subir la fotografía.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060F1F]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-[#0A0D12]">
        {/* Cabecera */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2452BF] flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Subir fotografía</h2>
              <p className="text-xs text-slate-500 font-mono">
                {folio ? `${folio} · ` : ''}
                {equipo ? `${equipo} · ` : ''}
                etapa {estado}
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Selector de Etapa */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Etapa de la foto *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!esRecibido}
                onClick={() => setTipo('antes')}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  !esRecibido
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : tipo === 'antes'
                      ? 'border-[#2452BF] bg-[#F0F6FF] shadow-xs ring-1 ring-[#2452BF] cursor-pointer'
                      : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Antes</span>
                  {esRecibido ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-[#2452BF] font-semibold">
                      {conteoAntes} / 5
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                      Bloqueado
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {esRecibido ? 'Fotos del estado de recepción' : 'Solo al recibir el equipo (Recibido)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('despues')}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  tipo === 'despues'
                    ? 'border-[#2452BF] bg-[#F0F6FF] shadow-xs ring-1 ring-[#2452BF]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Después</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-[#2452BF] font-semibold">
                    {conteoDespues} / 5
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Cómo queda al terminar el trabajo
                </span>
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />

          {!archivo ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-[#2452BF] bg-[#F8FAFC] hover:bg-blue-50/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2452BF] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">Tomar foto o elegir archivo</p>
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                JPG o PNG · máximo 5 MB · hasta 5 fotos por etapa
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-200">
                <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                <span
                  className={`absolute top-0.5 left-0.5 px-1 py-0.2 rounded text-[7px] font-mono font-bold uppercase ${
                    tipo === 'antes' ? 'bg-[#0D1B3E] text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {tipo === 'antes' ? 'ANTES' : 'DESPUÉS'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{archivo.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {(archivo.size / (1024 * 1024)).toFixed(1)} MB ·{' '}
                  {(archivo.type.split('/')[1] || archivo.name.split('.').pop() || 'IMG').toUpperCase()}
                </p>

                <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1 rounded-full w-full" />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
                  <Check className="w-3 h-3" />
                  <span>Lista para subir</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 rounded bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Cambiar
                </button>
                <button
                  type="button"
                  onClick={handleEliminarArchivo}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-rose-600 hover:text-rose-700 rounded bg-white border border-slate-200 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Eliminar
                </button>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">Se agregará a evidencias</span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !archivo}
                className="px-5 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {loading ? 'Subiendo...' : 'Subir foto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
