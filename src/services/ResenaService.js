// Reseñas. Backend: /api/resena (una reseña por pedido entregado)
import { getImplementos } from './ImplementosService'
import { resenasApi } from '../api/resenas.api'

export async function getResenas() {
  const [{ data }, implementos] = await Promise.all([resenasApi.list(), getImplementos().catch(() => [])])
  const idPorNombre = Object.fromEntries(implementos.map((i) => [i.nombre, i.id]))
  // una reseña del backend puede cubrir varios implementos: se muestra una por cada uno
  return (data ?? []).flatMap((r) =>
    (r.implementos?.length ? r.implementos : ['']).map((nombre) => ({
      id: `${r._id}-${nombre}`,
      implementoId: idPorNombre[nombre] ?? null,
      implementoNombre: nombre,
      atleta: r.atleta ?? '',
      calificacion: Number(r.estrella) || 0,
      comentario: r.comentario ?? '',
      fecha: String(r.createdAt ?? '').slice(0, 10),
    }))
  )
}

// datos: { pedidoId, calificacion, comentario }
export async function crearResena(datos) {
  const { data } = await resenasApi.create({ solicitud: datos.pedidoId, estrella: datos.calificacion, comentario: datos.comentario || undefined })
  return data
}
