import { useEffect, useState } from 'react'
import { almacenSesion, EVENTO_SESION } from '../api/client'

/**
 * Estado de los guardias de la sesión guardada: { debeCambiarClave, perfilCompleto, camposFaltantes }.
 * Se actualiza solo cuando algo cambia la sesión (login, renovar-token, guardar el perfil, 403 del backend).
 */
export default function useEstadoSesion() {
  const [, setVersion] = useState(0)
  useEffect(() => {
    const alCambiar = () => setVersion((v) => v + 1)
    window.addEventListener(EVENTO_SESION, alCambiar)
    return () => window.removeEventListener(EVENTO_SESION, alCambiar)
  }, [])
  const u = almacenSesion.usuario()
  return {
    debeCambiarClave: u?.debeCambiarClave === true,
    perfilCompleto: u?.perfilCompleto !== false,
    camposFaltantes: u?.camposFaltantes ?? [],
  }
}
