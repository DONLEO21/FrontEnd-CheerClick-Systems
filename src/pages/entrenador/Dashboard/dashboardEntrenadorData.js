import { listarNiveles, listarSesiones } from '../../../services/horariosService'
import { asistenciaApi } from '../../../api/asistencia.api'
import { rendimientoApi } from '../../../api/rendimiento.api'

/* ───────── configuración ───────── */

export const RUTA_PERFIL = '/entrenador/perfil'
export const RUTA_ENTRENAMIENTOS = '/entrenador/horarios'
export const RUTA_INICIO_ENTRENADOR = '/entrenador'

export const MAX_ITEMS = 3 // atletas por página

export const CATEGORIAS = [
  { id: 'apropiada', nombre: 'Apropiada', color: '#a847e0' },
  { id: 'avanzada', nombre: 'Avanzada', color: '#f8df3e' },
  { id: 'elite', nombre: 'Elite', color: '#2f80ed' },
]

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
export const DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

/* ───────── utilidades ───────── */
export const pad = (n) => String(n).padStart(2, '0')
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const hace = (dias) => { const d = new Date(); d.setDate(d.getDate() - dias); return d }
export const dia10 = (f) => String(f).slice(0, 10)
const prom = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null)
// Number(null) daría 0: un porcentaje sin dato debe seguir siendo "sin dato" y no contar como 0 %
const num = (v) => (v === null || v === undefined ? NaN : Number(v))
const notaEval = (e) =>
  prom(CATEGORIAS.map((c) => num(e[c.id])).filter((n) => Number.isFinite(n)))

export const hora12 = (h) => {
  if (!h) return ''
  const [H, M] = String(h).split(':').map(Number)
  return `${H % 12 || 12}:${pad(M)} ${H >= 12 ? 'PM' : 'AM'}`
}


const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
// Porcentaje completado de una categoría de habilidades (apropiada / avanzada / elite) según el resumen del backend
const pctCategoria = (porCategoria = {}, prefijo) => {
  const k = Object.keys(porCategoria).find((n) => sinTildes(n).startsWith(prefijo))
  const c = k ? porCategoria[k] : null
  return c && c.total ? Math.round((c.completadas / c.total) * 100) : null
}

export const BASE_VACIA = { niveles: [], atletas: [], evals: [], asist: [], errores: [] }

/* ───────── acceso a datos (backend) ───────── */
export async function cargarBase() {
  const errores = []
  const seguro = async (fn, vacio = []) => {
    try { return await fn() } catch (e) { errores.push(e.message); return vacio }
  }

  // el backend solo devuelve los niveles del entrenador autenticado
  const nivelesApi = await seguro(() => listarNiveles())
  const niveles = nivelesApi.filter((n) => !n.inhabilitado).map((n) => ({ id: n.id, nombre: n.categoria }))
  if (!niveles.length) return { ...BASE_VACIA, errores }

  const hoyIso = iso(new Date())
  const desde = iso(hace(29))
  const planillas = await Promise.all(niveles.map((n) => seguro(async () => (await asistenciaApi.planilla({ nivel: n.id, fecha: hoyIso })).data?.atletas ?? [])))
  const atletas = planillas.flatMap((lista, i) => lista.map(({ usuario: u }) => ({
    id: u._id, codigo: u.codigo, nombre: [u.nombre, u.apellido].filter(Boolean).join(' '), activo: true, id_nivel: niveles[i].id,
  })))

  const asistLista = await Promise.all(niveles.map((n) => seguro(async () => (await asistenciaApi.list({ nivel: n.id, desde })).data ?? [])))
  const asist = asistLista.flat().map((a) => ({ fecha: a.fecha, presente: a.tipoNovedad === 'Presente' || a.tipoNovedad === 'Tarde' }))

  // Una evaluación por atleta con su avance actual por categoría
  const evals = (await Promise.all(atletas.map((a) => seguro(async () => {
    const pc = (await rendimientoApi.getAtleta(a.id)).data?.resumen?.porCategoria
    return pc ? { fecha: hoyIso, apropiada: pctCategoria(pc, 'apropiad'), avanzada: pctCategoria(pc, 'avanz'), elite: pctCategoria(pc, 'elit') } : null
  }, null)))).filter(Boolean)

  return { niveles, atletas, evals, asist, errores }
}

async function cargarEntrenos(ids, desde, hasta) {
  if (!ids.length) return []
  const listas = await Promise.all(ids.map((id) => listarSesiones(id)))
  return listas.flat()
    .filter((s) => s.estado === 'activa' && s.fecha >= desde && s.fecha <= hasta)
    .map((s) => ({ id: s.id, id_nivel: s.nivelId, titulo: s.enfoque, fecha: s.fecha, hora_inicio: s.horaInicio, hora_fin: s.horaFin }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))
}

export function obtenerEntrenos({ niveles, desde, hasta }) {
  return cargarEntrenos(niveles.map((n) => n.id), desde, hasta)
}

/* ───────── métricas ───────── */
// Sin evaluaciones NUNCA se inventan cifras: los valores quedan en null y la pantalla lo indica.
export function calcularMetricas(evals, asist) {
  const notas = evals.map(notaEval).filter((n) => n !== null)
  const rendimiento = notas.length ? Math.round(prom(notas)) : null

  // 4 semanas, la más antigua primero
  const serie = [0, 1, 2, 3].map((i) => {
    const desde = iso(hace(7 * (4 - i) - 1))
    const hasta = iso(hace(7 * (3 - i)))
    const v = evals
      .filter((e) => dia10(e.fecha) >= desde && dia10(e.fecha) <= hasta)
      .map(notaEval).filter((n) => n !== null)
    return { semana: `Sem ${i + 1}`, valor: v.length ? Math.round(prom(v)) : null }
  })
  const [previa, actual] = [serie[2].valor, serie[3].valor]
  const variacion = previa && actual !== null ? ((actual - previa) / previa) * 100 : null

  const asistencia = asist.length
    ? Math.round((asist.filter((a) => a.presente).length * 100) / asist.length)
    : null

  const equipo = CATEGORIAS.map((c) => {
    const v = evals.map((e) => num(e[c.id])).filter((n) => Number.isFinite(n))
    const valor = v.length ? Math.round(prom(v)) : null
    return { ...c, valor }
  })

  return { rendimiento, serie, variacion, asistencia, equipo }
}
