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

export async function cargarUsuarios() {
  const grupos = await Promise.all(['Pendiente', 'Aprobada', 'Rechazada'].map(traerTodas))
  // Los administradores no se gestionan desde esta pantalla (solo atletas y entrenadores)
  cache = grupos.flat().filter((u) => u.rol !== 'Administrador').map(aFila)
  return cache
}

export const aprobarSolicitud = (id, rol) => usuariosApi.aprobarSolicitud(id, { rol: ROL_API[rol] })
export const rechazarSolicitud = (id) => usuariosApi.rechazarSolicitud(id)
export const cambiarRolUsuario = (id, rol) => usuariosApi.cambiarRol(id, { rol: ROL_API[rol] })
export const cambiarActivoUsuario = (id, activo) => usuariosApi.cambiarStatus(id, { status: activo })

export async function crearUsuarioAdmin({ rol, nombre, apellido, email, password, nivel, plan }) {
  const { data } = await usuariosApi.crear({
    rol: ROL_API[rol], nombre, apellido, email, contrasena: password,
    nivel: nivel || undefined, planAsociado: plan || undefined,
  })
  return normalizarUsuario(data)
}

// Detalle completo para el modal: se adapta al formato que ya pinta el modal
export async function obtenerDetalleUsuario(id) {
  const { data } = await usuariosApi.detalle(id)
  const p = data.perfil
  let certUrl = null
  if (p?.tieneCertificadoEps) {
    try { certUrl = URL.createObjectURL(await usuariosApi.descargarCertificadoEps(id)) } catch { /* sin archivo */ }
  }
  const perfil = p && {
    tipo_documento: tipoDocDesdeApi(p.tipoDocumento),
    numero_documento: p.numDocumento,
    genero: generoDesdeApi(p.genero, p.generoOtro),
    fecha_nacimiento: p.fechaNacimiento,
    telefono: p.telefono,
    eps: epsDesdeApi(p.eps) || p.eps,
    certificado_eps_nombre: p.tieneCertificadoEps ? 'Certificado de EPS' : null,
    certificado_eps_url_firmada: certUrl,
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
  return { perfil: perfil ?? null, registro }
}
