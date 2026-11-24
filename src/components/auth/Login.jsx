import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { iniciarSesion as iniciarSesionApi, rolActivoDe, RUTA_INICIO, RUTA_CAMBIAR_CLAVE } from '../../services/sesion'
import CampoClave from './CampoClave'
import logoClub from '../../assets/icons/Logo-Club.png'

/* Iconos de la alerta (SVG en línea, sin dependencias) */
const IconoAdvertencia = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconoError = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

function Login({ irA }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  // alerta en línea: { tipo: 'advertencia' | 'error', titulo, texto } | null
  const [alerta, setAlerta] = useState(null)

  const iniciarSesion = async (e) => {
    e.preventDefault()
    setAlerta(null)
    setCargando(true)

    try {
      const usuario = await iniciarSesionApi(email, password)
      // "replace" sustituye la entrada de /acceso en el historial
      navigate(usuario.debeCambiarClave ? RUTA_CAMBIAR_CLAVE : RUTA_INICIO[rolActivoDe(usuario)] ?? '/atleta', { replace: true })
    } catch (err) {
      const texto = err.message ?? ''
      if (err.status === 403 && /pendiente/i.test(texto)) {
        setAlerta({
          tipo: 'advertencia',
          titulo: 'Atención:',
          texto: 'Tu cuenta está en proceso de revisión.\nTe notificaremos por correo cuando sea aprobada.',
        })
      } else if (err.status === 403) {
        // solicitud rechazada o cuenta desactivada: el backend envía el motivo
        setAlerta({ tipo: 'error', titulo: 'Error:', texto })
      } else if (err.status === 401 || err.status === 404) {
        setAlerta({ tipo: 'error', titulo: 'Error:', texto: 'Correo o contraseña incorrectos.' })
      } else {
        setAlerta({ tipo: 'error', titulo: 'Error:', texto })
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="tarjeta">
      <img src={logoClub} alt="Logo BTC" className="logo-imagen" />
      <h2>Iniciar sesión</h2>

      {alerta && (
        <div
          className={`alerta alerta-${alerta.tipo}`}
          role={alerta.tipo === 'error' ? 'alert' : 'status'}
        >
          <span className="alerta-icono">
            {alerta.tipo === 'error' ? <IconoError /> : <IconoAdvertencia />}
          </span>
          <p className="alerta-texto">
            <strong>{alerta.titulo}</strong> {alerta.texto}
          </p>
        </div>
      )}

      <form onSubmit={iniciarSesion}>
        <label className="etiqueta" htmlFor="login-correo">Correo electrónico</label>
        <input
          className="campo"
          type="email"
          id="login-correo"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="etiqueta" htmlFor="login-clave">Contraseña</label>
        <CampoClave
          id="login-clave"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="boton-primario" type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

        <p className="nota-pie">
          <a className="enlace-rojo" onClick={() => irA('recuperar-correo')}>¿Olvidaste tu contraseña?</a>
        </p>
        <p className="nota-pie">
          ¿No tienes cuenta? <a className="enlace-rojo" onClick={() => irA('registro')}>Regístrate</a>
        </p>
      </form>
    </div>
  )
}
export default Login