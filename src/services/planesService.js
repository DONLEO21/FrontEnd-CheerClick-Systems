import { planesApi } from '../api/planes.api'
// Planes asociados (mensualidad que paga cada atleta). Backend: /api/plan-asociado (GET, POST, PATCH; no hay DELETE)

// { id, nombre, descripcion, valor, estado: 'Activo' | 'Inactivo' }
// TODO(backend): el modelo planAsociado no tiene `descripcion` (ver docs/backend-planes/LEEME.md); mientras
//   no exista, la descripción no se guarda y se muestra vacía.
const aPlan = (p) => ({
  id: p._id,
  nombre: p.nombre,
  descripcion: p.descripcion ?? '',
  valor: p.valor ?? 0,
  estado: p.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
})

export async function listarPlanes() {
  const { data } = await planesApi.list()
  return (data ?? []).map(aPlan)
}

export async function crearPlan({ nombre, descripcion, valor }) {
  const { data } = await planesApi.create({ nombre, descripcion: descripcion || undefined, valor: Number(valor), estado: 'Activo' })
  return aPlan(data)
}

export async function actualizarPlan(id, { nombre, descripcion, valor, estado }) {
  const cuerpo = {}
  if (nombre !== undefined) cuerpo.nombre = nombre
  if (descripcion !== undefined) cuerpo.descripcion = descripcion
  if (valor !== undefined) cuerpo.valor = Number(valor)
  if (estado !== undefined) cuerpo.estado = estado
  const { data } = await planesApi.update(id, cuerpo)
  return aPlan(data)
}
