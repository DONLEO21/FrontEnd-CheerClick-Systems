// Perfil del usuario autenticado (backend: /api/perfilusuario/me …).
// Convierte entre el formato del backend (etiquetas) y el del formulario (claves en minúsculas).
import { getImageUrl } from '../api/client'
import { perfilApi } from '../api/perfil.api'

/* ───────── equivalencias formulario <-> backend ───────── */
const DOC = { cedula: 'Cédula de Ciudadanía', tarjeta: 'Tarjeta de Identidad', pasaporte: 'Pasaporte', extranjeria: 'Cédula de Extranjeria' }
const EPS = {
  compensar: 'Compensar', coomeva: 'Coomeva', famisanar: 'Famisanar', nuevaeps: 'Nueva EPS',
  'salud-total': 'Salud Total', sanitas: 'Sanitas', sura: 'SURA', otra: 'Otra',
}
// TODO(backend): el género del backend solo admite Femenino / Masculino / Otro.
// "Prefiero no decirlo" se guarda como Otro + generoOtro="Prefiere no decirlo".
const GENERO = { femenino: 'Femenino', masculino: 'Masculino', otro: 'Otro', 'no-decir': 'Otro' }
// TODO(backend): "Madre / Padre" no existe como tal; se guarda como "Madre".
const PARENTESCO = { 'madre-padre': 'Madre', tutor: 'Tutor', 'conyuge-pareja': 'Cónyuge', otro: 'Otro' }

const invertir = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]))
const DOC_INV = invertir(DOC)
const EPS_INV = invertir(EPS)

export const generoDesdeApi = (g, otro) => (g === 'Otro' && otro === 'Prefiere no decirlo' ? 'no-decir' : (g ?? '').toLowerCase())
export const parentescoDesdeApi = (p) => {
  if (p === 'Madre' || p === 'Padre') return 'madre-padre'
  if (p === 'Tutor') return 'tutor'
  if (p === 'Cónyuge') return 'conyuge-pareja'
  return p ? 'otro' : 'madre-padre'
}
export const tipoDocDesdeApi = (t) => DOC_INV[t] ?? 'cedula'
export const epsDesdeApi = (e) => EPS_INV[e] ?? ''

const fechaISO = (f) => (f ? String(f).slice(0, 10) : '')

const contactoVacio = () => ({ nombre: '', apellido: '', telefono: '', parentesco: 'madre-padre' })

/** Respuesta de GET /perfilusuario/me -> datos del formulario + bloqueos */
export function perfilDesdeApi(mi, cantidadContactos) {
  const { usuario, perfil, contactos = [], camposBloqueados = [] } = mi
  const lista = contactos
    .slice().sort((a, b) => Number(b.principal) - Number(a.principal)) // el principal va primero
    .map((c) => ({ nombre: c.nombre ?? '', apellido: c.apellido ?? '', telefono: c.telefono ?? '', parentesco: parentescoDesdeApi(c.parentesco) }))
  while (lista.length < cantidadContactos) lista.push(contactoVacio())

  const datos = {
    // El backend (GET /perfilusuario/me) devuelve nombre y apellido por separado en usuario
    nombre: usuario?.nombre ?? '',
    apellido: usuario?.apellido ?? '',
    fotoUrl: getImageUrl(perfil?.fotoPerfil) || null,
    tipoDocumento: tipoDocDesdeApi(perfil?.tipoDocumento),
    numeroDocumento: perfil?.numDocumento ?? '',
    genero: generoDesdeApi(perfil?.genero, perfil?.generoOtro),
    fechaNacimiento: fechaISO(perfil?.fechaNacimiento),
    correo: usuario?.email ?? '',
    telefono: perfil?.telefono ?? '',
    eps: epsDesdeApi(perfil?.eps),
    certificadoEpsNombre: perfil?.tieneCertificadoEps ? 'Certificado de EPS' : '',
    certificadoEpsPath: perfil?.tieneCertificadoEps ? 'me' : '',
    certificadoEpsUrl: '',
    certificadoEpsArchivo: null,
    nivel: usuario?.nivel?.nombre ?? '',
    planMensualidad: usuario?.planAsociado?.nombre ?? '',
    contactos: lista.slice(0, Math.max(cantidadContactos, 1)),
    // datos que el formulario no muestra pero hay que conservar al guardar
    _existePerfil: !!perfil,
    _epsOtra: perfil?.epsOtra ?? null,
    _generoOtro: perfil?.generoOtro ?? null,
  }
  const bloqueos = {
    genero: camposBloqueados.includes('genero'),
    fechaNacimiento: camposBloqueados.includes('fechaNacimiento'),
    numeroDocumento: camposBloqueados.includes('numDocumento'),
  }
  return { datos, bloqueos }
}

export async function cargarMiPerfil() {
  const { data } = await perfilApi.me()
  return data // { nombreCompleto, usuario, perfil, camposBloqueados, contactos }
}

// Descarga el certificado (ruta protegida) y devuelve una URL temporal para abrirlo
export async function urlCertificadoPropio() {
  const blob = await perfilApi.descargarCertificadoEps()
  return URL.createObjectURL(blob)
}

/** Guarda el formulario. cantidadContactos: 2 para atleta, 1 para el resto. */
export async function guardarPerfilPropio(borrador, cantidadContactos) {
  const generoApi = GENERO[borrador.genero]
  const camposPerfil = {
    tipoDocumento: DOC[borrador.tipoDocumento],
    numDocumento: borrador.numeroDocumento,
    genero: generoApi,
    generoOtro: borrador.genero === 'no-decir' ? 'Prefiere no decirlo' : (generoApi === 'Otro' ? (borrador._generoOtro || 'Otro') : null),
    telefono: borrador.telefono,
    fechaNacimiento: borrador.fechaNacimiento || undefined,
    eps: EPS[borrador.eps],
    // TODO(UI): el formulario no pide "¿cuál EPS?"; si elige "Otra" se conserva el valor previo o "Otra".
    epsOtra: borrador.eps === 'otra' ? (borrador._epsOtra || 'Otra') : null,
  }

  // nombre, apellido y correo viven en el usuario (PATCH /perfilusuario/me los actualiza junto con el perfil)
  const datosUsuario = { nombre: borrador.nombre.trim(), apellido: borrador.apellido.trim() }

  if (borrador._existePerfil) {
    await perfilApi.actualizarMe({ ...camposPerfil, ...datosUsuario, email: borrador.correo })
  } else {
    await perfilApi.crear(camposPerfil)
    await perfilApi.actualizarMe({ ...datosUsuario, ...(borrador.correo ? { email: borrador.correo } : {}) })
  }

  if (borrador.certificadoEpsArchivo) {
    await perfilApi.subirCertificadoEps({ certificado: borrador.certificadoEpsArchivo })
  }

  const contactos = borrador.contactos.slice(0, cantidadContactos)
  const hayContactos = contactos.some((c) => c.nombre || c.apellido || c.telefono)
  if (hayContactos) {
    await perfilApi.guardarContactos({
      contactos: contactos.map((c, i) => ({
        nombre: c.nombre, apellido: c.apellido, telefono: c.telefono,
        parentesco: PARENTESCO[c.parentesco] ?? 'Madre',
        parentescoOtro: c.parentesco === 'otro' ? 'Otro' : null, // TODO(UI): no hay campo para "¿cuál parentesco?"
        principal: i === 0,
      })),
    })
  }
}

// Sube la foto y devuelve su URL pública
export async function subirFotoPerfil(archivo) {
  const { fotoPerfil } = await perfilApi.subirFoto({ foto: archivo })
  return `${getImageUrl(fotoPerfil)}?t=${Date.now()}` // evita ver una versión cacheada
}
