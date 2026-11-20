// Asistencia. Backend: /api/asistencia (planilla, dia, listado) y /api/niveles
import { listarNiveles } from './horariosService'
import { asistenciaApi } from '../api/asistencia.api'

const ESTADO_APP = { Presente: 'presente', Tarde: 'inpuntual', Inasistencia: 'falta', Justificado: 'justificado' }
const ESTADO_API = Object.fromEntries(Object.entries(ESTADO_APP).map(([k, v]) => [v, k]))
const idDe = (x) => (x && typeof x === 'object' ? x._id : x)
// Misma zona que el backend (America/Bogota); toISOString() usaría UTC y desde las 7 p. m. daría el día siguiente
const hoyISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

const aRegistro = (a) => ({
  id: a._id,
  atletaId: idDe(a.usuario),
  nivelId: idDe(a.nivel),
  fecha: a.fecha,
  estado: ESTADO_APP[a.tipoNovedad] ?? 'falta',
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

export function calcularResumen(registros) {
  return {
    presentes: registros.filter((r) => r.estado === 'presente').length,
    inpuntuales: registros.filter((r) => r.estado === 'inpuntual').length,
    faltas: registros.filter((r) => r.estado === 'falta').length,
    justificadas: registros.filter((r) => r.estado === 'justificado').length,
  }
}

export { aRegistro }
