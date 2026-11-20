// Sesión de usuario contra el backend real (JWT). Sustituye a la antigua integración con Supabase.
import { almacenSesion } from '../api/client'
import { limpiarCacheUsuario } from '../hooks/useUsuario'
import { authApi } from '../api/auth.api'

const ROL_APP = { Administrador: 'administrador', Entrenador: 'entrenador', Atleta: 'atleta' }
export const RUTA_INICIO = { administrador: '/admin', entrenador: '/entrenador', atleta: '/atleta' }

export const rolApp = (rolApi) => ROL_APP[rolApi] ?? 'atleta'

// Usuario del backend -> forma que usa la interfaz (rol en minúsculas, id en vez de _id)
export const normalizarUsuario = (u) => ({
  id: u._id,
  nombre: u.nombre ?? '',
  apellido: u.apellido ?? '',
  email: u.email ?? '',
  rol: rolApp(u.rol),
  codigo: u.codigo ?? null,
  nivel: u.nivel ?? null,
  planAsociado: u.planAsociado ?? null,
  activo: u.status !== false,
})

export const usuarioActual = () => almacenSesion.usuario()
export const haySesion = () => !!almacenSesion.token() && !!almacenSesion.usuario()

export async function iniciarSesion(email, contrasena) {
  const { token, data } = await authApi.login({ email: email.trim(), contrasena })
  const usuario = normalizarUsuario(data)
  almacenSesion.guardar(token, usuario)
  limpiarCacheUsuario()
  return usuario
}

// Renueva el token (dura 5 h) y refresca los datos del usuario. Si el token ya no sirve, el cliente cierra la sesión.
export async function renovarSesion() {
  const { token, data } = await authApi.renovarToken()
  const usuario = normalizarUsuario(data)
  almacenSesion.guardar(token, usuario)
  return usuario
}

export async function cerrarSesion(navigate) {
  almacenSesion.limpiar()
  limpiarCacheUsuario()
  navigate('/', { replace: true })
}

/* ───────── registro y recuperación de clave (rutas públicas) ───────── */
// nivel y planAsociado son los _id de /niveles y /plan-asociado (el backend los exige)
export const registrar = ({ nombre, apellido, email, contrasena, nivel, planAsociado }) =>
  authApi.registro({ nombre, apellido, email, contrasena, nivel, planAsociado })

export const enviarCodigoRecuperacion = (email) =>
  authApi.olvideContrasena({ email })

export const verificarCodigoRecuperacion = (email, code) =>
  authApi.verificarCodigo({ email, code })

export const restablecerClave = (email, code, contrasena, confirmarContrasena) =>
  authApi.restablecerContrasena({ email, code, contrasena, confirmarContrasena })
