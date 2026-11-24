import { metodosPagoApi } from '../api/metodos_pago.api'
import { esMetodoEfectivo, esMetodoPresencial } from '../utils/metodosPago'
// Métodos de pago. Backend: /api/metodo-pago  (modelo: nombre + qr opcional; "Efectivo" nunca lleva QR)

// Cada método: { id, nombre, activo, qr, requiereComprobante }
// Datos para transferir (todos opcionales): llave, numeroTelefono y numeroCuenta, además del QR.
const aMetodo = (m) => ({
  id: m._id,
  codigo: m.codigo ?? '', // MP001 (backend)
  nombre: m.nombre,
  activo: true,
  qr: m.qr ?? '',
  llave: m.llave ?? '',
  numeroTelefono: m.numeroTelefono ?? '',
  numeroCuenta: m.numeroCuenta ?? '',
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
  if (!esMetodoEfectivo(datos.nombre)) {
    if (datos.qr) cuerpo.qr = datos.qr
    for (const c of ['llave', 'numeroTelefono', 'numeroCuenta']) if (String(datos[c] ?? '').trim()) cuerpo[c] = String(datos[c]).trim()
  }
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
    // al editar se envían siempre (vacío = quitar el dato); Efectivo no lleva ninguno
    llave: esMetodoEfectivo(datos.nombre) ? '' : String(datos.llave ?? '').trim(),
    numeroTelefono: esMetodoEfectivo(datos.nombre) ? '' : String(datos.numeroTelefono ?? '').trim(),
    numeroCuenta: esMetodoEfectivo(datos.nombre) ? '' : String(datos.numeroCuenta ?? '').trim(),
    requiereComprobante: !esMetodoEfectivo(datos.nombre) && datos.requiereComprobante !== false,
  }
  const { data } = await metodosPagoApi.update(id, cuerpo)
  return aMetodo(data)
}
