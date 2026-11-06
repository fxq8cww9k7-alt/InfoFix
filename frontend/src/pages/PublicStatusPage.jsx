import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../api/client';
import {
  Smartphone,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  FileCheck2,
  MapPin,
  Phone,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';

export default function PublicStatusPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    publicApi
      .consultarEstatus(token)
      .then((res) => setData(res.estatus))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
        <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-wider text-slate-400 uppercase">
          Consultando orden de servicio...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Orden no encontrada</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            {error || 'El código QR o enlace no coincide con ninguna orden activa en el sistema.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const { folio, estado, paso, total_pasos, dispositivo, progreso, fotos_recepcion, avisos, taller, url_certificado } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Barra superior de estatus */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-white tracking-wider">InfoFIX</span>
              <span className="block text-[10px] text-slate-400 font-mono">ESTATUS EN VIVO</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">FOLIO</span>
            <div className="font-mono text-xs font-bold text-cyan-400">{folio}</div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Tarjeta del Dispositivo */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-800/80 rounded-xl text-slate-300">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {dispositivo.marca} {dispositivo.modelo}
                </h1>
                <p className="text-xs text-slate-400 capitalize">
                  {dispositivo.tipo} • IMEI: <span className="font-mono text-slate-300">{dispositivo.imei_o_serie}</span>
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {estado}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="mt-6 pt-5 border-t border-slate-800/70">
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
              <span>PROGRESO DE SERVICIO</span>
              <span className="text-cyan-400 font-bold">
                Paso {paso} de {total_pasos}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(paso / total_pasos) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Línea de tiempo de etapas */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-5">
            Línea de Tiempo del Servicio
          </h2>
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {progreso.map((item, idx) => {
              const esActivo = item.estado === estado;
              return (
                <div key={item.estado} className="relative flex items-start gap-4">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                      item.completado
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : esActivo
                        ? 'bg-cyan-500 text-slate-950 animate-pulse shadow-md shadow-cyan-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {item.completado ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          esActivo ? 'text-cyan-300' : item.completado ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {item.estado}
                      </span>
                      {item.fecha && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(item.fecha).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    {item.nota && (
                      <p className="text-xs text-slate-400 mt-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                        {item.nota}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificado si ya está entregado */}
        {url_certificado && (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Certificado Oficial Emitido</h3>
                <p className="text-xs text-slate-400">Garantía legal activa y verificable.</p>
              </div>
            </div>
            <a
              href={url_certificado}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs hover:bg-emerald-400 transition-colors"
            >
              Verificar
            </a>
          </div>
        )}

        {/* Fotos de Recepción (Evidencia) */}
        {fotos_recepcion && fotos_recepcion.length > 0 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Evidencia Fotográfica de Recepción</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fotos_recepcion.map((foto, idx) => (
                <a
                  key={idx}
                  href={`/uploads/${foto}`}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group relative block"
                >
                  <img
                    src={`/uploads/${foto}`}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-300">
                    Foto {idx + 1}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Avisos especiales al cliente */}
        {avisos && avisos.length > 0 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              Comunicaciones del Taller
            </h2>
            <div className="space-y-2">
              {avisos.map((aviso, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs">
                  <p className="text-slate-200">{aviso.mensaje}</p>
                  <span className="block text-[10px] font-mono text-slate-500 mt-1">
                    {new Date(aviso.fecha).toLocaleString('es-MX')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacto del Taller */}
        {taller && (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300">{taller.nombre}</div>
            {taller.direccion && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{taller.direccion}</span>
              </div>
            )}
            {taller.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{taller.telefono}</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
