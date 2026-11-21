import { metodosPagoApi } from '../api/metodos_pago.api'
import { esMetodoEfectivo, esMetodoPresencial } from '../utils/metodosPago'
// Métodos de pago. Backend: /api/metodo-pago  (modelo: nombre + qr opcional; "Efectivo" nunca lleva QR)

// Cada método: { id, nombre, activo, qr, requiereComprobante }
// TODO(backend): titular y llave/cuenta del método aún no existen en el modelo.
const aMetodo = (m) => ({
  id: m._id,
  nombre: m.nombre,
  activo: true,
  titular: '',
  llave: '',
  qr: m.qr ?? '',
  requiereComprobante: m.requiereComprobante ?? !esMetodoEfectivo(m.nombre),
})

export async function getMetodosPago() {
  const { data } = await metodosPagoApi.list()
  // El antiguo "Pago presencial" ya no es un método (se reemplazó por Efectivo)
  return (data ?? []).filter((m) => !esMetodoPresencial(m.nombre)).map(aMetodo)
}

// Crear / editar / eliminar (solo administrador). `qr` es opcional y se omite para Efectivo.
export async function crearMetodoPago(datos) {
  const cuerpo = { nombre: datos.nombre, requiereComprobante: !esMetodoEfectivo(datos.nombre) && datos.requiereComprobante !== false }
  if (datos.qr && !esMetodoEfectivo(datos.nombre)) cuerpo.qr = datos.qr
  const { data } = await metodosPagoApi.create(cuerpo)
  return aMetodo(data)
}

export async function eliminarMetodoPago(id) {
  await metodosPagoApi.remove(id)
}

export async function actualizarMetodoPago(id, datos) {
  const cuerpo = {
    nombre: datos.nombre,
    qr: esMetodoEfectivo(datos.nombre) ? '' : (datos.qr ?? ''),
    requiereComprobante: !esMetodoEfectivo(datos.nombre) && datos.requiereComprobante !== false,
  }
  const { data } = await metodosPagoApi.update(id, cuerpo)
  return aMetodo(data)
}
