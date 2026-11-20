import { nivelesApi } from '../api/niveles.api'
import { plantillaHorarioApi } from '../api/plantilla_horario.api'
import { usuariosApi } from '../api/usuarios.api'
import { competenciasApi } from '../api/competencias.api'
import { horariosApi } from '../api/horarios.api'
// Niveles, plantillas de horario, sesiones (horarios) y competencias.
// Backend: /api/niveles, /api/plantilla_horario, /api/horarios, /api/competencias.
// Todas las funciones devuelven los datos con la forma que ya usan las pantallas de Horarios.

/* ───────── días ───────── */
const DIAS_API = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo' }
const DIAS_APP = Object.fromEntries(Object.entries(DIAS_API).map(([k, v]) => [v, k]))
const ORDEN = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']

const idDe = (x) => (x && typeof x === 'object' ? x._id : x)
const fechaISO = (f) => (f ? String(f).slice(0, 10) : '')
const nombreCompleto = (u) => (u ? [u.nombre, u.apellido].filter(Boolean).join(' ') : '')

/* ───────── NIVELES (+ plantillas de horario) ───────── */
// Agrupa las plantillas de un nivel por franja: [{ dias: ['mar','jue'], inicio, fin }]
function bloquesDe(plantillas) {
  const mapa = new Map()
  for (const p of plantillas) {
    const clave = `${p.horaInicio}-${p.horaFin}`
    if (!mapa.has(clave)) mapa.set(clave, { dias: [], inicio: p.horaInicio, fin: p.horaFin })
    mapa.get(clave).dias.push(DIAS_APP[p.dia])
  }
  return [...mapa.values()].map((b) => ({ ...b, dias: ORDEN.filter((d) => b.dias.includes(d)) }))
}

const nivelDesdeApi = (n, plantillas = []) => ({
  id: n._id,
  categoria: n.nombre,
  entrenador: nombreCompleto(n.usuario),
  entrenadorId: idDe(n.usuario) ?? null,
  foto: n.imagenEntre ?? '',
  horarios: bloquesDe(plantillas),
  inhabilitado: n.estado === 'Inactivo',
})

export async function listarNiveles() {
  const [{ data: niveles }, { data: plantillas }] = await Promise.all([
    nivelesApi.list(),
    plantillaHorarioApi.list(),
  ])
  return (niveles ?? []).map((n) => nivelDesdeApi(n, (plantillas ?? []).filter((p) => idDe(p.nivel) === n._id)))
}

export async function obtenerNivel(id) {
  const [{ data: n }, { data: plantillas }] = await Promise.all([
    nivelesApi.getById(id),
    plantillaHorarioApi.list({ nivel: id }),
  ])
  return nivelDesdeApi(n, plantillas ?? [])
}

// El formulario de nivel pide el nombre del entrenador; el backend necesita su id.
export async function buscarEntrenadorPorNombre(nombre) {
  const buscado = nombre.trim().toLowerCase()
  for (let pagina = 1; pagina < 50; pagina += 1) {
    const r = await usuariosApi.listarSolicitudes({ estado: 'Aprobada', page: pagina })
    const hallado = (r.data ?? []).find((u) => u.rol === 'Entrenador' && nombreCompleto(u).toLowerCase() === buscado)
    if (hallado) return hallado._id
    if (pagina * 10 >= (r.total ?? 0)) break
  }
  return null
}

// Sustituye las plantillas del nivel por las del formulario
async function sincronizarPlantillas(nivelId, bloques) {
  const { data: actuales } = await plantillaHorarioApi.list({ nivel: nivelId })
  await Promise.all((actuales ?? []).map((p) => plantillaHorarioApi.remove(p._id)))
  for (const b of bloques) {
    for (const dia of b.dias) {
      await plantillaHorarioApi.create({ dia: DIAS_API[dia], horaInicio: b.inicio, horaFin: b.fin, nivel: nivelId })
    }
  }
}

export async function guardarNivel({ id, categoria, entrenador, foto, horarios }) {
  const usuario = await buscarEntrenadorPorNombre(entrenador)
  if (!usuario) throw new Error(`No existe un entrenador llamado "${entrenador}". Escribe su nombre y apellido tal como está registrado.`)

  const dias = new Set(horarios.flatMap((b) => b.dias)).size
  const cuerpo = { nombre: categoria, diasEntreno: dias, usuario, ...(foto ? { imagenEntre: foto } : {}) }
  const { data } = id ? await nivelesApi.update(id, cuerpo) : await nivelesApi.create(cuerpo)
  await sincronizarPlantillas(data._id, horarios)
  return obtenerNivel(data._id)
}

export async function alternarNivel(nivel) {
  await nivelesApi.update(nivel.id, { estado: nivel.inhabilitado ? 'Activo' : 'Inactivo' })
  return obtenerNivel(nivel.id)
}

/* ───────── COMPETENCIAS (torneos) ───────── */
const torneoDesdeApi = (c) => ({
  id: c._id,
  clave: 'personalizada',
  nombre: c.nombre,
  fecha: fechaISO(c.fechaCompetencia),
  ciudad: c.lugar ?? '',
  costo: c.precioinscripcion ?? 0,
  limite: fechaISO(c.fechalimite),
  etiquetaLimite: 'Límite de pago',
  nivel: idDe(c.nivel),
  nivelNombre: c.nivel?.nombre ?? '',
  imagen: c.Imagen ?? '',
  link: c.link ?? '',
  activa: c.estado === 'Activo',
  inhabilitada: c.estado === 'Inactivo',
})

export async function listarCompetencias(nivelId) {
  const { data } = await competenciasApi.list({ nivel: nivelId })
  return (data ?? []).map(torneoDesdeApi)
}

const torneoAApi = (t) => ({
  nombre: t.nombre,
  fechaCompetencia: t.fecha,
  lugar: t.ciudad,
  precioinscripcion: Number(t.costo),
  fechalimite: t.limite || undefined,
  Imagen: t.imagen || undefined,
  link: t.link || undefined,
  nivel: t.nivel,
})

export async function guardarCompetencia(datos, id) {
  const { data } = id ? await competenciasApi.update(id, torneoAApi(datos)) : await competenciasApi.create(torneoAApi(datos))
  return torneoDesdeApi(data)
}

export async function alternarCompetencia(torneo) {
  const { data } = await competenciasApi.update(torneo.id, { estado: torneo.inhabilitada ? 'Activo' : 'Inactivo' })
  return torneoDesdeApi({ ...data, nivel: torneo.nivelNombre ? { _id: torneo.nivel, nombre: torneo.nivelNombre } : data.nivel })
}

/* ───────── SESIONES de entrenamiento (backend: /horarios) ───────── */
// TODO(backend): el backend no guarda "asistencia marcada" ni varios tipos por sesión.
//   Los tipos se guardan unidos por coma en el campo "tipo"; "asistenciaMarcada" solo vive en pantalla.
const sesionDesdeApi = (h) => ({
  id: h._id,
  nivelId: idDe(h.nivel),
  fecha: fechaISO(h.fecha),
  horaInicio: h.franjaInicio,
  horaFin: h.franjaFin,
  enfoque: h.enfoque ?? '',
  lugar: h.lugar ?? '',
  notas: h.notasIndicaciones ?? '',
  estado: (h.estado ?? 'Activa').toLowerCase(),
  tipos: (h.tipo ?? '').split(',').map((t) => t.trim()).filter((t) => t && t !== 'Entrenamiento'),
  asistenciaMarcada: false,
})

const capital = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

function sesionAApi(c) {
  const o = {}
  if ('nivelId' in c) o.nivel = c.nivelId
  if ('fecha' in c) o.fecha = c.fecha
  if ('horaInicio' in c) o.franjaInicio = c.horaInicio
  if ('horaFin' in c) o.franjaFin = c.horaFin
  if ('enfoque' in c) o.enfoque = c.enfoque
  if ('lugar' in c) o.lugar = c.lugar
  if ('notas' in c) o.notasIndicaciones = c.notas
  if ('estado' in c) o.estado = capital(c.estado)
  if ('tipos' in c) o.tipo = c.tipos.length ? c.tipos.join(', ') : 'Entrenamiento'
  return o
}

export async function listarSesiones(nivelId) {
  const { data } = await horariosApi.list({ nivel: nivelId })
  return (data ?? []).map(sesionDesdeApi)
}

// Crea la sesión (completa) o modifica solo los campos recibidos
export async function guardarSesion(sesionExistente, cambios, base) {
  const { asistenciaMarcada, ...resto } = cambios
  let h
  if (sesionExistente) {
    ;({ data: h } = await horariosApi.update(sesionExistente.id, sesionAApi(resto)))
  } else {
    const completa = { ...base, ...resto }
    ;({ data: h } = await horariosApi.create({ tipo: 'Entrenamiento', ...sesionAApi(completa), enfoque: completa.enfoque || 'Entrenamiento' }))
  }
  const s = sesionDesdeApi(h)
  s.asistenciaMarcada = asistenciaMarcada ?? sesionExistente?.asistenciaMarcada ?? false
  return s
}

/* ───────── sesiones para el atleta ───────── */
const CATEGORIAS = ['partner', 'gimnasia', 'baile', 'campeonato']
const catDe = (tipo) => {
  const t = (tipo ?? '').toLowerCase()
  return CATEGORIAS.find((c) => t.includes(c)) ?? 'gimnasia'
}
const duracionDe = (ini, fin) => {
  const m = (x) => { const [h, mm] = x.split(':').map(Number); return h * 60 + mm }
  return `${(m(fin) - m(ini)) / 60}h`
}

// TODO(backend): no existen cupos (cuposUsados / cuposTotal) por sesión.
export async function listarSesionesAtleta(nivelId, entrenador) {
  const { data } = await horariosApi.list({ nivel: nivelId })
  return (data ?? []).filter((h) => h.estado === 'Activa').map((h) => ({
    id: h._id,
    fecha: fechaISO(h.fecha),
    nivelId: idDe(h.nivel),
    cat: catDe(h.tipo),
    horaInicio: h.franjaInicio,
    horaFin: h.franjaFin,
    duracion: duracionDe(h.franjaInicio, h.franjaFin),
    entrenador,
    enfoque: h.enfoque ?? '',
    indicaciones: (h.notasIndicaciones ?? '').split('\n').map((x) => x.trim()).filter(Boolean),
    torneoId: null,
  }))
}
