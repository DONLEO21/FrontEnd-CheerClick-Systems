import { solicitudesApi } from '../api/solicitudes.api'
// Pedidos de implementos. En el backend se llaman "solicitudes": /api/solicitud (+ sus líneas)

const aPedido = (s) => ({
  id: s._id,
  codigo: s.codigo ?? s._id,
  atleta: s.usuario ? [s.usuario.nombre, s.usuario.apellido].filter(Boolean).join(' ') : '',
  // TODO(backend): la solicitud no incluye el nivel del atleta.
  categoria: '',
  fecha: String(s.fecha ?? '').slice(0, 10),
  items: (s.items ?? []).map((l) => ({
    implementoId: l.implemento?._id ?? l.implemento,
    implementoNombre: l.implemento?.nombre ?? '',
    implementoImagen: l.implemento?.imagen ?? '',
    grupoTalla: l.grupo,
    talla: l.talla,
    cantidad: l.cantidad,
    precioUnitario: l.precioUnitario,
    resenaEnviada: !!s.tieneResena,
  })),
  total: s.total ?? 0,
  // TODO(backend): la solicitud aún no guarda método de pago ni comprobante.
  metodoPagoId: '',
  metodoPago: '',
  llavePago: '',
  comprobante: '',
  estado: s.condicion, // Pendiente | Aprobado | Entregado | Cancelado | Rechazado
  motivoRechazo: s.motivoRechazo ?? '',
  recibido: s.condicion === 'Entregado',
})

export async function getPedidos() {
  const { data } = await solicitudesApi.list()
  return (data ?? []).map(aPedido)
}

export async function getPedido(id) {
  const todos = await getPedidos()
  const p = todos.find((x) => x.id === id)
  if (!p) throw new Error('No se pudo cargar el pedido.')
  return p
}

// Un pedido agrupa todos los productos del carrito
export async function crearPedido(datos) {
  const { data } = await solicitudesApi.create({
    items: datos.items.map((i) => ({ implemento: i.implementoId, grupo: i.grupoTalla, talla: i.talla, cantidad: i.cantidad })),
  })
  return aPedido(data)
}

const cambiar = async (pedido, cuerpo) => {
  const { data } = await solicitudesApi.update(pedido.id, cuerpo)
  return aPedido(data)
}

export const cancelarPedido = (pedido) => cambiar(pedido, { condicion: 'Cancelado' })
export const marcarRecibido = (pedido) => cambiar(pedido, { condicion: 'Entregado' })
export const aprobarPedido = (pedido) => cambiar(pedido, { condicion: 'Aprobado' })
export const rechazarPedido = (pedido, motivo) => cambiar(pedido, { condicion: 'Rechazado', motivoRechazo: motivo })

// El backend marca "reseñado" solo al crear la reseña del pedido: no hay nada más que guardar.
export async function marcarResenaEnviada() {
  return null
}
