import { useState, useEffect } from 'react';
import { Send, X, QrCode, Mail, Bell } from 'lucide-react';
import { apiRequest } from '../../api/client';

export default function NotificarClienteModal({
  isOpen,
  orden,
  onClose,
  onSend,
}) {
  const [tipo, setTipo] = useState('actualizacion_estado');
  const [enEstatus, setEnEstatus] = useState(true);
  const [porCorreo, setPorCorreo] = useState(false);
  const [adicional, setAdicional] = useState('');
  const [vistaPreviaTexto, setVistaPreviaTexto] = useState('');
  const [cargandoPrevia, setCargandoPrevia] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setTipo('actualizacion_estado');
    setEnEstatus(true);
    setPorCorreo(Boolean(orden?.cliente?.email));
    setAdicional('');
    setError(null);
  }, [isOpen, orden]);

  // Obtener la vista previa real directamente del servidor (/api/ordenes/:id/avisos/vista-previa)
  useEffect(() => {
    if (!isOpen || !orden?.id) return;
    let cancelado = false;
    setCargandoPrevia(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ tipo });
      if (adicional.trim()) params.set('adicional', adicional.trim());
      apiRequest(`/api/ordenes/${orden.id}/avisos/vista-previa?${params.toString()}`)
        .then((res) => {
          if (!cancelado && res.vista_previa?.mensaje) {
            setVistaPreviaTexto(res.vista_previa.mensaje);
          }
        })
        .catch(() => {
          if (!cancelado) setVistaPreviaTexto('');
        })
        .finally(() => {
          if (!cancelado) setCargandoPrevia(false);
        });
    }, 150);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [isOpen, orden?.id, tipo, adicional]);

  if (!isOpen || !orden) return null;

  const cliente = orden.cliente || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!enEstatus && !porCorreo) {
      setError('Debes seleccionar al menos un canal de notificación (QR o Correo).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSend({
        tipo,
        en_estatus: enEstatus,
        por_correo: porCorreo,
        adicional: adicional.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al enviar el aviso al cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060F1F]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-[#0A0D12]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2452BF] flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Notificar al cliente</h2>
              <p className="text-xs text-slate-500 font-mono">
                {cliente.nombre_completo || 'Cliente'} · {orden.folio}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Tipo de aviso *</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2452BF] focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 bg-white transition-all"
            >
              <option value="actualizacion_estado">Cambio de estado</option>
              <option value="requiere_autorizacion">Requiere autorización</option>
              <option value="listo_para_recoger">Equipo listo para entrega</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Dónde lo verá el cliente</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={enEstatus}
                  onChange={(e) => setEnEstatus(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2452BF] focus:ring-blue-500 border-slate-300"
                />
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">Página de estatus (QR)</span>
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border border-slate-200 transition-all ${
                  cliente.email ? 'hover:bg-slate-50 cursor-pointer' : 'bg-slate-50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    disabled={!cliente.email}
                    checked={porCorreo && Boolean(cliente.email)}
                    onChange={(e) => setPorCorreo(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2452BF] focus:ring-blue-500 border-slate-300"
                  />
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-800">Correo electrónico</span>
                  </div>
                </div>
                {cliente.email ? (
                  <span className="text-[11px] font-mono text-slate-500">{cliente.email}</span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Sin correo registrado</span>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Mensaje adicional (opcional)</label>
            <input
              type="text"
              value={adicional}
              onChange={(e) => setAdicional(e.target.value)}
              placeholder="Nota adicional para el cliente..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2452BF] focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-700">Así lo verá el cliente</label>
            <div className="p-3.5 rounded-xl border border-blue-100 bg-[#F8FAFD] space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#2452BF]">
                <Bell className="w-3.5 h-3.5" />
                <span>Aviso del taller</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {cargandoPrevia && !vistaPreviaTexto ? 'Generando vista previa...' : vistaPreviaTexto}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">Quedará registrado en Notificaciones</span>
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
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Enviando...' : 'Enviar aviso'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
