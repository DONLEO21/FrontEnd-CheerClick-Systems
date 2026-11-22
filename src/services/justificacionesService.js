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
  // El backend ya pobla el atleta y el nivel (asistencia.usuario / asistencia.nivel): no hace falta otra petición
  atletaNombre: [j.atleta?.nombre ?? j.asistencia?.usuario?.nombre, j.atleta?.apellido ?? j.asistencia?.usuario?.apellido].filter(Boolean).join(' '),
  nivelNombre: (j.nivel ?? j.asistencia?.nivel)?.nombre ?? '',
  codigo: j.codigo ?? '',
  motivo: j.motivo,
  archivoRuta: j.archivo ?? '',
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

// Abre el soporte adjunto en una pestaña nueva (PDF/imagen) o lo descarga (DOC/DOCX). El archivo es privado: se pide con la
// sesión y se muestra desde una URL temporal del navegador. La pestaña se abre al instante (antes de la respuesta) para que
// el navegador no la bloquee como ventana emergente.
export async function abrirSoporte(id, nombre = 'soporte') {
  const pestana = window.open('', '_blank')
  try {
    const blob = await justificacionesApi.archivo(id)
    const url = URL.createObjectURL(blob)
    const verEnNavegador = /pdf|image\//.test(blob.type)
    if (verEnNavegador && pestana) {
      pestana.location.href = url
    } else {
      pestana?.close()
      const a = document.createElement('a')
      a.href = url
      a.download = nombre
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(url), 120_000)
  } catch (e) {
    pestana?.close()
    throw e
  }
}

// Soporte adjunto: JSON { archivo: { nombre, contenido: data-URL } } (así lo recibe POST /justificacion).
const EXTENSIONES_SOPORTE = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
export const TAMANO_MAX_SOPORTE = 5 * 1024 * 1024
export const ACEPTA_SOPORTE = EXTENSIONES_SOPORTE.map((e) => `.${e}`).join(',')

/** Devuelve el mensaje de error si el archivo no sirve como soporte, o '' si es válido. */
export function validarSoporte(archivo) {
  if (!archivo) return ''
  const ext = archivo.name.split('.').pop().toLowerCase()
  if (!EXTENSIONES_SOPORTE.includes(ext)) return 'Formato no permitido. Usa PDF, JPG, PNG, DOC o DOCX.'
  if (archivo.size > TAMANO_MAX_SOPORTE) return 'El archivo no puede superar los 5 MB.'
  if (archivo.size === 0) return 'El archivo está vacío.'
  return ''
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
