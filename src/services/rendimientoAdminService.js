import { tiposHabilidadApi } from '../api/tipos_habilidad.api'
import { habilidadesApi } from '../api/habilidades.api'
import { rendimientoApi } from '../api/rendimiento.api'
// Rendimiento deportivo (vista del administrador / entrenador).
// Backend: /api/habilidad, /api/tipo-habilidad, /api/rendimiento (…/atleta/:id), /api/usuarios

const sinTildes = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const idDe = (x) => (x && typeof x === 'object' ? x._id : x)
// Misma zona que el backend (America/Bogota)
const hoyISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

/* ───────── habilidades ───────── */
// SUPUESTO: la habilidad tiene un `nivel` opcional (null = aplica a todos los niveles). Se agregó al modelo del backend
//   porque antes no existía relación habilidad -> nivel y no se podía filtrar.
const aHabilidad = (h) => ({
  id: h._id,
  codigo: h.codigo ?? '', // HA000 (backend); nunca el _id interno
  categoria: sinTildes(h.tipoHabilidad?.nombre), // apropiada | avanzada | elite ...
  texto: h.nombre,
  nivelId: idDe(h.nivel) ?? '',
  nivel: h.nivel?.nombre ?? '', // '' = todos los niveles
  estado: h.estado === 'Inactivo' ? 'inhabilitada' : 'activa',
  tipoId: idDe(h.tipoHabilidad),
})

export async function listarTiposHabilidad() {
  const { data } = await tiposHabilidadApi.list()
  return data ?? []
}

// nivelId (opcional): solo las de ese nivel + las generales. El backend valida que el entrenador pida solo sus niveles.
export async function listarHabilidades({ nivelId } = {}) {
  const [{ data }, tipos] = await Promise.all([habilidadesApi.list({ nivelId }), listarTiposHabilidad()])
  const porId = Object.fromEntries(tipos.map((t) => [t._id, t]))
  return (data ?? []).map((h) => aHabilidad({ ...h, tipoHabilidad: porId[idDe(h.tipoHabilidad)] ?? h.tipoHabilidad }))
}

async function idTipo(categoria) {
  const tipos = await listarTiposHabilidad()
  const t = tipos.find((x) => sinTildes(x.nombre) === sinTildes(categoria))
  if (!t) throw new Error(`No existe el tipo de habilidad "${categoria}" en el sistema.`)
  return t._id
}

// form: { id?, categoria, texto }
export async function guardarHabilidad(form) {
  const cuerpo = {
    nombre: form.texto,
    tipoHabilidad: await idTipo(form.categoria),
    estado: form.estado === 'inhabilitada' ? 'Inactivo' : 'Activo',
    nivel: form.nivelId || null,
  }
  if (form.id) await habilidadesApi.update(form.id, cuerpo)
  else await habilidadesApi.create(cuerpo)
}

export const cambiarEstadoHabilidad = (habilidad, estadoApp) =>
  habilidadesApi.update(habilidad.id, { estado: estadoApp === 'inhabilitada' ? 'Inactivo' : 'Activo' })

// TODO(backend): no existe DELETE de habilidades; "eliminar" inhabilita la habilidad.
export const eliminarHabilidad = (habilidad) => cambiarEstadoHabilidad(habilidad, 'inhabilitada')

/* ───────── atletas y progreso ───────── */
// Listado de rendimiento: TODOS los atletas, tengan o no rendimiento registrado (GET /rendimiento/resumen).
// El backend filtra por rol: el administrador ve todos; el entrenador, solo los de SUS niveles.
// `rendimiento` es el porcentaje (0-100) o null cuando el atleta aún no tiene ninguna evaluación.
export async function listarAtletas() {
  const { data } = await rendimientoApi.resumen()
  return (data ?? []).map((a) => ({
    id: a._id,
    nombre: [a.nombre, a.apellido].filter(Boolean).join(' '),
    // La edad la calcula el backend (/rendimiento/resumen) desde la fecha de nacimiento del perfil; null = sin fecha
    edad: a.edad ?? '',
    nivel: a.nivel?.nombre ?? '',
    codigo: a.codigo ?? '',
    rendimiento: a.rendimiento ? a.rendimiento.porcentaje : null,
  }))
}

// El entrenador usa el mismo listado: la restricción por nivel la valida el backend (no el frontend).
export const listarAtletasEntrenador = listarAtletas

// Progreso de un atleta (una entrada por habilidad activa)
export async function listarProgresoAtleta(atletaId) {
  const { data } = await rendimientoApi.getAtleta(atletaId)
  return (data?.habilidades ?? []).map((h) => ({ id: `${atletaId}-${h._id}`, atletaId, habilidadId: h._id, completado: !!h.completado }))
}

// TODO(backend): las notas del entrenador se guardan (PUT) pero no hay endpoint para leerlas.
export async function listarNotas() {
  return []
}

// cambios: [{ habilidadId, completado }]. El backend exige que el atleta tenga asistencia registrada ese día.
export async function guardarProgresoAtleta(atletaId, { fecha, cambios = [], nota = '' }) {
  await rendimientoApi.guardarAtleta(atletaId, {
    fecha: fecha || hoyISO(),
    habilidades: cambios.map((c) => ({ habilidad: c.habilidadId, calificacion: !!c.completado })),
    nota: nota || undefined,
  })
}
