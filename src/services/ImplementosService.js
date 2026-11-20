import { implementosApi } from '../api/implementos.api'
// Implementos deportivos. Backend: /api/implementos (incluye tallas, stock total y calificación)

// Sin existencias el implemento figura como "No Disponible" automáticamente (aunque el backend lo tenga
// como "Disponible"); en cuanto hay stock vuelve a verse "Disponible", salvo que el admin lo haya inhabilitado.
const estadoDe = (i) => ((i.cantidad ?? 0) <= 0 ? 'No Disponible' : i.estado)

const aImplemento = (i) => ({
  id: i._id,
  codigo: i.codigo ?? i._id,
  nombre: i.nombre,
  tipo: i.categoria,
  genero: i.genero,
  cantidad: i.cantidad ?? 0,
  precio: i.precio,
  estado: estadoDe(i),
  imagen: i.imagen ?? '',
  calificacion: Math.round(i.calificacion ?? 0),
  resenas: i.resenas ?? 0,
  tallas: (i.tallas ?? []).map((t) => ({ grupo: t.grupo, talla: t.talla, stock: t.stock })),
})

// Del formulario al backend (solo los campos que el backend acepta)
const aApi = (d) => {
  const o = {}
  if (d.nombre !== undefined) o.nombre = d.nombre
  if (d.tipo !== undefined) o.categoria = d.tipo
  if (d.estado !== undefined) o.estado = d.estado
  if (d.precio !== undefined) o.precio = Number(d.precio)
  if (d.imagen !== undefined) o.imagen = d.imagen
  if (d.genero !== undefined) o.genero = d.genero
  if (d.tallas !== undefined) o.tallas = d.tallas.map((t) => ({ grupo: t.grupo, talla: String(t.talla), stock: Number(t.stock) }))
  return o
}

export async function getImplementos() {
  const { data } = await implementosApi.list()
  return (data ?? []).map(aImplemento)
}

export async function crearImplemento(datos) {
  const { data } = await implementosApi.create(aApi(datos))
  return aImplemento(data)
}

export async function actualizarImplemento(id, datos) {
  const { data } = await implementosApi.update(id, aApi(datos))
  return aImplemento(data)
}

export async function cambiarEstadoImplemento(implemento, nuevoEstado) {
  return actualizarImplemento(implemento.id, { estado: nuevoEstado })
}
