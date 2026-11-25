/**
 * @file TallerSidebar.jsx
 * @description Menú lateral de navegación compartido para el panel interno del taller InfoFIX.
 * @author Yahúm Adair Hernández Martínez
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  ClipboardList,
  Plus,
  Users,
  Smartphone,
  FileCheck,
  LogOut,
  Wrench,
} from 'lucide-react';

/**
 * Genera hasta dos iniciales en mayúsculas a partir del nombre o correo del técnico.
 *
 * @param {string} [nombreCompleto] Nombre completo del usuario autenticado.
 * @param {string} [correo] Correo electrónico de respaldo si no hay nombre.
 * @returns {string} Iniciales de 2 caracteres (por defecto 'IF').
 */
function obtenerIniciales(nombreCompleto, correo) {
  if (nombreCompleto) {
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return partes[0].substring(0, 2).toUpperCase();
  }
  if (correo) {
    return correo.substring(0, 2).toUpperCase();
  }
  return 'IF';
}

/**
 * Barra lateral fija del panel interno con accesos a módulos del taller y cierre de sesión.
 *
 * @param {Object} props Propiedades del componente.
 * @param {number|null} [props.ordenesActivas=null] Contador opcional de órdenes activas para mostrar en el badge.
 * @returns {JSX.Element} Componente sidebar de navegación.
 */
export default function TallerSidebar({ ordenesActivas = null }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuTaller = [
    { label: 'Inicio', icon: Home, path: '/dashboard' },
    {
      label: 'Órdenes',
      icon: ClipboardList,
      path: '/ordenes',
      badge: ordenesActivas > 0 ? ordenesActivas : null,
    },
    { label: 'Nueva orden', icon: Plus, path: '/ordenes/nueva' },
  ];

  const menuRegistros = [
    { label: 'Clientes', icon: Users, path: '/clientes' },
    { label: 'Dispositivos', icon: Smartphone, path: '/dispositivos' },
    { label: 'Certificados', icon: FileCheck, path: '/certificados' },
  ];

  /**
   * Determina si un enlace del menú corresponde a la ruta actual del navegador.
   *
   * @param {string} path Ruta configurada en el elemento del menú.
   * @returns {boolean} True si la opción debe resaltarse como activa.
   */
  const esRutaActiva = (path) => {
    // Mantiene resaltado "Órdenes" al consultar el detalle /ordenes/:id, sin chocar con /ordenes/nueva
    if (path === '/ordenes') {
      return (
        location.pathname === '/ordenes' ||
        (location.pathname.startsWith('/ordenes/') && location.pathname !== '/ordenes/nueva')
      );
    }
    return location.pathname === path;
  };

  /**
   * Limpia la sesión JWT del técnico y redirige a la pantalla de acceso (RF-01).
   *
   * @returns {void}
   */
  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-full lg:w-64 bg-[#0D1B3E] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
      <div>
        {/* Cabecera InfoFIX */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-[#24529F] flex items-center justify-center text-white shadow-sm">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight">InfoFIX</span>
          </div>
        </div>

        {/* Grupos de navegación */}
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
              TALLER
            </p>
            {menuTaller.map((item) => {
              const Icon = item.icon;
              const activo = esRutaActiva(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activo
                      ? 'bg-[#24529F] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white/15 text-white text-[10px] font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
              REGISTROS
            </p>
            {menuRegistros.map((item) => {
              const Icon = item.icon;
              const activo = esRutaActiva(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    activo
                      ? 'bg-[#24529F] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Perfil del técnico y cierre de sesión */}
      <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-[#24529F] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
            {obtenerIniciales(user?.nombre, user?.email)}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate" title={user?.nombre || user?.email}>
              {user?.nombre || user?.email || '—'}
            </p>
            <p className="text-[10px] text-slate-400 truncate" title={user?.email}>
              {user?.email || 'Personal del taller'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCerrarSesion}
          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}