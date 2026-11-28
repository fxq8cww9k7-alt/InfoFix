/**
 * @file notificacionesUtils.js
 * @description Utilidades de formato, agrupación cronológica y metadatos visuales para notificaciones (P5).
 */

export const TITULOS_TIPO = {
  orden_detenida: 'Orden detenida',
  garantia_por_vencer: 'Garantía por vencer',
  correo_no_entregado: 'Correo no entregado',
  aviso_enviado: 'Aviso enviado al cliente',
  certificado_emitido: 'Certificado emitido',
};

export function obtenerTituloNotificacion(n) {
  if (n.tipo === 'orden_detenida' && n.mensaje) {
    const match = n.mensaje.match(/en la etapa (.+)$/i);
    if (match?.[1]) return `Orden detenida en ${match[1]}`;
  }
  return TITULOS_TIPO[n.tipo] || 'Aviso del taller';
}

export function formatearTiempoNotificacion(fechaStr, ahoraMs) {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr);
  const diffMs = Math.max(0, ahoraMs - fecha.getTime());
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);

  const hoy = new Date(ahoraMs);
  const ayer = new Date(ahoraMs);
  ayer.setDate(ayer.getDate() - 1);

  const esHoy = fecha.toDateString() === hoy.toDateString();
  const esAyer = fecha.toDateString() === ayer.toDateString();
  const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  if (esHoy) {
    if (diffMin < 1) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    return `Hace ${diffHoras} h`;
  }
  if (esAyer) {
    return `Ayer, ${hora}`;
  }
  return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

export function agruparNotificacionesPorFecha(lista, ahoraMs) {
  const hoy = new Date(ahoraMs);
  const ayer = new Date(ahoraMs);
  ayer.setDate(ayer.getDate() - 1);
  const inicioSemanaMs = ahoraMs - 7 * 24 * 60 * 60 * 1000;

  const grupos = [
    { key: 'HOY', titulo: 'HOY', items: [] },
    { key: 'AYER', titulo: 'AYER', items: [] },
    { key: 'ESTA_SEMANA', titulo: 'ESTA SEMANA', items: [] },
    { key: 'ANTERIORES', titulo: 'ANTERIORES', items: [] },
  ];

  for (const n of lista) {
    const fecha = new Date(n.fecha);
    if (fecha.toDateString() === hoy.toDateString()) {
      grupos[0].items.push(n);
    } else if (fecha.toDateString() === ayer.toDateString()) {
      grupos[1].items.push(n);
    } else if (fecha.getTime() >= inicioSemanaMs) {
      grupos[2].items.push(n);
    } else {
      grupos[3].items.push(n);
    }
  }

  return grupos.filter((g) => g.items.length > 0);
}
