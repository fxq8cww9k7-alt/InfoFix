/**
 * @file DetalleOrdenPage.jsx
 * @description Pantalla de detalle, línea de tiempo, gestión de refacciones y avance de estados de la orden (P10 / T18).
 * @task T18 (RF-04, RF-06, RF-08, RF-09)
 * @author Yahúm Adair Hernández Martínez
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import {
  Wrench,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  PackagePlus,
  AlertCircle,
  FileText,
  Camera,
} from 'lucide-react';

export default function DetalleOrdenPage() {
  const { id } = useParams(); // ID de la orden en la ruta /ordenes/:id
  const { user } = useAuth();

  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // piezas y garantias
  const [nuevaPieza, setNuevaPieza] = useState({ nombre: '', tipo: 'original', numero_serie: '' });
  const [garantiaData, setGarantiaData] = useState({ dias_garantia: 30, terminos_garantia: '' });

  // cargar orden al actualizar el componente
  useEffect(() => {
    cargarDetalleOrden();
  }, [id]);

  const cargarDetalleOrden = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/ordenes/${id}`);
      setOrden(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información de la orden.');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    try {
      setError(null);
      await apiRequest(`/api/ordenes/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado, nota: `Cambio de estado a ${nuevoEstado}` }),
      });
      cargarDetalleOrden();
    } catch (err) {
      setError(err.message || 'Error al cambiar el estado de la orden.');
    }
  };

  const handleAgregarPieza = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await apiRequest(`/api/ordenes/${id}/refacciones`, {
        method: 'POST',
        body: JSON.stringify(nuevaPieza),
      });
      setNuevaPieza({ nombre: '', tipo: 'original', numero_serie: '' });
      cargarDetalleOrden();
    } catch (err) {
      setError(err.message || 'Error al registrar la refacción.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center text-slate-500 font-mono text-xs">
        Cargando expediente de la orden...
      </div>
    );
  }

  if (error && !orden) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
        <p className="text-sm font-bold text-slate-800 mb-1">Ocurrió un problema</p>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-[#0D1B3E] text-white text-xs font-semibold">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B0D12] flex flex-col font-sans">
      {/* Barra superior */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-[#0D1B3E] tracking-tight">
              Expediente: <span className="font-mono text-[#24529F]">{orden?.folio || 'RP-2026-XXXX'}</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono">Estado Actual: <strong>{orden?.estado}</strong></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botones de avance secuencial de estado (CU-04) */}
          {orden?.estado === 'Recibido' && (
            <button
              onClick={() => handleCambiarEstado('Diagnóstico')}
              className="px-4 py-2 rounded-xl bg-[#24529F] hover:bg-[#1d4280] text-white text-xs font-semibold shadow-sm transition-all"
            >
              Pasar a Diagnóstico ➔
            </button>
          )}
          {orden?.estado === 'Diagnóstico' && (
            <button
              onClick={() => handleCambiarEstado('Reparación')}
              className="px-4 py-2 rounded-xl bg-[#24529F] hover:bg-[#1d4280] text-white text-xs font-semibold shadow-sm transition-all"
            >
              Iniciar Reparación ➔
            </button>
          )}
          {orden?.estado === 'Reparación' && (
            <button
              onClick={() => handleCambiarEstado('Pruebas')}
              className="px-4 py-2 rounded-xl bg-[#24529F] hover:bg-[#1d4280] text-white text-xs font-semibold shadow-sm transition-all"
            >
              Enviar a Pruebas ➔
            </button>
          )}
          {orden?.estado === 'Pruebas' && (
            <button
              onClick={() => handleCambiarEstado('Entregado')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Finalizar y Entregar Equipo ✓
            </button>
          )}
        </div>
      </header>

      {/* Contenido principal del expediente */}
      <main className="p-6 lg:p-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Información General y Dispositivo */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-sm text-[#0B0D12] border-b border-slate-100 pb-3">
              Información del Servicio y Dispositivo
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-mono block uppercase">Cliente</span>
                <strong className="text-slate-800 text-sm">{orden?.cliente?.nombre_completo || 'Cargando...'}</strong>
                <p className="text-slate-500">{orden?.cliente?.telefono}</p>
              </div>
              <div>
                <span className="text-slate-400 font-mono block uppercase">Dispositivo</span>
                <strong className="text-slate-800 text-sm">{orden?.dispositivo?.marca} {orden?.dispositivo?.modelo}</strong>
                <p className="text-slate-500 font-mono text-[11px]">IMEI/SN: {orden?.dispositivo?.imei_o_serie}</p>
              </div>
              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-mono block uppercase mb-1">Falla Reportada</span>
                <p className="text-slate-700">{orden?.falla_reportada}</p>
              </div>
              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-mono block uppercase mb-1">Condición Estética Inicial</span>
                <p className="text-slate-700">{orden?.condicion_fisica}</p>
              </div>
            </div>
          </section>

          {/* Sección de Refacciones / Piezas (RF-08) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-sm text-[#0B0D12] border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Piezas o Refacciones Sustituidas</span>
              <span className="text-[10px] font-mono bg-blue-50 text-[#24529F] px-2 py-0.5 rounded-md">RF-08</span>
            </h2>

            {/* Formulario rápido para agregar pieza */}
            <form onSubmit={handleAgregarPieza} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <input
                type="text"
                placeholder="Nombre de pieza (Ej. Pantalla OLED)"
                required
                value={nuevaPieza.nombre}
                onChange={(e) => setNuevaPieza({ ...nuevaPieza, nombre: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
              />
              <select
                value={nuevaPieza.tipo}
                onChange={(e) => setNuevaPieza({ ...nuevaPieza, tipo: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#24529F]"
              >
                <option value="original">Original</option>
                <option value="compatible">Compatible</option>
                <option value="reacondicionada">Reacondicionada</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#0D1B3E] hover:bg-[#12284A] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <PackagePlus className="w-4 h-4" /> Agregar Pieza
              </button>
            </form>

            {/* Listado de refacciones registradas */}
            <div className="space-y-2">
              {orden?.refacciones?.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2 text-center">No se han registrado refacciones en esta orden.</p>
              ) : (
                orden?.refacciones?.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{ref.nombre}</span>
                      <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-[#24529F] text-[10px] font-mono uppercase">{ref.tipo}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Columna Derecha: Historial y Línea de Tiempo */}
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-sm text-[#0B0D12] border-b border-slate-100 pb-3">
              Línea de Tiempo (RF-06)
            </h2>
            <div className="space-y-3">
              {orden?.historial?.map((h, index) => (
                <div key={index} className="flex items-start gap-3 text-xs border-l-2 border-[#24529F] pl-3 py-1">
                  <div>
                    <span className="font-bold text-slate-800 block">{h.estado}</span>
                    <p className="text-slate-600 mt-0.5">{h.nota}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">{new Date(h.fecha).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}