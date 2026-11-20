import { justificacionesApi } from '../api/justificaciones.api'
// Justificaciones de inasistencia. Backend: /api/justificacion

const idDe = (x) => (x && typeof x === 'object' ? x._id : x)

export const aJustificacion = (j) => ({
  id: j._id,
  asistenciaId: idDe(j.asistencia),
  atletaId: idDe(j.atleta ?? j.asistencia?.usuario),
  nivelId: idDe(j.nivel ?? j.asistencia?.nivel),
  fecha: j.fechaAusencia ?? j.asistencia?.fecha ?? '',
  horaInicio: j.horaInicio ?? '',
  horaFin: j.horaFin ?? '',
  motivo: j.motivo,
  archivoNombre: j.archivoNombre ?? '',
  archivoTamano: j.archivoTamano ?? '',
  estado: (j.estado ?? 'Pendiente').toLowerCase(), // pendiente | aprobada | rechazada
  observacion: j.observaciones ?? '',
  fechaRevision: j.fechaRevision ? String(j.fechaRevision).slice(0, 10) : '',
})

// El backend ya filtra según el rol (el atleta solo ve las suyas, el entrenador las de sus niveles)
export async function obtenerJustificaciones() {
  const { data } = await justificacionesApi.list()
  return (data ?? []).map(aJustificacion)
}

// cambios: { estado: 'aprobada' | 'rechazada', observacion }
export async function actualizarJustificacion(id, cambios) {
  const { data } = await justificacionesApi.update(id, {
    estado: cambios.estado === 'aprobada' ? 'Aprobada' : 'Rechazada',
    observaciones: cambios.observacion || undefined,
  })
  return aJustificacion(data)
}

export function contarPorEstado(justificaciones) {
  return {
    pendientes: justificaciones.filter((j) => j.estado === 'pendiente').length,
    aprobadas: justificaciones.filter((j) => j.estado === 'aprobada').length,
    rechazadas: justificaciones.filter((j) => j.estado === 'rechazada').length,
    todas: justificaciones.length,
  }
}
