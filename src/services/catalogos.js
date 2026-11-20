import { nivelesApi } from '../api/niveles.api'
import { planesApi } from '../api/planes.api'
// Catálogos básicos que usan varias pantallas (niveles y planes del club)

// Devuelven [[id, etiqueta], ...]. Solo incluyen lo que el administrador tiene ACTIVO,
// así que al crear / editar / deshabilitar un nivel o plan las listas se actualizan solas.
const activos = (lista, usarCodigo) =>
  (lista ?? []).filter((x) => x.estado !== 'Inactivo').map((x) => [x._id, x.nombre, usarCodigo ? x.codigo : undefined])

export async function listarNivelesOpciones() {
  const { data } = await nivelesApi.list()
  return activos(data).map(([id, nombre]) => [id, nombre])
}

export async function listarPlanesOpciones() {
  const { data } = await planesApi.list()
  return activos(data).map(([id, nombre]) => [id, nombre])
}

// Para el formulario de REGISTRO (el usuario aún no tiene sesión).
// TODO(backend): GET /niveles/publico y GET /plan-asociado/publico (sin token, solo _id y nombre de los
//   activos). El código listo para pegar está en docs/backend-registro-publico/LEEME.md
export async function listarNivelesPublicos() {
  const { data } = await nivelesApi.listPublico()
  return activos(data).map(([id, nombre]) => [id, nombre])
}

export async function listarPlanesPublicos() {
  const { data } = await planesApi.listPublico()
  return activos(data).map(([id, nombre]) => [id, nombre])
}
