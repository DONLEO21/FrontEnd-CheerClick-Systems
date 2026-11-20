import { tiposHabilidadApi } from '../api/tipos_habilidad.api'
import { habilidadesApi } from '../api/habilidades.api'
import { nivelesApi } from '../api/niveles.api'
import { usuariosApi } from '../api/usuarios.api'
import { asistenciaApi } from '../api/asistencia.api'
import { rendimientoApi } from '../api/rendimiento.api'
// Rendimiento deportivo (vista del administrador / entrenador).
// Backend: /api/habilidad, /api/tipo-habilidad, /api/rendimiento (…/atleta/:id), /api/usuarios

const sinTildes = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const idDe = (x) => (x && typeof x === 'object' ? x._id : x)
const hoyISO = () => new Date().toISOString().slice(0, 10)

/* ───────── habilidades ───────── */
// TODO(backend): la habilidad del backend tiene { nombre, estado, tipoHabilidad }.
//   La pantalla además muestra un "nivel" (p. ej. "Nivel 1 Youth") que el backend no guarda.
const aHabilidad = (h) => ({
  id: h._id,
  codigo: h.codigo ?? h._id, // HA000 (backend)
  categoria: sinTildes(h.tipoHabilidad?.nombre), // apropiada | avanzada | elite ...
  texto: h.nombre,
  nivel: '',
  estado: h.estado === 'Inactivo' ? 'inhabilitada' : 'activa',
  tipoId: idDe(h.tipoHabilidad),
})

export async function listarTiposHabilidad() {
  const { data } = await tiposHabilidadApi.list()
  return data ?? []
}

export async function listarHabilidades() {
  const [{ data }, tipos] = await Promise.all([habilidadesApi.list(), listarTiposHabilidad()])
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
  const cuerpo = { nombre: form.texto, tipoHabilidad: await idTipo(form.categoria), estado: form.estado === 'inhabilitada' ? 'Inactivo' : 'Activo' }
  if (form.id) await habilidadesApi.update(form.id, cuerpo)
  else await habilidadesApi.create(cuerpo)
}

export const cambiarEstadoHabilidad = (habilidad, estadoApp) =>
  habilidadesApi.update(habilidad.id, { estado: estadoApp === 'inhabilitada' ? 'Inactivo' : 'Activo' })

// TODO(backend): no existe DELETE de habilidades; "eliminar" inhabilita la habilidad.
export const eliminarHabilidad = (habilidad) => cambiarEstadoHabilidad(habilidad, 'inhabilitada')

/* ───────── atletas y progreso ───────── */
export async function listarAtletas() {
  const [niveles, ...paginas] = await Promise.all([nivelesApi.list(), ...[1, 2, 3, 4, 5].map((p) => usuariosApi.listarSolicitudes({ estado: 'Aprobada', page: p }).catch(() => ({ data: [] })))])
  const nombreNivel = Object.fromEntries((niveles.data ?? []).map((n) => [n._id, n.nombre]))
  return paginas.flatMap((p) => p.data ?? []).filter((u) => u.rol === 'Atleta').map((u) => ({
    id: u._id,
    nombre: [u.nombre, u.apellido].filter(Boolean).join(' '),
    // TODO(backend): el usuario no trae la edad (está en su perfil).
    edad: '',
    nivel: nombreNivel[idDe(u.nivel)] ?? '',
    rendimiento: 0,
  }))
}

// Atletas del ENTRENADOR: /usuarios/solicitudes es solo para el administrador, así que los atletas se
// toman de la planilla de asistencia de cada uno de SUS niveles (el backend ya filtra los niveles por rol).
export async function listarAtletasEntrenador() {
  const { data: niveles } = await nivelesApi.list()
  const activos = (niveles ?? []).filter((n) => n.estado !== 'Inactivo')
  const planillas = await Promise.all(activos.map((n) =>
    asistenciaApi.planilla({ nivel: n._id, fecha: hoyISO() }).then((r) => ({ nivel: n, atletas: r.data?.atletas ?? [] })).catch(() => ({ nivel: n, atletas: [] }))))
  return planillas.flatMap(({ nivel, atletas }) => atletas.map(({ usuario: u }) => ({
    id: u._id,
    nombre: [u.nombre, u.apellido].filter(Boolean).join(' '),
    edad: '',
    nivel: nivel.nombre,
    rendimiento: 0,
  })))
}

// Progreso de TODOS los atletas: última calificación por atleta y habilidad
export async function listarProgresoTodos() {
  const { data } = await rendimientoApi.list()
  const ultimo = new Map()
  for (const r of (data ?? []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))) {
    ultimo.set(`${idDe(r.usuario)}-${idDe(r.habilidad)}`, { id: `${idDe(r.usuario)}-${idDe(r.habilidad)}`, atletaId: idDe(r.usuario), habilidadId: idDe(r.habilidad), completado: !!r.calificacion })
  }
  return [...ultimo.values()]
}

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
