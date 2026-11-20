// Rendimiento del atleta autenticado (habilidades, asistencia y justificaciones).
// Backend: /api/rendimiento/atleta/:id, /api/habilidad, /api/asistencia, /api/justificacion, /api/niveles
import { almacenSesion } from '../api/client'
import { obtenerNivel } from './horariosService'
import { listarHabilidades, listarProgresoAtleta } from './rendimientoAdminService'
import { aRegistro } from './asistenciaService'
import { aJustificacion } from './justificacionesService'
import { cargarMiPerfil } from './perfil'
import { calcularEdad } from '../utils/fechaNacimiento'
import { asistenciaApi } from '../api/asistencia.api'
import { justificacionesApi } from '../api/justificaciones.api'

export async function obtenerDatosRendimiento(atletaId) {
  const usuario = almacenSesion.usuario()
  const nivelId = usuario?.nivel ?? null

  const [habilidades, progreso, asistencias, justificaciones, nivel, miPerfil] = await Promise.all([
    listarHabilidades(),
    listarProgresoAtleta(atletaId),
    asistenciaApi.list({ usuario: atletaId }).then((r) => (r.data ?? []).map(aRegistro)),
    justificacionesApi.list().then((r) => (r.data ?? []).map(aJustificacion)),
    nivelId ? obtenerNivel(nivelId).catch(() => null) : Promise.resolve(null),
    cargarMiPerfil().catch(() => null),
  ])

  return {
    atleta: {
      id: atletaId,
      nombre: usuario?.nombre ?? '',
      apellido: usuario?.apellido ?? '',
      nivel: nivel?.categoria ?? '',
      // la edad sale de la fecha de nacimiento del perfil (null si aún no la ha registrado)
      edad: calcularEdad(String(miPerfil?.perfil?.fechaNacimiento ?? '').slice(0, 10)),
    },
    nivel: nivel ?? { id: null, categoria: '', entrenador: '', horarios: [] },
    habilidades: habilidades.filter((h) => h.estado === 'activa'),
    progreso,
    // TODO(backend): las notas del entrenador no se pueden consultar (no hay endpoint de lectura).
    notas: [],
    asistencias,
    justificaciones,
  }
}

// El atleta justifica una inasistencia ya registrada en esa fecha.
// TODO(backend): POST /justificacion no recibe el archivo adjunto (solo asistencia y motivo).
export async function enviarJustificacion({ atleta, fechaISO, motivo }) {
  const { data: registros } = await asistenciaApi.list({ usuario: atleta.id, fecha: fechaISO })
  const asistencia = (registros ?? [])[0]
  if (!asistencia) throw new Error('No hay una inasistencia registrada para esa fecha.')
  const { data } = await justificacionesApi.create({ asistencia: asistencia._id, motivo: motivo.trim() })
  return aJustificacion(data)
}
