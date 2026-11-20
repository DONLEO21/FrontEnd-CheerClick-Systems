import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { listarNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from '../../services/notificacionesService'

const ETIQUETA = { seguridad: 'Seguridad', perfil: 'Perfil', cuenta: 'Cuenta' }

const hace = (iso) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'Ahora'
  if (min < 60) return `Hace ${min} min`
  if (min < 1440) return `Hace ${Math.round(min / 60)} h`
  return new Date(iso).toLocaleDateString('es-CO')
}

// Campanita del encabezado: abre un panel con las notificaciones del usuario
export default function PanelNotificaciones() {
  const [abierto, setAbierto] = useState(false)
  const [items, setItems] = useState([])
  const [sinLeer, setSinLeer] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const contenedor = useRef(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const r = await listarNotificaciones()
      setItems(r.items)
      setSinLeer(r.sinLeer)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  // el contador se carga al montar; el listado se refresca al abrir
  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => { if (!contenedor.current?.contains(e.target)) setAbierto(false) }
    const esc = (e) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc) }
  }, [abierto])

  const alternar = () => {
    if (!abierto) cargar()
    setAbierto((a) => !a)
  }

  const leer = async (n) => {
    if (n.leida) return
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)))
    setSinLeer((s) => Math.max(0, s - 1))
    try { await marcarNotificacionLeida(n.id) } catch { cargar() }
  }

  const leerTodas = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, leida: true })))
    setSinLeer(0)
    try { await marcarTodasLeidas() } catch { cargar() }
  }

  return (
    <div className="encabezado__notif" ref={contenedor}>
      <button type="button" className="icono-accion" aria-label="Ver notificaciones" aria-expanded={abierto} onClick={alternar}>
        <Bell size={22} strokeWidth={2} />
        {sinLeer > 0 && <span className="encabezado__notif-contador">{sinLeer > 9 ? '9+' : sinLeer}</span>}
      </button>

      {abierto && (
        <div className="encabezado__notif-panel" role="dialog" aria-label="Notificaciones">
          <div className="encabezado__notif-cabeza">
            <h3 className="encabezado__notif-titulo">Notificaciones</h3>
            <button type="button" className="encabezado__notif-todas" onClick={leerTodas} disabled={sinLeer === 0}>
              Marcar todas como leídas
            </button>
          </div>

          <div className="encabezado__notif-lista">
            {cargando && !items.length && <p className="encabezado__notif-vacio">Cargando…</p>}
            {error && <p className="encabezado__notif-vacio">{error}</p>}
            {!cargando && !error && !items.length && <p className="encabezado__notif-vacio">No tienes notificaciones.</p>}
            {items.map((n) => (
              <button
                type="button"
                key={n.id}
                className={`encabezado__notif-item${n.leida ? '' : ' encabezado__notif-item--nueva'}`}
                onClick={() => leer(n)}
              >
                <span className="encabezado__notif-tipo">{ETIQUETA[n.tipo] ?? n.tipo}</span>
                <span className="encabezado__notif-mensaje">{n.mensaje}</span>
                <span className="encabezado__notif-fecha">{hace(n.fecha)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
