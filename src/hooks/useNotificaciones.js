import { useCallback, useEffect, useRef, useState } from 'react'
import {
  listarNotificaciones, contarNotificacionesSinLeer, marcarNotificacionLeida, marcarTodasLeidas,
} from '../services/notificacionesService'

// Intervalo del polling del contador (supuesto: 60 s). Se pausa con la pestaña oculta.
const INTERVALO_MS = 60_000

/**
 * Notificaciones del usuario autenticado (cada rol ve las suyas).
 *  - sinLeer: contador de la insignia de la campanita (polling cada 60 s)
 *  - items: lista completa; se carga con cargarLista() (al abrir el panel)
 *  - leer(n) / leerTodas(): marcan como leídas con actualización inmediata de la interfaz
 */
export default function useNotificaciones() {
  const [items, setItems] = useState([])
  const [sinLeer, setSinLeer] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const vivo = useRef(true)

  useEffect(() => {
    vivo.current = true
    return () => { vivo.current = false }
  }, [])

  const refrescarContador = useCallback(async () => {
    try {
      const n = await contarNotificacionesSinLeer()
      if (vivo.current) setSinLeer(n)
    } catch { /* un fallo del polling no debe molestar al usuario */ }
  }, [])

  const cargarLista = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const r = await listarNotificaciones()
      if (!vivo.current) return
      setItems(r.items)
      setSinLeer(r.sinLeer)
    } catch (e) {
      if (vivo.current) setError(e.message || 'No se pudieron cargar las notificaciones.')
    } finally {
      if (vivo.current) setCargando(false)
    }
  }, [])

  // Polling del contador: al montar y cada 60 s (solo con la pestaña visible)
  useEffect(() => {
    refrescarContador()
    const id = setInterval(() => { if (!document.hidden) refrescarContador() }, INTERVALO_MS)
    const alVolver = () => { if (!document.hidden) refrescarContador() }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [refrescarContador])

  const leer = useCallback(async (n) => {
    if (n.leida) return
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)))
    setSinLeer((s) => Math.max(0, s - 1))
    try { await marcarNotificacionLeida(n.id) } catch { cargarLista() }
  }, [cargarLista])

  const leerTodas = useCallback(async () => {
    setItems((prev) => prev.map((x) => ({ ...x, leida: true })))
    setSinLeer(0)
    try { await marcarTodasLeidas() } catch { cargarLista() }
  }, [cargarLista])

  return { items, sinLeer, cargando, error, cargarLista, leer, leerTodas }
}
