/**
 * @file ImprimiblePage.jsx
 * @description Vista imprimible en formato Media Carta (148mm x 215mm) para la Nota de Servicio (P12)
 *              y el Certificado Oficial de Reparación y Garantía (P13), con código QR.
 * @task T22 (RF-04, RF-10, RF-11)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { ArrowLeft, Printer, ShieldCheck, ExternalLink, FileText } from 'lucide-react';

/**
 * Extrae una fuente de imagen válida para el código QR desde la respuesta del backend.
 *
 * @param {Object|string|null|undefined} qrData Objeto o cadena con el QR o URL.
 * @returns {string|null} URL o data URI de imagen lista para <img>, o null si no viene.
 */
function extraerSrcQr(qrData) {
  if (!qrData) return null;
  if (typeof qrData === 'string') {
    return qrData.startsWith('data:image') || qrData.startsWith('http') || qrData.startsWith('/')
      ? qrData
      : null;
  }
  return (
    qrData.qr ||
    qrData.qr_data_url ||
    qrData.dataUrl ||
    qrData.imagen ||
    qrData.src ||
    null
  );
}

/**
 * Vista imprimible compartida para Nota de Servicio (P12) y Certificado Final (P13).
 *
 * @param {Object} props Propiedades del componente.
 * @param {'nota'|'certificado'} [props.modo='certificado'] Tipo de documento a renderizar.
 * @returns {JSX.Element} Hoja Media Carta optimizada para impresión (@media print).
 */
export default function ImprimiblePage({ modo = 'certificado' }) {
  const { id, token } = useParams();
  const esNota = modo === 'nota' || Boolean(id);

  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarDocumento() {
      try {
        setLoading(true);
        setError(null);

        if (esNota) {
          const res = await apiRequest(`/api/ordenes/${id}/nota-servicio`);
          if (!cancelado) setDatos({ tipoDoc: 'nota', ...res });
        } else {
          const res = await apiRequest(`/api/certificados/${token}`);
          if (!cancelado) {
            const payload = res.certificado || res.orden || res;
            setDatos({ tipoDoc: 'certificado', ...payload, certificadoMeta: res.certificado });
          }
        }
      } catch (err) {
        if (!cancelado) {
          setError(
            err.message ||
              (esNota
                ? 'No se pudo cargar la nota de servicio.'
                : 'No se pudo cargar el certificado digital.'),
          );
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    cargarDocumento();
    return () => {
      cancelado = true;
    };
  }, [esNota, id, token]);

  const handleImprimir = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 font-mono text-xs">
        {esNota ? 'Generando nota de servicio y QR...' : 'Generando certificado digital...'}
      </div>
    );
  }

  if (error || !datos) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-bold text-rose-600 mb-2">Error de validación</p>
        <p className="text-xs text-slate-600 mb-4">{error || 'Documento no encontrado.'}</p>
        <Link
          to="/dashboard"
          className="px-4 py-2 rounded-xl bg-[#0D1B3E] text-white text-xs font-semibold"
        >
          Volver al Sistema
        </Link>
      </div>
    );
  }

  const orden = esNota ? datos.orden : datos.orden || datos;
  const taller = datos.taller || null;
  const certObj = datos.certificadoMeta || datos.certificado || datos;

  const qrSrc = esNota
    ? extraerSrcQr(datos.estatus) || extraerSrcQr(orden?.qr_estatus)
    : extraerSrcQr(certObj?.qr) || extraerSrcQr(datos.qr);

  const urlDestinoQr = esNota
    ? datos.estatus?.url || orden?.url_estatus || ''
    : certObj?.url_publica || certObj?.url || '';

  const identificadorEquipo =
    orden?.dispositivo?.imei_o_serie_enmascarado ||
    orden?.dispositivo?.imei_o_serie ||
    'N/A';

  const accesoriosLista = Array.isArray(orden?.accesorios) ? orden.accesorios : [];
  const refaccionesLista = Array.isArray(orden?.refacciones)
    ? orden.refacciones
    : Array.isArray(datos.refacciones)
      ? datos.refacciones
      : [];

  const diasGarantia = orden?.garantia?.dias ?? orden?.dias_garantia ?? datos.garantia?.dias ?? 0;
  const terminosGarantia =
    orden?.garantia?.terminos ||
    orden?.terminos_garantia ||
    datos.garantia?.terminos ||
    'Válida contra defectos de reparación. Excluye daños por humedad o golpes posteriores.';
  const fechaVencimiento =
    orden?.garantia?.fecha_fin ||
    orden?.garantia?.fin ||
    orden?.garantia?.fecha_vencimiento ||
    orden?.garantia_fin ||
    datos.garantia?.fecha_fin ||
    datos.garantia?.fin ||
    null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4 font-sans print:bg-white print:p-0">
      {/* Barra superior de acciones (oculta al imprimir) */}
      <div className="w-full max-w-[148mm] flex flex-wrap items-center justify-between gap-2 mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </Link>
          {orden?.id && (
            <Link
              to={`/ordenes/${orden.id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Expediente
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={handleImprimir}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D1B3E] text-white text-xs font-semibold shadow-sm hover:bg-[#12284A] transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Guardar PDF (Media Carta)
        </button>
      </div>

      {/* Contenedor principal en formato Media Carta (148mm x 215mm) */}
      <div className="w-full max-w-[148mm] bg-white border border-slate-200 shadow-xl rounded-2xl p-6 print:max-w-none print:w-full print:border-none print:shadow-none print:p-2 text-[#0B0D12] text-xs print:text-[11pt] space-y-4 print:space-y-3">
        {/* Encabezado del Taller */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4 gap-3">
          <div>
            <h1 className="text-base print:text-lg font-extrabold text-[#0D1B3E] tracking-tight">
              {taller?.nombre || 'InfoFIX Taller Técnico'}
            </h1>
            <p className="text-[10px] print:text-xs text-slate-500 font-mono">
              {esNota
                ? 'Nota de Recepción y Seguimiento de Orden'
                : 'Certificado Oficial de Reparación y Garantía'}
            </p>
            {esNota && taller?.direccion && (
              <p className="text-[10px] text-slate-500 mt-0.5">{taller.direccion}</p>
            )}
            {esNota && taller?.telefono && (
              <p className="text-[10px] text-slate-500 font-mono">Tel: {taller.telefono}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Folio de Orden</span>
            <strong className="text-sm font-mono text-[#24529F]">{orden?.folio || '—'}</strong>
          </div>
        </div>

        {/* Cliente (solo en Nota de Servicio P12) + Dispositivo */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 print:bg-transparent print:border-slate-200">
          {esNota && orden?.cliente ? (
            <>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Cliente</span>
                <strong className="text-slate-800 block">{orden.cliente.nombre_completo}</strong>
                <span className="text-[11px] font-mono text-slate-600 block">
                  {orden.cliente.telefono}
                </span>
                {orden.cliente.email && (
                  <span className="text-[10px] text-slate-500 block truncate">
                    {orden.cliente.email}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Dispositivo
                </span>
                <strong className="text-slate-800 block">
                  {orden?.dispositivo?.marca} {orden?.dispositivo?.modelo}
                </strong>
                <p className="text-[11px] font-mono text-slate-600 capitalize">
                  Tipo: {String(orden?.dispositivo?.tipo || '').replace('_', ' ')}
                </p>
                <p className="text-[10px] font-mono text-slate-600">
                  {orden?.dispositivo?.tipo === 'celular' ? 'IMEI' : 'S/N'}: {identificadorEquipo}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Dispositivo
                </span>
                <strong className="text-slate-800 block">
                  {orden?.dispositivo?.marca} {orden?.dispositivo?.modelo}
                </strong>
                <p className="text-[11px] font-mono text-slate-600 capitalize">
                  Tipo: {String(orden?.dispositivo?.tipo || '').replace('_', ' ')}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Identificador (IMEI / Serie)
                </span>
                <strong className="font-mono text-slate-800">{identificadorEquipo}</strong>
              </div>
            </>
          )}
        </div>

        {/* Falla Reportada */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Falla Reportada</span>
          <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 print:border-slate-200">
            {orden?.falla_reportada || '—'}
          </p>
        </div>

        {/* En Nota de Servicio: Condición física y Accesorios */}
        {esNota && (
          <div className="grid grid-cols-1 gap-2">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Condición Física Inicial
              </span>
              <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 print:border-slate-200">
                {orden?.condicion_fisica || '—'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Accesorios Recibidos
              </span>
              <p className="text-slate-800 font-medium">
                {accesoriosLista.length > 0 ? accesoriosLista.join(', ') : 'Ninguno'}
              </p>
            </div>
          </div>
        )}

        {/* En Certificado Final: Piezas Sustituidas y Garantía */}
        {!esNota && (
          <>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                Refacciones / Componentes Instalados
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                    <tr>
                      <th className="p-2">Componente</th>
                      <th className="p-2">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {refaccionesLista.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="p-2 text-center text-slate-400 italic">
                          No se requirió cambio de refacciones.
                        </td>
                      </tr>
                    ) : (
                      refaccionesLista.map((ref, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium text-slate-800">{ref.nombre}</td>
                          <td className="p-2 text-slate-600 uppercase font-mono text-[10px]">
                            {ref.tipo}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4" /> Garantía de {diasGarantia} días naturales
              </div>
              <p className="text-[10px] text-slate-600 leading-tight">{terminosGarantia}</p>
              {fechaVencimiento && (
                <span className="text-[9px] font-mono text-slate-400 block pt-1">
                  Vigencia hasta: {new Date(fechaVencimiento).toLocaleDateString('es-MX')}
                </span>
              )}
            </div>
          </>
        )}

        {/* Bloque inferior con QR real y enlace público */}
        <div className="grid grid-cols-3 gap-3 items-center pt-3 border-t border-slate-200">
          <div className="col-span-2 space-y-1">
            <p className="font-bold text-[#0D1B3E] text-xs">
              {esNota
                ? 'Seguimiento de reparación'
                : 'Verificación de autenticidad y garantía'}
            </p>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              {esNota
                ? 'Escanea el código QR para consultar el avance de tu equipo, fotos de recepción y avisos del taller.'
                : 'Escanea el código QR para validar este certificado y consultar la vigencia de la garantía.'}
            </p>
            {urlDestinoQr && (
              <a
                href={urlDestinoQr}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-mono text-[#24529F] hover:underline break-all print:text-slate-700"
              >
                <span>{urlDestinoQr}</span>
                <ExternalLink className="w-3 h-3 shrink-0 print:hidden" />
              </a>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-xl">
            {qrSrc ? (
              <img src={qrSrc} alt="Código QR" className="w-20 h-20 object-contain" />
            ) : (
              <div className="w-16 h-16 bg-slate-200 flex items-center justify-center text-[9px] font-mono text-slate-500 text-center">
                [Sin QR]
              </div>
            )}
            <span className="text-[8px] font-mono text-slate-500 mt-1 text-center">
              {esNota ? 'Comprueba su estatus o avance' : 'Escanee para verificar'}
            </span>
          </div>
        </div>

        {/* Firmas de conformidad solo en Nota de Servicio */}
        {esNota && (
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-500">
            <div className="border-t border-slate-300 pt-1.5">Firma cliente</div>
            <div className="border-t border-slate-300 pt-1.5">Personal que recibe</div>
          </div>
        )}

        {/* Pie de página */}
        <div className="text-center pt-3 border-t border-slate-100 text-[9px] text-slate-400 font-mono">
          {esNota
            ? `Comprobante de recepción InfoFIX • Folio ${orden?.folio || ''}`
            : `Certificado generado digitalmente por InfoFIX • Emitido el ${
                certObj?.fecha_emision
                  ? new Date(certObj.fecha_emision).toLocaleDateString('es-MX')
                  : 'fecha registrada'
              }`}
        </div>
      </div>

      {/* Reglas CSS para forzar tamaño Media Carta al imprimir */}
      <style>{`
        @media print {
          @page {
            size: 148mm 215mm;
            margin: 8mm;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}