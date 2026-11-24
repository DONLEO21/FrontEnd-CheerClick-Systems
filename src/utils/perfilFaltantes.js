// Perfil obligatorio: UN solo archivo con las etiquetas, el total requerido por rol y dónde está cada campo en el formulario.
// La lista de lo que falta la calcula el BACKEND (`camposFaltantes`, helpers/perfilCompleto.helpers.js) y llega en el login y en
// «renovar-token»; aquí solo se normaliza para mostrarla.

export const ETIQUETA_CAMPO_PERFIL = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  numDocumento: 'Número de documento',
  fechaNacimiento: 'Fecha de nacimiento',
  genero: 'Género',
  telefono: 'Teléfono',
  eps: 'EPS',
  certificadoEps: 'Certificado de EPS',
  contactoEmergencia: 'Contacto de emergencia',
};

// Cuántos datos exige el backend por rol (supuesto del frontend; pendiente por backend: devolver `camposRequeridos`)
const TOTAL_BASE = 6 // nombre, apellido, documento, fecha de nacimiento, género y teléfono
const TOTAL_ATLETA = TOTAL_BASE + 3 // + EPS, certificado de EPS y contacto de emergencia
export const totalCamposPerfil = (rol) => (rol === 'atleta' ? TOTAL_ATLETA : TOTAL_BASE)

/** Pasos de la bienvenida según el rol (lenguaje de la persona, no nombres de campos). */
export const pasosDePerfil = (rol) => (rol === 'atleta'
  ? ['Tus datos personales', 'Tu certificado de EPS', 'Tu contacto de emergencia']
  : ['Tus datos personales', 'Tu documento y fecha de nacimiento', 'Un contacto de emergencia'])

/** [{ campo, etiqueta }] de lo que falta, desde el usuario guardado en la sesión. */
export function camposFaltantesPerfil(usuario) {
  const lista = Array.isArray(usuario?.camposFaltantes) ? usuario.camposFaltantes : []
  return lista
    .map((f) => ({ campo: f.campo, etiqueta: f.etiqueta || ETIQUETA_CAMPO_PERFIL[f.campo] || f.campo }))
    .filter((f) => f.campo)
}

/** { total, completos, porcentaje } (0–100) a partir de lo que falta. */
export function progresoPerfil(usuario) {
  const total = totalCamposPerfil(usuario?.rol)
  const faltan = Math.min(camposFaltantesPerfil(usuario).length, total)
  const completos = usuario?.perfilCompleto === false ? total - faltan : total
  return { total, completos, porcentaje: Math.round((completos / total) * 100) }
}

/** Texto compacto de una lista: las primeras `max` etiquetas y «+N más». */
export function resumirFaltantes(faltantes, max = 5) {
  return { visibles: faltantes.slice(0, max), extra: Math.max(0, faltantes.length - max) }
}

/** Elemento del formulario de Perfil de cada campo (para el scroll y el foco desde los chips del banner). */
export function elementoDeCampoPerfil(campo) {
  const porId = {
    nombre: 'perfil-nombre', apellido: 'perfil-apellido', numDocumento: 'numero-doc', fechaNacimiento: 'fecha-nacimiento',
    genero: 'genero', telefono: 'telefono-personal', eps: 'eps-nombre',
  }[campo]
  if (porId) return document.getElementById(porId)
  return document.querySelector(`[data-campo-perfil="${campo}"]`)
}

/** Lleva el scroll suave hasta el campo y le da el foco (si se puede enfocar). */
export function irACampoPerfil(campo) {
  const el = elementoDeCampoPerfil(campo)
  if (!el) return false
  el.scrollIntoView({ block: 'center', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  const enfocable = el.matches?.('input,select,textarea,button,a') ? el : el.querySelector?.('input:not([hidden]),select,textarea,button,label,a')
  if (enfocable) { if (!enfocable.hasAttribute('tabindex') && enfocable.tagName === 'LABEL') enfocable.setAttribute('tabindex', '-1'); enfocable.focus({ preventScroll: true }) }
  return true
}

/** ¿Este dato sigue vacío en el formulario (`vista` = borrador de Perfil)? Para marcar los campos y bloquear el guardado. */
export function campoPerfilVacio(campo, vista) {
  switch (campo) {
    case 'nombre': return !vista.nombre?.trim()
    case 'apellido': return !vista.apellido?.trim()
    case 'numDocumento': return !String(vista.numeroDocumento ?? '').trim()
    case 'fechaNacimiento': return !vista.fechaNacimiento
    case 'genero': return !vista.genero
    case 'telefono': return !vista.telefono?.trim()
    case 'eps': return !vista.eps
    case 'certificadoEps': return !vista.certificadoEpsNombre && !vista.certificadoEpsPath && !vista.certificadoEpsArchivo
    case 'contactoEmergencia': return !vista.contactos?.[0]?.nombre?.trim() || !vista.contactos?.[0]?.telefono?.trim()
    default: return false
  }
}
