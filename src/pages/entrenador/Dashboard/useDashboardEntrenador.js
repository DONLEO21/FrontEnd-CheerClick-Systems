import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BASE_VACIA,
  iso, dia10, cargarBase, obtenerEntrenos, calcularMetricas,
} from './dashboardEntrenadorData.js'

export default function useDashboardEntrenador(mostrarAviso) {
  const hoy = iso(new Date())

  /* ── datos base ── */
  const [base, setBase] = useState(BASE_VACIA)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true

    cargarBase()
      .then((b) => {
        if (!vivo) return
        setBase(b)
        // Sin ningún nivel y con errores: no hay nada que mostrar -> error con "Reintentar".
        // Un entrenador sin nivel asignado (sin errores) ve sus estados vacíos, no un error.
        if (b.errores.length) {
          if (b.niveles.length === 0) setError(b.errores[0])
          else mostrarAviso(`No se pudo leer: ${b.errores[0]}`, 'error')
        }
      })
      .catch((e) => { if (vivo) setError(e.message || 'No se pudo cargar tu información.') })
      .finally(() => vivo && setCargando(false))

    return () => { vivo = false }
  }, [intento])

  const recargar = useCallback(() => { setError(''); setCargando(true); setIntento((n) => n + 1) }, [])

  const clavesNivel = base.niveles.map((n) => n.id).join(',')
  const nombreNivel = useMemo(
    () => Object.fromEntries(base.niveles.map((n) => [String(n.id), n.nombre])),
    [base.niveles]
  )
  const tieneNivel = base.niveles.length > 0

  /* ── calendario ── */
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [entrenos, setEntrenos] = useState([])
  const [cargandoCal, setCargandoCal] = useState(false)
  const [diaSel, setDiaSel] = useState(hoy)
  const mesClave = `${mes.getFullYear()}-${mes.getMonth()}`

  useEffect(() => {
    if (cargando) return
    let vivo = true
    setCargandoCal(true)
    obtenerEntrenos({
      niveles: base.niveles,
      desde: iso(mes),
      hasta: iso(new Date(mes.getFullYear(), mes.getMonth() + 1, 0)),
    })
      .then((r) => vivo && setEntrenos(r))
      .catch((e) => { if (vivo) { setEntrenos([]); mostrarAviso(e.message, 'error') } })
      .finally(() => vivo && setCargandoCal(false))
    return () => { vivo = false }
  }, [mesClave, cargando, clavesNivel])

  const porDia = useMemo(() => {
    const m = {}
    entrenos.forEach((e) => {
      const f = dia10(e.fecha)
      if (!m[f]) m[f] = []
      m[f].push(e)
    })
    return m
  }, [entrenos])

  const cambiarMes = (delta) => setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1))

  /* ── entrenamientos de hoy ── */
  const [entrenosHoy, setEntrenosHoy] = useState(null)

  useEffect(() => {
    if (cargando) return
    let vivo = true
    obtenerEntrenos({ niveles: base.niveles, desde: hoy, hasta: hoy })
      .then((r) => vivo && setEntrenosHoy(r.length))
      .catch(() => vivo && setEntrenosHoy(null))
    return () => { vivo = false }
  }, [cargando, clavesNivel])

  /* ── métricas ── */
  const metricas = useMemo(() => calcularMetricas(base.evals, base.asist), [base.evals, base.asist])
  const atletasActivos = base.atletas.filter((a) => a.activo).length

  return {
    base, cargando, error, recargar, hoy, nombreNivel, tieneNivel, metricas, atletasActivos, entrenosHoy,
    calendario: { mes, cambiarMes, porDia, cargando: cargandoCal, diaSel, setDiaSel },
  }
}