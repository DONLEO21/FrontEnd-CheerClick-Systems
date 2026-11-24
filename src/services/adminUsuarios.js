// Gestión de cuentas (solo administrador). Backend: /api/usuarios/...
import { getImageUrl } from '../api/client'
import { rolApp, normalizarUsuario } from './sesion'
import { generoDesdeApi, parentescoDesdeApi, tipoDocDesdeApi, epsDesdeApi } from './perfil'
import { usuariosApi } from '../api/usuarios.api'

const ROL_API = { atleta: 'Atleta', entrenador: 'Entrenador', administrador: 'Administrador' }
const ESTADO_APP = { Pendiente: 'pendiente', Aprobada: 'aprobada', Rechazada: 'rechazada' }

// Caché en memoria: al volver a la pantalla la lista aparece al instante
let cache = null
export const usuariosEnCache = () => cache
const sinAdministradores = (filas) => filas.filter((u) => u.rol !== 'administrador')

// Usuario del backend -> fila que pintan las tablas de Cuentas
const aFila = (u) => ({
  id: u._id,
  email: u.email,
  nombre: [u.nombre, u.apellido].filter(Boolean).join(' '),
  primerNombre: u.nombre,
  apellido: u.apellido,
  rol: rolApp(u.rol),
  estado: ESTADO_APP[u.estadoSolicitud] ?? 'pendiente',
  activo: u.status !== false,
  created_at: u.createdAt,
  codigo: u.codigo ?? '—', // el código lo asigna el backend al aprobar la solicitud
  tambienEntrenador: (u.rolesAdicionales ?? []).includes('Entrenador'),
})

// El backend pagina de 10 en 10: se recorren todas las páginas de un estado
async function traerTodas(estado) {
  const filas = []
  let pagina = 1
  for (;;) {
    const r = await usuariosApi.listarSolicitudes({ estado, page: pagina })
    filas.push(...(r.data ?? []))
    if (filas.length >= (r.total ?? 0) || !(r.data ?? []).length) break
    pagina += 1
  }
  return filas
}

// conAdministradores: Gestión de cuentas los incluye (para editar sus datos y su rol adicional de entrenador);
// el resto de pantallas (dashboard, solicitudes) solo trabaja con atletas y entrenadores.
export async function cargarUsuarios({ conAdministradores = false } = {}) {
  const grupos = await Promise.all(['Pendiente', 'Aprobada', 'Rechazada'].map(traerTodas))
  cache = grupos.flat().map(aFila)
  return conAdministradores ? cache : sinAdministradores(cache)
}

export const aprobarSolicitud = (id, rol) => usuariosApi.aprobarSolicitud(id, { rol: ROL_API[rol] })
export const rechazarSolicitud = (id) => usuariosApi.rechazarSolicitud(id)
export const cambiarRolUsuario = (id, rol) => usuariosApi.cambiarRol(id, { rol: ROL_API[rol] })
export const cambiarActivoUsuario = (id, activo) => usuariosApi.cambiarStatus(id, { status: activo })

export async function crearUsuarioAdmin({ rol, nombre, apellido, email, password, nivel, plan, tambienEntrenador }) {
  const { data } = await usuariosApi.crear({
    rol: ROL_API[rol], nombre, apellido, email, contrasena: password,
    nivel: nivel || undefined, planAsociado: plan || undefined,
    ...(rol === 'administrador' && tambienEntrenador ? { tambienEntrenador: true } : {}),
  })
  return normalizarUsuario(data)
}

// Detalle completo para el modal: se adapta al formato que ya pinta el modal
export async function obtenerDetalleUsuario(id) {
  const { data } = await usuariosApi.detalle(id)
  const p = data.perfil
  const perfil = p && {
    tipo_documento: tipoDocDesdeApi(p.tipoDocumento),
    numero_documento: p.numDocumento,
    genero: generoDesdeApi(p.genero, p.generoOtro),
    fecha_nacimiento: p.fechaNacimiento,
    telefono: p.telefono,
    eps: epsDesdeApi(p.eps) || p.eps,
    tiene_certificado_eps: !!p.tieneCertificadoEps, // el archivo es privado: se pide con el token al verlo o descargarlo
    foto_url: getImageUrl(p.fotoPerfil) || null,
    contactos: (data.contactos ?? []).map((c) => ({
      nombre: c.nombre, apellido: c.apellido, telefono: c.telefono, parentesco: parentescoDesdeApi(c.parentesco),
    })),
  }
  // nivel y plan vienen poblados en data.usuario (backend: dbGetUsuarioConPlan); sirven también para cuentas pendientes y aprobadas
  const registro = {
    nivel: data.usuario?.nivel?.nombre ?? null,
    plan: data.usuario?.planAsociado?.nombre ?? null,
  }
  // `ficha` conserva los valores del backend tal cual (los usa el formulario de edición)
  return { perfil: perfil ?? null, registro, ficha: { usuario: data.usuario, perfil: p ?? null, contactos: data.contactos ?? [] } }
}

/* ───────── edición de cuentas (solo administrador) ───────── */
export const guardarFichaUsuario = (id, cuerpo) => usuariosApi.editarFicha(id, cuerpo)
export const reasignarNivelUsuario = (id, nivel) => usuariosApi.reasignarNivel(id, { nivel })
export const reasignarPlanUsuario = (id, planAsociado) => usuariosApi.reasignarPlan(id, { planAsociado })
export const cambiarRolEntrenadorUsuario = (id, activo) => usuariosApi.cambiarRolEntrenador(id, { activo })

// Certificado de EPS (privado): se pide con el token como Blob. El nombre de descarga sigue
// certificado-eps-{codigo}-{apellido}.{ext} (la extensión sale del tipo real del archivo).
const EXTENSION_POR_TIPO = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }
const slug = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export async function obtenerCertificadoEps(id, { codigo, apellido } = {}) {
  const blob = await usuariosApi.descargarCertificadoEps(id)
  const ext = EXTENSION_POR_TIPO[blob.type] ?? 'pdf'
  const partes = ['certificado-eps', slug(codigo), slug(apellido)].filter(Boolean)
  return { blob, tipo: blob.type, nombreArchivo: `${partes.join('-')}.${ext}` }
}
