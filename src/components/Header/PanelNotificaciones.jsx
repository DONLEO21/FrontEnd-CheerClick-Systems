import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import useNotificaciones from '../../hooks/useNotificaciones'

const ETIQUETA = { seguridad: 'Seguridad', perfil: 'Perfil', cuenta: 'Cuenta', pago: 'Pagos' }

// Fecha relativa en español ("Hace 5 min", "Hace 2 h", "Ayer" o la fecha)
const hace = (iso) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'Ahora'
  if (min < 60) return `Hace ${min} min`
  if (min < 1440) return `Hace ${Math.round(min / 60)} h`
  if (min < 2880) return 'Ayer'
  return new Date(iso).toLocaleDateString('es-CO')
}

// Campanita del encabezado (los tres roles): insignia con las no leídas y panel desplegable
export default function PanelNotificaciones() {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef(null)
  const navigate = useNavigate()
  const { items, sinLeer, cargando, error, cargarLista, leer, leerTodas } = useNotificaciones()

  // Cierra con clic fuera o con Escape
  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => { if (!contenedor.current?.contains(e.target)) setAbierto(false) }
    const esc = (e) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', esc)
    }
  }, [abierto])

  const alternar = () => {
    if (!abierto) cargarLista()
    setAbierto((a) => !a)
  }

  // Al tocar una: se marca como leída y, si tiene enlace, navega a él (p. ej. /atleta/pagos)
  const abrir = (n) => {
    leer(n)
    if (n.enlace) {
      setAbierto(false)
      navigate(n.enlace)
    }
  }

  return (
    <div className="encabezado__notif" ref={contenedor}>
      <button
        type="button"
        className="icono-accion"
        aria-label={sinLeer > 0 ? `Ver notificaciones (${sinLeer} sin leer)` : 'Ver notificaciones'}
        aria-expanded={abierto}
        onClick={alternar}
      >
        <Bell size={22} strokeWidth={2} />
        {sinLeer > 0 && <span className="encabezado__notif-contador">{sinLeer > 9 ? '9+' : sinLeer}</span>}
      </button>

      {abierto && (
        <div className="encabezado__notif-panel ui-anim-desplegable" role="dialog" aria-label="Notificaciones">
          <div className="encabezado__notif-cabeza">
            <h3 className="encabezado__notif-titulo">Notificaciones</h3>
            <button type="button" className="encabezado__notif-todas" onClick={leerTodas} disabled={sinLeer === 0}>
              Marcar todas como leídas
            </button>
          </div>

          <div className="encabezado__notif-lista">
            {cargando && !items.length && <p className="encabezado__notif-vacio">Cargando…</p>}
            {error && <p className="encabezado__notif-vacio">{error}</p>}
            {!cargando && !error && !items.length && <p className="encabezado__notif-vacio">No tienes notificaciones</p>}
            {items.map((n) => (
              <button
                type="button"
                key={n.id}
                className={`encabezado__notif-item${n.leida ? '' : ' encabezado__notif-item--nueva'}`}
                onClick={() => abrir(n)}
              >
                <span className="encabezado__notif-tipo">
                  {!n.leida && <span className="encabezado__notif-punto" aria-label="Sin leer" />}
                  {n.titulo || ETIQUETA[n.tipo] || n.tipo}
                </span>
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
