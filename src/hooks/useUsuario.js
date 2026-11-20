import { useEffect, useState } from 'react'
import { almacenSesion } from '../api/client'
import { getImageUrl } from '../api/client'
import { cargarMiPerfil } from '../services/perfil'

// Caché en memoria: evita repetir consultas al navegar entre pantallas
let cache = null

export const limpiarCacheUsuario = () => { cache = null }

const VACIO = {
  nombre: '',
  apellido: '',
  email: '',
  rol: '',
  foto: null,
  cargando: true,
}

export default function useUsuario() {
  const [usuario, setUsuario] = useState(() => cache ?? VACIO)

  useEffect(() => {
    let vivo = true

    const cargar = async () => {
      const u = almacenSesion.usuario()
      if (!u) {
        if (vivo) setUsuario({ ...VACIO, cargando: false })
        return
      }

      // Datos básicos al instante (vienen de la sesión guardada)
      const base = { nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol }
      if (vivo) setUsuario((prev) => ({ ...prev, ...base, cargando: false }))

      // La foto llega después, sin bloquear la pantalla
      let foto = null
      try {
        const mi = await cargarMiPerfil()
        foto = getImageUrl(mi.perfil?.fotoPerfil) || null
      } catch { /* sin foto */ }

      const final = { ...base, foto, cargando: false }
      cache = final
      if (vivo) setUsuario(final)
    }

    cargar()
    return () => { vivo = false }
  }, [])

  return usuario
}
