// Alias histórico: las "solicitudes de productos" son los mismos pedidos (/api/solicitud).
import { getPedidos, crearPedido, cancelarPedido, marcarRecibido as recibido, aprobarPedido, rechazarPedido } from './PedidosService'
import { solicitudesApi } from '../api/solicitudes.api'

export const getSolicitudes = getPedidos
export const crearSolicitud = crearPedido
export const cancelarSolicitud = cancelarPedido
export const marcarRecibido = recibido
export const aprobarSolicitud = aprobarPedido
export const rechazarSolicitud = rechazarPedido

// TODO(backend): las solicitudes solo cambian de condición (Cancelado, Aprobado, Rechazado, Entregado).
export async function actualizarSolicitud(id, datos) {
  const { data } = await solicitudesApi.update(id, datos)
  return data
}
