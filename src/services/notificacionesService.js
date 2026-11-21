import { notificacionesApi } from '../api/notificaciones.api'
// Notificaciones del usuario autenticado. Backend: /api/notificaciones

const aNotificacion = (n) => ({
  id: n._id,
  tipo: n.tipo, // seguridad | perfil | cuenta | pago
  titulo: n.titulo ?? '',
  mensaje: n.mensaje,
  enlace: n.enlace ?? '', // ruta del frontend (p. ej. /atleta/pagos)
  leida: !!n.leida,
  fecha: n.createdAt,
})

export async function listarNotificaciones() {
  const r = await notificacionesApi.list()
  return { items: (r.data ?? []).map(aNotificacion), sinLeer: r.sinLeer ?? 0 }
}

// Solo el contador (liviano): lo consulta el polling de la campanita
export async function contarNotificacionesSinLeer() {
  const r = await notificacionesApi.contar()
  return r.data?.sinLeer ?? 0
}

export const marcarNotificacionLeida = (id) => notificacionesApi.marcarLeida(id)
export const marcarTodasLeidas = () => notificacionesApi.marcarTodasLeidas()
