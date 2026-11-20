import { notificacionesApi } from '../api/notificaciones.api'
// Notificaciones del usuario autenticado. Backend: /api/notificaciones

const aNotificacion = (n) => ({
  id: n._id,
  tipo: n.tipo, // seguridad | perfil | cuenta
  mensaje: n.mensaje,
  leida: !!n.leida,
  fecha: n.createdAt,
})

export async function listarNotificaciones() {
  const r = await notificacionesApi.list()
  return { items: (r.data ?? []).map(aNotificacion), sinLeer: r.sinLeer ?? 0 }
}

export const marcarNotificacionLeida = (id) => notificacionesApi.marcarLeida(id)
export const marcarTodasLeidas = () => notificacionesApi.marcarTodasLeidas()
