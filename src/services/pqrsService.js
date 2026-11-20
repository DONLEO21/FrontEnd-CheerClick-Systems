import { pqrsApi } from '../api/pqrs.api'
import { respuestasPqrsApi } from '../api/respuestas_pqrs.api'
// PQRS. Backend: /api/pqrs y /api/respuesta_pqrs

const TIPO_API = { peticion: 'Petición', queja: 'Queja', reclamo: 'Reclamo', sugerencia: 'Sugerencia' }
const TIPO_APP = Object.fromEntries(Object.entries(TIPO_API).map(([k, v]) => [v, k]))
const ETAPA_API = { pendiente: 'Pendiente', tramite: 'En tramite', resuelto: 'Resuelta' }
const ETAPA_APP = Object.fromEntries(Object.entries(ETAPA_API).map(([k, v]) => [v, k]))
const PRIORIDAD_API = { baja: 'Baja', media: 'Media', alta: 'Alta' }

const fechaISO = (f) => (f ? String(f).slice(0, 10) : '')

function aPqrs(p, respuestas = []) {
  const mias = respuestas.filter((r) => (r.pqrs && typeof r.pqrs === 'object' ? r.pqrs._id : r.pqrs) === p._id)
  const ultima = mias.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))[0]
  return {
    id: p._id,
    radicado: p.radicado ?? `PQ${String(p.numero).padStart(4, '0')}`,
    tipo: TIPO_APP[p.tipo] ?? '',
    asunto: p.asunto,
    descripcion: p.descripcion,
    estado: ETAPA_APP[p.etapa] ?? 'pendiente',
    prioridad: (p.prioridad ?? 'Media').toLowerCase(),
    fecha: fechaISO(p.fechaCreacion),
    remitente: p.usuario ? [p.usuario.nombre, p.usuario.apellido].filter(Boolean).join(' ') : '',
    respuesta: ultima?.respuesta ?? '',
    fechaRespuesta: fechaISO(ultima?.fechaCreacion),
    evidencia: p.evidencia ?? '',
    // TODO(backend): no existe "seguimientos" (información adicional del atleta).
    seguimientos: [],
    inhabilitada: p.estado === 'Inactivo',
  }
}

export async function listarPqrs() {
  const [{ data }, resp] = await Promise.all([pqrsApi.list(), respuestasPqrsApi.list()])
  return (data ?? []).map((p) => aPqrs(p, resp.data ?? []))
}

export async function crearPqrs({ tipo, asunto, descripcion, evidencia }) {
  const { data } = await pqrsApi.create({ tipo: TIPO_API[tipo], asunto, descripcion, evidencia: evidencia || undefined })
  return aPqrs({ ...data, usuario: null })
}

// El administrador responde y deja la PQRS en "En trámite" o "Resuelto"
export async function responderPqrs(id, { respuesta, estado }) {
  await respuestasPqrsApi.create({ pqrs: id, respuesta, etapa: ETAPA_API[estado] === 'Resuelta' ? 'Resuelta' : 'En tramite' })
  const todas = await listarPqrs()
  return todas.find((p) => p.id === id)
}

// TODO(backend): PATCH /pqrs/:id solo acepta estado (Activo/Inactivo), etapa y prioridad.
//   El tipo, asunto y descripción no se pueden modificar.
export async function modificarPqrs(id, { estado, prioridad }) {
  const cuerpo = {}
  if (estado) cuerpo.etapa = ETAPA_API[estado]
  if (prioridad) cuerpo.prioridad = PRIORIDAD_API[prioridad]
  await pqrsApi.update(id, cuerpo)
  const todas = await listarPqrs()
  return todas.find((p) => p.id === id)
}

export async function alternarPqrs(solicitud) {
  await pqrsApi.update(solicitud.id, { estado: solicitud.inhabilitada ? 'Activo' : 'Inactivo' })
  const todas = await listarPqrs()
  return todas.find((p) => p.id === solicitud.id) ?? { ...solicitud, inhabilitada: !solicitud.inhabilitada }
}

export const sinSoporteBackend = (accion) =>
  Promise.reject(new Error(`${accion} aún no está disponible en el servidor.`))
