import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { almacenSesion, RUTA_LOGIN } from '../api/client'
import { RUTA_INICIO, renovarSesion } from '../services/sesion'

// Devuelve a dónde redirigir, o null si el usuario puede entrar
function evaluar(usuario, token, rolPermitido) {
  if (!usuario || !token) return RUTA_LOGIN
  if (rolPermitido && usuario.rol !== rolPermitido) return RUTA_INICIO[usuario.rol] ?? RUTA_LOGIN
  return null
}

export default function Rutaprotegida({ rolPermitido, children }) {
  const usuario = almacenSesion.usuario()
  const token = almacenSesion.token()
  const destino = evaluar(usuario, token, rolPermitido)

  // Confirma con el servidor en segundo plano y renueva el token.
  // Si el token venció o la cuenta se desactivó, el cliente de la API (401) cierra la sesión y redirige al login.
  useEffect(() => {
    if (destino) return
    renovarSesion().catch(() => {})
  }, [destino, rolPermitido])

  if (destino) return <Navigate to={destino} replace />
  return children
}
