// Lógica pura del formulario «Editar cuenta» (sin React): borrador, validación y cuerpo a enviar.
// Los valores de los selectores son los del BACKEND tal cual (p. ej. 'Cédula de Ciudadanía', 'SURA').
// Las reglas espejan a las del backend (helpers/validacionesUsuario.helpers.js), que es quien manda: cualquier error que
// el servidor devuelva se muestra igual dentro del modal.
import { validarFechaNacimiento } from '../../../utils/fechaNacimiento.js'

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const TELEFONO_REGEX = /^[0-9+\s()-]{7,15}$/
export const DOCUMENTO_REGEX = /^[A-Za-z0-9-]{5,20}$/

const par = (lista) => lista.map((x) => [x, x])
export const OPCIONES_TIPO_DOC = par(['Cédula de Ciudadanía', 'Tarjeta de Identidad', 'Cédula de Extranjeria', 'Registro Civil', 'Pasaporte'])
export const OPCIONES_GENERO = par(['Femenino', 'Masculino', 'Otro'])
export const OPCIONES_EPS = par(['Compensar', 'Coomeva', 'Famisanar', 'Nueva EPS', 'Salud Total', 'Sanitas', 'SURA', 'Otra'])
export const OPCIONES_PARENTESCO = par(['Madre', 'Padre', 'Tutor', 'Cónyuge', 'Otro'])

const CAMPOS_BASICOS = ['nombre', 'apellido', 'email']
const CAMPOS_PERFIL = ['tipoDocumento', 'numDocumento', 'genero', 'generoOtro', 'fechaNacimiento', 'telefono', 'eps', 'epsOtra']
const CAMPOS_CONTACTO = ['nombre', 'apellido', 'telefono', 'parentesco', 'parentescoOtro']

const texto = (v) => (v === null || v === undefined ? '' : String(v))

/** Borrador del formulario a partir del detalle del backend ({ usuario, perfil, contactos }). */
export function borradorDesdeFicha(ficha) {
  const u = ficha?.usuario ?? {}
  const p = ficha?.perfil
  return {
    nombre: texto(u.nombre), apellido: texto(u.apellido), email: texto(u.email),
    tienePerfil: !!p,
    ...Object.fromEntries(CAMPOS_PERFIL.map((c) => [c, c === 'fechaNacimiento' ? texto(p?.[c]).slice(0, 10) : texto(p?.[c])])),
    contactos: (ficha?.contactos ?? []).map((c) => ({
      _id: c._id, principal: !!c.principal,
      ...Object.fromEntries(CAMPOS_CONTACTO.map((k) => [k, texto(c[k])])),
    })),
  }
}

export const hayCambios = (inicial, actual) => JSON.stringify(inicial) !== JSON.stringify(actual)

/**
 * Devuelve { campo: mensaje } (los contactos usan la clave 'contactos.<i>.<campo>', igual que el backend).
 * Valida SOLO lo que el administrador modificó: un dato heredado inválido que no se tocó (fecha de nacimiento de Ronald,
 * teléfono vacío de un contacto antiguo…) no impide guardar otro cambio. `inicial` es el borrador original.
 */
export function validarBorrador(b, rol, inicial) {
  const e = {}
  const cambio = (c) => !inicial || b[c] !== inicial[c]
  if (cambio('nombre') && !b.nombre.trim()) e.nombre = 'El nombre es obligatorio'
  if (cambio('apellido') && !b.apellido.trim()) e.apellido = 'El apellido es obligatorio'
  if (cambio('email')) {
    if (!b.email.trim()) e.email = 'El correo es obligatorio'
    else if (!EMAIL_REGEX.test(b.email.trim())) e.email = 'El correo no es válido'
  }

  if (b.tienePerfil) {
    if (cambio('tipoDocumento') && !b.tipoDocumento) e.tipoDocumento = 'Selecciona el tipo de documento'
    if (cambio('numDocumento') && !DOCUMENTO_REGEX.test(b.numDocumento.trim())) e.numDocumento = 'El número de documento no es válido (5 a 20 letras o números)'
    if (cambio('genero') && !b.genero) e.genero = 'Selecciona el género'
    if ((cambio('genero') || cambio('generoOtro')) && b.genero === 'Otro' && !b.generoOtro.trim()) e.generoOtro = 'Indica el género'
    if (cambio('fechaNacimiento')) {
      if (!b.fechaNacimiento) e.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
      else { const m = validarFechaNacimiento(b.fechaNacimiento, rol); if (m) e.fechaNacimiento = m }
    }
    if (cambio('telefono') && !TELEFONO_REGEX.test(b.telefono.trim())) e.telefono = 'El teléfono no es válido (7 a 15 dígitos)'
    if (cambio('eps') && !b.eps) e.eps = 'Selecciona la EPS'
    if ((cambio('eps') || cambio('epsOtra')) && b.eps === 'Otra' && !b.epsOtra.trim()) e.epsOtra = 'Indica la EPS'
  }
  b.contactos.forEach((c, i) => {
    const ini = inicial?.contactos?.[i]
    const mod = (k) => !ini || c[k] !== ini[k]
    if (mod('nombre') && !c.nombre.trim()) e[`contactos.${i}.nombre`] = 'El nombre del contacto es obligatorio'
    if (mod('apellido') && !c.apellido.trim()) e[`contactos.${i}.apellido`] = 'El apellido del contacto es obligatorio'
    if (mod('telefono') && !TELEFONO_REGEX.test(c.telefono.trim())) e[`contactos.${i}.telefono`] = 'El teléfono del contacto no es válido (7 a 15 dígitos)'
    if ((mod('parentesco') || mod('parentescoOtro')) && c.parentesco === 'Otro' && !c.parentescoOtro.trim()) e[`contactos.${i}.parentescoOtro`] = 'Indica el parentesco'
  })
  return e
}

/** Solo lo que cambió (también por campo dentro de cada contacto): el backend audita y notifica únicamente diferencias reales. */
export function cuerpoDeCambios(inicial, actual) {
  const cuerpo = {}
  for (const c of CAMPOS_BASICOS) if (inicial[c] !== actual[c]) cuerpo[c] = actual[c].trim()
  if (actual.tienePerfil) {
    for (const c of CAMPOS_PERFIL) if (inicial[c] !== actual[c]) cuerpo[c] = actual[c].trim()
    // El backend pide el detalle junto a su opción («Otro» / «Otra»)
    if (cuerpo.genero === 'Otro' && cuerpo.generoOtro === undefined) cuerpo.generoOtro = actual.generoOtro.trim()
    if (cuerpo.eps === 'Otra' && cuerpo.epsOtra === undefined) cuerpo.epsOtra = actual.epsOtra.trim()
  }
  const contactos = []
  actual.contactos.forEach((c, i) => {
    const ini = inicial.contactos[i]
    const campos = CAMPOS_CONTACTO.filter((k) => c[k] !== ini?.[k])
    if (campos.length === 0) return
    const envio = { _id: c._id }
    for (const k of campos) envio[k] = c[k].trim()
    // El detalle del parentesco viaja junto a «Otro»
    if (envio.parentesco === 'Otro' && envio.parentescoOtro === undefined) envio.parentescoOtro = c.parentescoOtro.trim()
    contactos.push(envio)
  })
  if (contactos.length) cuerpo.contactos = contactos
  return cuerpo
}

/** Errores del backend -> mapa { campo: mensaje }. Acepta [{ campo, mensaje }] (formato actual) y { campo: mensaje } (antiguo). */
export function erroresDeApi(error) {
  const errs = error?.detalle?.errors
  if (!errs) return {}
  if (Array.isArray(errs)) return Object.fromEntries(errs.filter((x) => x?.campo).map((x) => [x.campo, x.mensaje]))
  return errs
}
