import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import CampoClave from './CampoClave'
import { almacenSesion } from '../../api/client'
import { cambiarClave, cerrarSesion, rolActivoDe, RUTA_INICIO } from '../../services/sesion'
import useEstadoSesion from '../../hooks/useEstadoSesion'
import useTituloPagina from '../../hooks/useTituloPagina'
import logoClub from '../../assets/icons/Logo-Club.png'
import './auth.css'

/**
 * Cambio de contraseña OBLIGATORIO (la cuenta se creó con una contraseña temporal asignada por el administrador).
 * No tiene botón de cierre ni de volver: hasta cambiarla, el backend responde 403 CAMBIO_CLAVE_REQUERIDO en todo lo demás.
 * Solo se permite cerrar sesión. Los errores son los reales del backend, por campo.
 */
export default function CambiarClave() {
  const navigate = useNavigate()
  const { debeCambiarClave } = useEstadoSesion()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(false)
  useTituloPagina('Cambiar contraseña')

  const usuario = almacenSesion.usuario()
  if (!usuario || !almacenSesion.token()) return <Navigate to="/acceso" replace />
  // Sin contraseña temporal pendiente (o ya cambiada) no hay nada que hacer aquí
  if (!debeCambiarClave) return <Navigate to={RUTA_INICIO[rolActivoDe(usuario)] ?? '/'} replace />

  const validar = () => {
    const e = {}
    if (!actual) e.actual = 'Escribe la contraseña temporal que te dieron.'
    if (!nueva || nueva.length < 8) e.nueva = 'La contraseña debe tener mínimo 8 caracteres.'
    else if (nueva === actual) e.nueva = 'La contraseña nueva debe ser distinta de la temporal.'
    if (nueva && confirmar !== nueva) e.confirmar = 'Las contraseñas no coinciden.'
    return e
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    const e = validar()
    setErrores(e)
    if (Object.keys(e).length) return
    setCargando(true)
    try {
      const actualizado = await cambiarClave({ actual, nueva, confirmar })
      // Siguiente guardia (completar el perfil) lo decide Rutaprotegida
      navigate(RUTA_INICIO[rolActivoDe(actualizado)] ?? '/', { replace: true })
    } catch (err) {
      const delBackend = err.detalle?.errors
      setErrores(delBackend && Object.keys(delBackend).length ? delBackend : { general: err.message })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pagina-auth">
      <div className="contenedor">
        <div className="tarjeta">
          <img src={logoClub} alt="Logo BTC" className="logo-imagen" />
          <h2>Cambia tu contraseña</h2>
          <p className="subtitulo">
            Tu cuenta fue creada con una contraseña temporal.<br />Elige una nueva para continuar.
          </p>

          <form onSubmit={guardar} noValidate>
            <label className="etiqueta" htmlFor="cambiar-actual">Contraseña temporal</label>
            <CampoClave id="cambiar-actual" placeholder="La que te entregó el club" value={actual} onChange={(e) => setActual(e.target.value)} />
            {errores.actual && <div className="mensaje-error" role="alert">{errores.actual}</div>}

            <label className="etiqueta" htmlFor="cambiar-nueva">Nueva contraseña</label>
            <CampoClave id="cambiar-nueva" placeholder="Mínimo 8 caracteres" value={nueva} onChange={(e) => setNueva(e.target.value)} />
            {errores.nueva && <div className="mensaje-error" role="alert">{errores.nueva}</div>}

            <label className="etiqueta" htmlFor="cambiar-confirmar">Confirmar contraseña</label>
            <CampoClave id="cambiar-confirmar" placeholder="Repite la contraseña nueva" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
            {errores.confirmar && <div className="mensaje-error" role="alert">{errores.confirmar}</div>}

            {errores.general && <div className="mensaje-error" role="alert">{errores.general}</div>}

            <button className="boton-primario" type="submit" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
            <p className="nota-pie">
              <a className="enlace-rojo" onClick={() => cerrarSesion(navigate)}>Cerrar sesión</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
