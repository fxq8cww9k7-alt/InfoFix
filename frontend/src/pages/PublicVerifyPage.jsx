import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../api/client';
import {
  ShieldCheck,
  AlertCircle,
  Smartphone,
  CheckCircle,
  Calendar,
  Layers,
  Award,
  Clock,
  Printer,
} from 'lucide-react';

export default function PublicVerifyPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    publicApi
      .verificarCertificado(token)
      .then((res) => setData(res.certificado))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
        <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-wider text-slate-400 uppercase">
          Verificando autenticidad del certificado...
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
          <h2 className="text-lg font-bold text-white mb-2">Certificado no válido</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            {error || 'El identificador no corresponde a ningún certificado oficial emitido.'}
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

  const { folio, token: certToken, fecha_emision, dispositivo, fecha_recepcion, fecha_entrega, falla_reportada, refacciones, garantia, evidencias } = data;
  const garantiaVigente = garantia?.vigente;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 print:bg-white print:text-black print:pb-0">
      {/* Barra superior con botón de imprimir */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-white tracking-wider">InfoFIX</span>
              <span className="block text-[10px] text-slate-400 font-mono">CERTIFICADO DIGITAL</span>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Cabecera del Certificado */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden print:border-black print:bg-none print:shadow-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 print:border-black">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                CERTIFICADO AUTÉNTICO VERIFICADO
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white print:text-black">
                Garantía y Trazabilidad de Servicio
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1 print:text-gray-600">
                Folio Oficial: <span className="text-emerald-400 font-bold">{folio}</span>
              </p>
            </div>

            <div className="text-left sm:text-right font-mono">
              <span className="text-[10px] text-slate-500 block uppercase">EMITIDO EL</span>
              <span className="text-xs text-slate-300 font-semibold print:text-black">
                {new Date(fecha_emision).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Estado de la Garantía */}
          <div className="mt-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between print:border-gray-300">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500">ESTATUS DE GARANTÍA LEGAL</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    garantiaVigente ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    garantiaVigente ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {garantiaVigente ? 'GARANTÍA VIGENTE' : 'GARANTÍA VENCIDA'}
                </span>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <span>{garantia?.dias} días de cobertura</span>
              <span className="block text-[10px] text-slate-500">
                Vence: {new Date(garantia?.fecha_fin).toLocaleDateString('es-MX')}
              </span>
            </div>
          </div>

          {/* Datos del Equipo */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                DISPOSITIVO CERTIFICADO
              </span>
              <div className="text-sm font-bold text-white print:text-black">
                {dispositivo.marca} {dispositivo.modelo}
              </div>
              <div className="text-xs text-slate-400 capitalize mt-0.5">
                {dispositivo.tipo} • IMEI/Serie: <span className="font-mono text-slate-300">{dispositivo.imei_o_serie}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                FALLA REPORTADA EN RECEPCIÓN
              </span>
              <p className="text-xs text-slate-300 leading-relaxed print:text-black">
                {falla_reportada}
              </p>
            </div>
          </div>

          {/* Refacciones Utilizadas */}
          {refacciones && refacciones.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Refacciones y Componentes Sustituidos (RF-07)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {refacciones.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex justify-between items-center"
                  >
                    <span className="font-medium text-slate-200 print:text-black">{ref.nombre}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 capitalize">
                      {ref.tipo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Términos de Garantía */}
          {garantia?.terminos && (
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-400 mb-2">
                Términos y Condiciones de la Garantía
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 print:text-black">
                {garantia.terminos}
              </p>
            </div>
          )}

          {/* Identificador Criptográfico / UUID */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-mono text-slate-500">
            <span>Sello digital UUID: {certToken}</span>
            <span>NOM-174-SCFI-2007 • InfoFIX CUCEI</span>
          </div>
        </div>
      </main>
    </div>
  );
}
