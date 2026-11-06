import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import {
  Wrench,
  LogOut,
  Bell,
  Search,
  Plus,
  Smartphone,
  CheckCircle2,
  Clock,
  Shield,
  User,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filtroEstado) query.set('estado', filtroEstado);
      if (busqueda && busqueda.length >= 3) query.set('q', busqueda);

      const [resOrdenes, resNotifs] = await Promise.all([
        apiRequest(`/api/ordenes?${query.toString()}`),
        apiRequest('/api/notificaciones'),
      ]);

      setOrdenes(resOrdenes.ordenes || []);
      setResumen(resOrdenes.resumen || null);
      setNotificaciones(resNotifs.notificaciones || []);
      setNoLeidas(resNotifs.no_leidas || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparación', 'Pruebas', 'Entregado'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra de Navegación Superior */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-tight text-white">InfoFIX</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {user?.rol === 'admin' ? 'ADMIN' : 'TÉCNICO'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">PANEL DE OPERACIONES</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Botón Nueva Orden */}
            <Link
              to="/ordenes/nueva"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Orden</span>
            </Link>

            {/* Campana de Notificaciones */}
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 relative transition-colors"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {noLeidas}
                  </span>
                )}
              </button>
            </div>

            {/* Usuario y Logout */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white">{user?.nombre || 'Usuario'}</div>
                <div className="text-[10px] text-slate-400">{user?.email}</div>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        {/* Métricas Rápidas */}
        {resumen && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="text-[10px] font-mono uppercase text-slate-500">Órdenes Activas</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{resumen.activas ?? ordenes.length}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="text-[10px] font-mono uppercase text-slate-500">En Diagnóstico</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{resumen.diagnostico ?? 0}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="text-[10px] font-mono uppercase text-slate-500">En Reparación / Pruebas</div>
              <div className="text-2xl font-bold text-indigo-400 mt-1">{resumen.reparacion ?? 0}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="text-[10px] font-mono uppercase text-slate-500">Entregados este mes</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{resumen.entregadas ?? 0}</div>
            </div>
          </div>
        )}

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
          <form onSubmit={handleBuscar} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar folio, cliente, IMEI..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </form>

          {/* Filtros de Estado */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFiltroEstado('')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                filtroEstado === '' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            {ESTADOS.map((est) => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                  filtroEstado === est ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {est}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Órdenes */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">
              Expedientes de Servicio ({ordenes.length})
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2" />
              Cargando órdenes...
            </div>
          ) : ordenes.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              No se encontraron órdenes registradas con los filtros seleccionados.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {ordenes.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-slate-800/60 rounded-xl text-cyan-400 mt-0.5">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{ord.folio}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                          {ord.estado}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-1">
                        {ord.marca} {ord.modelo}
                        {ord.cliente && <span className="text-slate-500 font-normal"> • Cliente: {ord.cliente}</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        Falla: {ord.falla_reportada}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {ord.token_estatus && (
                      <Link
                        to={`/estatus/${ord.token_estatus}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                        title="Ver estatus público cliente"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Portal QR
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
