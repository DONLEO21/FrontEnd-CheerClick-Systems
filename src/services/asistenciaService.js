// Asistencia. Backend: /api/asistencia (planilla, dia, listado) y /api/niveles
import { listarNiveles } from './horariosService'
import { asistenciaApi } from '../api/asistencia.api'
import { normalizarEstado } from '../utils/estadoAsistencia'
import { limitesDelMes } from './data'

const ESTADO_API_BASE = { Presente: 'presente', Tarde: 'inpuntual', Inasistencia: 'falta', Justificado: 'justificado' }
const ESTADO_API = Object.fromEntries(Object.entries(ESTADO_API_BASE).map(([k, v]) => [v, k]))
const idDe = (x) => (x && typeof x === 'object' ? x._id : x)
// Misma zona que el backend (America/Bogota); toISOString() usaría UTC y desde las 7 p. m. daría el día siguiente
const hoyISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

// La fecha de un registro se compara SIEMPRE como texto 'AAAA-MM-DD' (nunca con toISOString(), que en UTC puede
// mover el día). Si el backend enviara una fecha con hora, se formatea en America/Bogota.
export const fechaLocalISO = (valor) => {
  if (!valor) return ''
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor)) return valor.slice(0, 10)
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(d)
}

const aRegistro = (a) => ({
  id: a._id,
  atletaId: String(idDe(a.usuario) ?? ''),
  nivelId: String(idDe(a.nivel) ?? ''),
  fecha: fechaLocalISO(a.fecha),
  estado: normalizarEstado(a.tipoNovedad) ?? 'falta',
  motivo: a.justificacion?.motivo ?? '',
})

// El backend ya limita los niveles según el rol (el entrenador solo ve los suyos)
export const obtenerNiveles = () => listarNiveles()

export async function obtenerAtletasPorNivel(nivelId) {
  const { data } = await asistenciaApi.planilla({ nivel: nivelId, fecha: hoyISO() })
  return (data?.atletas ?? []).map(({ usuario: u }) => ({ id: u._id, nombre: u.nombre, apellido: u.apellido, codigo: u.codigo, nivelId }))
}

export async function obtenerRegistrosDia(nivelId, fechaISO) {
  const { data } = await asistenciaApi.list({ nivel: nivelId, fecha: fechaISO })
  return (data ?? []).map(aRegistro)
}

export async function obtenerRegistrosRango(nivelId, fechaInicioISO, fechaFinISO) {
  const { data } = await asistenciaApi.list({ nivel: nivelId, desde: fechaInicioISO, hasta: fechaFinISO })
  return (data ?? []).map(aRegistro)
}

// Registros de TODO el mes (primer a último día), no solo de los días de sesión: el backend no tiene un parámetro
// `mes`, se pide con desde/hasta (GET /asistencia?nivel=&desde=AAAA-MM-01&hasta=AAAA-MM-31).
export function obtenerRegistrosMes(nivelId, anio, mesIndex) {
  const { desde, hasta } = limitesDelMes(anio, mesIndex)
  return obtenerRegistrosRango(nivelId, desde, hasta)
}

// registros: [{ atletaId, estado, motivo }]
// Devuelve { registros, advertencias }. Si la petición responde 2xx la asistencia SE GUARDÓ: leer la respuesta
// nunca debe convertir un guardado correcto en error (por eso el mapeo es tolerante).
export async function guardarAsistenciaDia(nivelId, fechaISO, registros) {
  const cuerpo = await asistenciaApi.guardarDia({
    nivel: nivelId,
    fecha: fechaISO,
    registros: registros.map((r) => ({ usuario: r.atletaId, tipoNovedad: ESTADO_API[r.estado], motivo: r.motivo || undefined })),
  })
  let guardados = []
  try {
    guardados = (Array.isArray(cuerpo?.data) ? cuerpo.data : []).map(aRegistro)
  } catch (e) {
    console.warn('Asistencia guardada, pero no se pudo interpretar la respuesta:', e)
  }
  return { registros: guardados, advertencias: Array.isArray(cuerpo?.advertencias) ? cuerpo.advertencias : [] }
}

// Al APROBAR una justificación, el backend ya deja la asistencia en "Justificado"
// (PATCH /justificacion/:id). No hay nada más que guardar aquí.
export async function marcarAsistenciaComoJustificada() {
  return null
}

/**
 * ÚNICA fuente del modal "Consultar asistencia": atletaId -> { 'AAAA-MM-DD': { estado, motivo } }.
 * Las celdas, el % por atleta, el % general y la barra de resumen se derivan SOLO de este mapa.
 */
export function construirMapaAsistencia(registros) {
  const mapa = {}
  for (const r of registros) {
    if (!r.atletaId || !r.fecha) continue
    ;(mapa[r.atletaId] ??= {})[r.fecha] = { estado: r.estado, motivo: r.motivo }
  }
  return mapa
}

/**
 * Días CONTABLES: fechas de hasta hoy (inclusive) en las que se tomó asistencia a alguien de la lista. Un día de sesión
 * sin ninguna lista tomada no cuenta (no es una falta de todos); los días futuros son neutros.
 */
export function diasContables(mapa, atletaIds, hoyISO) {
  const fechas = new Set()
  for (const id of atletaIds) for (const f of Object.keys(mapa[String(id)] ?? {})) if (f <= hoyISO) fechas.add(f)
  return fechas
}

/**
 * % de asistencia de un atleta = (presentes + impuntuales) / sus registros en los días contables.
 * Justificado y falta cuentan como no asistencia. Sin registros contables devuelve null (se muestra "—", no 0 %).
 */
export function porcentajeDeAtleta(mapaAtleta = {}, contables) {
  let total = 0
  let asistio = 0
  for (const f of contables) {
    const r = mapaAtleta[f]
    if (!r) continue
    total += 1
    if (r.estado === 'presente' || r.estado === 'inpuntual') asistio += 1
  }
  return total ? Math.round((asistio * 100) / total) : null
}

/** Resumen del mes con la MISMA fórmula (todos los atletas de la lista, solo días contables). */
export function resumirMes(mapa, atletaIds, hoyISO) {
  const contables = diasContables(mapa, atletaIds, hoyISO)
  const r = { presentes: 0, inpuntuales: 0, faltas: 0, justificadas: 0, total: 0, porcentaje: null }
  for (const id of atletaIds) {
    for (const f of contables) {
      const reg = mapa[String(id)]?.[f]
      if (!reg) continue
      r.total += 1
      if (reg.estado === 'presente') r.presentes += 1
      else if (reg.estado === 'inpuntual') r.inpuntuales += 1
      else if (reg.estado === 'justificado') r.justificadas += 1
      else r.faltas += 1
    }
  }
  r.porcentaje = r.total ? Math.round(((r.presentes + r.inpuntuales) * 100) / r.total) : null
  return r
}

export { aRegistro }
