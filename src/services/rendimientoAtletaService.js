// Rendimiento del atleta autenticado (habilidades, asistencia y justificaciones).
// Backend: /api/rendimiento/atleta/:id, /api/habilidad, /api/asistencia, /api/justificacion, /api/niveles
import { almacenSesion } from '../api/client'
import { obtenerNivel } from './horariosService'
import { listarHabilidades, listarProgresoAtleta } from './rendimientoAdminService'
import { aRegistro } from './asistenciaService'
import { aJustificacion, validarSoporte } from './justificacionesService'
import { leerComoDataURL } from '../utils/archivos'
import { cargarMiPerfil } from './perfil'
import { calcularEdad } from '../utils/fechaNacimiento'
import { asistenciaApi } from '../api/asistencia.api'
import { justificacionesApi } from '../api/justificaciones.api'

export async function obtenerDatosRendimiento(atletaId) {
  const usuario = almacenSesion.usuario()
  const nivelId = usuario?.nivel ?? null

  // El rendimiento (habilidades y progreso) es lo esencial: si falla, falla la vista. La asistencia y las
  // justificaciones se piden por separado: si alguna falla, SOLO su sección lo dice (con "Reintentar") y el resto se ve.
  const [habilidades, progreso, nivel, miPerfil, resAsistencias, resJustificaciones] = await Promise.all([
    listarHabilidades(),
    listarProgresoAtleta(atletaId),
    nivelId ? obtenerNivel(nivelId).catch(() => null) : Promise.resolve(null),
    cargarMiPerfil().catch(() => null),
    asistenciaApi.list({ usuario: atletaId }).then((r) => (r.data ?? []).map(aRegistro)).then((v) => ({ v }), (e) => ({ e })),
    justificacionesApi.list().then((r) => (r.data ?? []).map(aJustificacion)).then((v) => ({ v }), (e) => ({ e })),
  ])
  const asistencias = resAsistencias.v ?? []
  const justificaciones = resJustificaciones.v ?? []

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
    // Mensajes reales del backend por sección (null = cargó bien)
    errores: { asistencia: resAsistencias.e?.message ?? null, justificaciones: resJustificaciones.e?.message ?? null },
  }
}

// El atleta justifica una inasistencia ya registrada en esa fecha. El atleta sale del token (el backend usa la sesión):
// aquí solo se envía la asistencia, el motivo y, si hay, el soporte como { nombre, contenido: data-URL }.
export async function enviarJustificacion({ atleta, fechaISO, motivo, archivo }) {
  const errorArchivo = validarSoporte(archivo)
  if (errorArchivo) throw new Error(errorArchivo)
  const { data: registros } = await asistenciaApi.list({ usuario: atleta.id, fecha: fechaISO })
  const asistencia = (registros ?? [])[0]
  if (!asistencia) throw new Error('No hay una inasistencia registrada para esa fecha.')
  const cuerpo = { asistencia: asistencia._id, motivo: motivo.trim() }
  if (archivo) cuerpo.archivo = { nombre: archivo.name, contenido: await leerComoDataURL(archivo) }   // sin archivo, no se envía el campo
  const { data } = await justificacionesApi.create(cuerpo)
  return aJustificacion(data)
}
