import { useState, useRef, useEffect } from 'react'

/**
 * Estado del aviso/toast ÚNICO de la aplicación (se pinta con <AvisoToast aviso={aviso} />).
 * tipo: 'ok' | 'advertencia' | 'error'
 *
 *   const { aviso, mostrarAviso } = useAviso()                         // tipo por defecto: advertencia
 *   const { aviso, mostrarAviso } = useAviso({ tipoPorDefecto: 'ok' })
 *   mostrarAviso('Guardado', 'ok')
 */
export default function useAviso({ tipoPorDefecto = 'advertencia', duracion = 4000 } = {}) {
  const [aviso, setAviso] = useState({ mensaje: '', tipo: tipoPorDefecto, visible: false })
  const timer = useRef(null)

  // Al desmontar la vista no debe quedar un temporizador pendiente
  useEffect(() => () => clearTimeout(timer.current), [])

  const mostrarAviso = (mensaje, tipo = tipoPorDefecto) => {
    clearTimeout(timer.current)
    setAviso({ mensaje, tipo, visible: true })
    timer.current = setTimeout(() => setAviso((a) => ({ ...a, visible: false })), duracion)
  }

  return { aviso, mostrarAviso }
}
