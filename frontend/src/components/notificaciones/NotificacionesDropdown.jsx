/**
 * @file NotificacionesDropdown.jsx
 * @description Campana de notificaciones con panel desplegable rápido (P5 Dropdown).
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, ShieldAlert, Mail, Send, FileText } from 'lucide-react';
import { apiRequest } from '../../api/client';
import {
  obtenerTituloNotificacion,
  formatearTiempoNotificacion,
} from './notificacionesUtils';

function IconoNotificacion({ tipo }) {
  if (tipo === 'orden_detenida') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#FBF1DE] text-[#B7791F] flex items-center justify-center shrink-0">
        <Clock className="w-4 h-4" />
      </div>
    );
  }
  if (tipo === 'garantia_por_vencer') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#FBE7E8] text-[#C2363B] flex items-center justify-center shrink-0">
        <ShieldAlert className="w-4 h-4" />
      </div>
    );
  }
  if (tipo === 'correo_no_entregado') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#FBE7E8] text-[#C2363B] flex items-center justify-center shrink-0">
        <Mail className="w-4 h-4" />
      </div>
    );
  }
  if (tipo === 'aviso_enviado') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#E1ECF8] text-[#2452BF] flex items-center justify-center shrink-0">
        <Send className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
      <FileText className="w-4 h-4" />
    </div>
  );
}

export default function NotificacionesDropdown() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState('todas'); // 'todas' | 'no_leidas'
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelado = false;

    async function cargarInicial() {
      try {
        const data = await apiRequest('/api/notificaciones');
        if (cancelado) return;
        setNotificaciones(data.notificaciones || []);
        setNoLeidas(data.no_leidas ?? 0);
        setAhoraMs(Date.now());
      } catch {
        // Silencioso en cabecera
      }
    }

    void cargarInicial();
    const intervalo = setInterval(() => {
      void cargarInicial();
    }, 30000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recargar = async () => {
    try {
      const data = await apiRequest('/api/notificaciones');
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas ?? 0);
      setAhoraMs(Date.now());
    } catch {
      // Silencioso
    }
  };

  const toggleAbierto = () => {
    const proximo = !abierto;
    setAbierto(proximo);
    if (proximo) {
      void recargar();
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      const data = await apiRequest('/api/notificaciones/leer', { method: 'POST', body: {} });
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas ?? 0);
    } catch {
      // Silencioso
    }
  };

  const handleClickItem = async (n) => {
    if (!n.leida) {
      try {
        const data = await apiRequest('/api/notificaciones/leer', {
          method: 'POST',
          body: { ids: [n.id] },
        });
        setNotificaciones(data.notificaciones || []);
        setNoLeidas(data.no_leidas ?? 0);
      } catch {
        // Continuar navegación aunque falle el marcado
      }
    }
    setAbierto(false);
    if (n.orden_id) {
      navigate(`/ordenes/${n.orden_id}`);
    } else {
      navigate('/notificaciones');
    }
  };

  const listaVisible = (
    tab === 'no_leidas' ? notificaciones.filter((n) => !n.leida) : notificaciones
  ).slice(0, 6);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleAbierto}
        className={`p-2 rounded-xl border transition-colors relative ${
          abierto
            ? 'border-[#2452BF] bg-[#E1ECF8]/50 text-[#12204A]'
            : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
        }`}
        title="Notificaciones del taller"
        aria-label="Notificaciones del taller"
      >
        <Bell className="w-4 h-4" />
        {noLeidas > 0 ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2452BF] ring-2 ring-white" />
        ) : null}
      </button>

      {abierto ? (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 overflow-hidden">
          {/* Cabecera del dropdown */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0B0D12]">Notificaciones</h3>
                {noLeidas > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E1ECF8] text-[#2452BF] text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {noLeidas} {noLeidas === 1 ? 'nueva' : 'nuevas'}
                  </span>
                ) : null}
              </div>

              {noLeidas > 0 ? (
                <button
                  type="button"
                  onClick={marcarTodasLeidas}
                  className="text-[11px] font-semibold text-[#12204A] hover:text-[#2452BF] transition-colors"
                >
                  Marcar como leídas
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTab('todas')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  tab === 'todas'
                    ? 'bg-[#0D1B3E] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setTab('no_leidas')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  tab === 'no_leidas'
                    ? 'bg-[#0D1B3E] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                No leídas
              </button>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {listaVisible.length === 0 ? (
              <div className="py-10 px-6 text-center text-xs text-slate-400">
                {tab === 'no_leidas'
                  ? 'No tienes notificaciones sin leer.'
                  : 'Aún no hay notificaciones registradas.'}
              </div>
            ) : (
              listaVisible.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClickItem(n)}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors hover:bg-slate-50 ${
                    !n.leida ? 'bg-[#F4F8FE]' : 'bg-white'
                  }`}
                >
                  <IconoNotificacion tipo={n.tipo} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-[#0B0D12] leading-snug">
                        {obtenerTituloNotificacion(n)}
                      </p>
                      {!n.leida ? (
                        <span className="w-2 h-2 rounded-full bg-[#2452BF] shrink-0 mt-1" />
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                      {n.mensaje}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatearTiempoNotificacion(n.fecha, ahoraMs)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Pie */}
          <div className="border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                navigate('/notificaciones');
              }}
              className="w-full py-3 text-center text-xs font-bold text-[#12204A] hover:text-[#2452BF] hover:bg-slate-100/70 transition-colors"
            >
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
