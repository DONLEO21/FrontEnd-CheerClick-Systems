import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { almacenSesion, RUTA_LOGIN } from '../api/client'
import { RUTA_INICIO, RUTA_CAMBIAR_CLAVE, renovarSesion, rolActivoDe, fijarRolActivo } from '../services/sesion'
import useEstadoSesion from '../hooks/useEstadoSesion'
import { tieneRol } from '../utils/roles'
import { nombreDeRuta } from '../constants/titulosRutas'

// Devuelve a dónde redirigir (una ruta, o { to, state }), o null si el usuario puede entrar.
// Se valida que el usuario POSEA el rol de la URL (principal o adicional). Si lo posee, esa URL define el rol activo; si no,
// vuelve al panel de su rol activo (p. ej. un administrador sin «También actúa como entrenador» no entra a /entrenador/*).
// Es solo comodidad de interfaz: cada endpoint vuelve a validar el permiso en el backend.
// Orden de los guardias: 1) contraseña temporal, 2) perfil incompleto (solo se puede estar en «Perfil»), 3) acceso normal.
function evaluar(usuario, token, rolPermitido, pathname) {
  if (!usuario || !token) return RUTA_LOGIN
  if (usuario.debeCambiarClave) return RUTA_CAMBIAR_CLAVE
  if (usuario.perfilCompleto === false) {
    const perfil = `${RUTA_INICIO[rolPermitido] ?? RUTA_INICIO[rolActivoDe(usuario)] ?? ''}/perfil`
    if (pathname.toLowerCase().replace(/\/+$/, '') !== perfil) {
      // El panel (/atleta, /admin, /entrenador) es el destino normal tras iniciar sesión: solo se redirige. Un módulo escrito a mano
      // lleva además su nombre para que Perfil abra el modal explicativo.
      const esInicio = Object.values(RUTA_INICIO).includes(pathname.toLowerCase().replace(/\/+$/, ''))
      return { to: `${perfil}?completar=1`, state: esInicio ? undefined : { moduloBloqueado: nombreDeRuta(pathname) ?? undefined } }
    }
  }
  if (rolPermitido && !tieneRol(usuario, rolPermitido)) return RUTA_INICIO[rolActivoDe(usuario)] ?? RUTA_LOGIN
  return null
}

export default function Rutaprotegida({ rolPermitido, children }) {
  useEstadoSesion()   // vuelve a evaluar cuando cambian las marcas de la sesión (403 del backend, guardar el perfil…)
  const { pathname } = useLocation()
  const usuario = almacenSesion.usuario()
  const token = almacenSesion.token()
  const destino = evaluar(usuario, token, rolPermitido, pathname)

  // La URL manda: entrar a /entrenador/* con el rol de entrenador lo deja como rol activo (se guarda para recargas)
  if (!destino && rolPermitido && almacenSesion.rolActivo() !== rolPermitido) fijarRolActivo(rolPermitido)

  // Confirma con el servidor en segundo plano y renueva el token.
  // Si el token venció o la cuenta se desactivó, el cliente de la API (401) cierra la sesión y redirige al login.
  useEffect(() => {
    if (destino) return
    renovarSesion().catch(() => {})
  }, [destino, rolPermitido])

  if (destino) {
    const { to, state } = typeof destino === 'string' ? { to: destino } : destino
    return <Navigate to={to} state={state} replace />
  }
  return children
}
