/**
 * @file CertificadosPage.jsx
 * @description Listado de certificados digitales emitidos con filtro de vigencia de garantía y accesos a impresión y verificación pública.
 * @task T22 (RF-10, RF-11, RF-12)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import TallerSidebar from '../components/TallerSidebar';
import {
  Search,
  FileCheck,
  Printer,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  X,
} from 'lucide-react';

/**
 * Formatea una fecha ISO en formato corto legible en español.
 *
 * @param {string|null} [fecha] Fecha ISO proveniente del servidor.
 * @returns {string} Fecha legible o guion largo.
 */
function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha)
    .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace('.', '');
}

/**
 * Pantalla del registro de certificados digitales emitidos al entregar equipos (RF-10, RF-12).
 *
 * @returns {JSX.Element} Tabla de certificados con filtros de garantía y acciones de impresión/verificación.
 */
export default function CertificadosPage() {
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroGarantia, setFiltroGarantia] = useState('');
  const [busqueda, setBusqueda] = useState('');

  /**
   * Consulta los certificados emitidos aplicando búsqueda y filtro de vigencia de garantía.
   *
   * @param {string} [terminoOverride] Término opcional para forzar una búsqueda específica.
   * @returns {Promise<void>}
   */
  const cargarCertificados = async (terminoOverride) => {
    try {
      setLoading(true);
      const q = (terminoOverride !== undefined ? terminoOverride : busqueda).trim();
      const params = new URLSearchParams();
      if (filtroGarantia) params.append('garantia', filtroGarantia);
      if (q) params.append('q', q);

      const data = await apiRequest(`/api/certificados?${params.toString()}`);
      setCertificados(data.certificados || []);
    } catch (err) {
      console.error('Error al cargar certificados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCertificados();
  }, [filtroGarantia]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col lg:flex-row font-sans">
      <TallerSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior */}
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-sm sticky top-0 z-20">
          <div className="text-xs font-medium text-slate-500">
            Registros / <span className="text-[#0B0D12] font-semibold">Certificados</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              cargarCertificados();
            }}
            className="relative w-64 sm:w-80"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por folio, cliente, equipo o IMEI"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#24529F] focus:bg-white transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  cargarCertificados('');
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </header>

        <main className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold text-[#0B0D12] tracking-tight">Certificados</h1>
            <p className="text-xs text-slate-500 mt-1">
              Documentos digitales emitidos al concluir reparaciones, con acceso a impresión Media Carta y verificación QR.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Filtros de vigencia de garantía */}
            <div className="flex items-center gap-1.5 flex-wrap pb-3 border-b border-slate-100">
              {[
                { id: '', label: 'Todos' },
                { id: 'vigente', label: 'Garantía vigente' },
                { id: 'vencida', label: 'Garantía vencida' },
              ].map((f) => (
                <button
                  type="button"
                  key={f.id || 'todos'}
                  onClick={() => setFiltroGarantia(f.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    filtroGarantia === f.id
                      ? 'bg-[#0D1B3E] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                Cargando certificados...
              </div>
            ) : certificados.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <FileCheck className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm text-[#0B0D12]">
                  Aún no hay certificados emitidos
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Los certificados se generan automáticamente cuando una orden llega al estado Entregado.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">FOLIO</th>
                      <th className="py-3 px-4 font-semibold">CLIENTE</th>
                      <th className="py-3 px-4 font-semibold">DISPOSITIVO</th>
                      <th className="py-3 px-4 font-semibold">EMISIÓN</th>
                      <th className="py-3 px-4 font-semibold">GARANTÍA</th>
                      <th className="py-3 px-4 font-semibold text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certificados.map((cert) => {
                      const tokenCert = cert.token_uuid || cert.token;
                      const vigente = cert.garantia_estado
                        ? cert.garantia_estado === 'Vigente'
                        : Boolean(cert.garantia?.vigente ?? cert.garantia_vigente);
                      const fechaFin = cert.garantia?.fecha_fin ?? cert.garantia_fin;
                      const marca = cert.dispositivo?.marca ?? cert.marca ?? '';
                      const modelo = cert.dispositivo?.modelo ?? cert.modelo ?? '';
                      const clienteNombre = cert.cliente?.nombre_completo ?? cert.cliente ?? '—';

                      return (
                        <tr key={tokenCert || cert.orden_id || cert.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#0B0D12] whitespace-nowrap">
                            {cert.folio}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                            {clienteNombre}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {`${marca} ${modelo}`.trim() || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatearFecha(cert.fecha_emision || cert.fecha_entrega)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                vigente
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {vigente ? (
                                <ShieldCheck className="w-3 h-3" />
                              ) : (
                                <ShieldAlert className="w-3 h-3" />
                              )}
                              {vigente ? 'Vigente' : 'Vencida'}
                              {fechaFin ? ` · ${formatearFecha(fechaFin)}` : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {tokenCert && (
                                <>
                                  <Link
                                    to={`/certificados/${tokenCert}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
                                    title="Abrir certificado imprimible Media Carta"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    Imprimir
                                  </Link>
                                  <a
                                    href={`/verificar/${tokenCert}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold shadow-sm transition-all"
                                    title="Abrir página pública de verificación"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    QR
                                  </a>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}