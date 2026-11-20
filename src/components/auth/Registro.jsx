import { useEffect, useState } from 'react'
import { registrar } from '../../services/sesion'
import { listarNivelesPublicos, listarPlanesPublicos } from '../../services/catalogos'
import CampoClave from './CampoClave'

function Registro({ irA, setNombreRegistrado }) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [nivel, setNivel] = useState('')
  const [plan, setPlan] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Niveles y planes REALES del club (solo los activos que gestiona el administrador); nada va fijo en el código.
  // TODO(backend): endpoints públicos /niveles/publico y /plan-asociado/publico (ver docs/backend-registro-publico).
  const [NIVELES, setNiveles] = useState([])
  const [PLANES, setPlanes] = useState([])
  const [cargandoOpciones, setCargandoOpciones] = useState(true)
  useEffect(() => {
    Promise.all([
      listarNivelesPublicos().then(setNiveles).catch(() => {}),
      listarPlanesPublicos().then(setPlanes).catch(() => {}),
    ]).finally(() => setCargandoOpciones(false))
  }, [])
  const textoVacio = (lista, singular) => (cargandoOpciones ? `Cargando ${singular}...` : lista.length ? 'Seleccionar...' : `No hay ${singular} disponibles`)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const registrarUsuario = async (e) => {
    e.preventDefault()
    setMensaje('')

    const nombreLimpio = nombre.trim()
    const apellidoLimpio = apellido.trim()

    if (!nombreLimpio) return setMensaje('Ingresa tu nombre.')
    if (!apellidoLimpio) return setMensaje('Ingresa tu apellido.')
    if (!nivel) return setMensaje('Selecciona tu nivel.')
    if (!plan) return setMensaje('Selecciona tu plan asociado.')
    if (password.length < 8) return setMensaje('La contraseña debe tener mínimo 8 caracteres.')

    setCargando(true)

    // El rol no se envía: todo registro nace como "atleta" pendiente de aprobación (lo asigna el backend).
    try {
      await registrar({ nombre: nombreLimpio, apellido: apellidoLimpio, email, contrasena: password, nivel, planAsociado: plan })
    } catch (err) {
      setCargando(false)
      setMensaje(err.message)
      return
    }

    setCargando(false)
    setNombreRegistrado(nombreLimpio)
    irA('pendiente')
  }

  return (
    <div className="tarjeta">
      <img src="src/assets/icons/Logo-Club.png" alt="Logo BTC" className="logo-imagen" />
      <h2>Crear cuenta</h2>
      <p className="subtitulo">Completa tu información</p>

      <form onSubmit={registrarUsuario}>
        <label className="etiqueta" htmlFor="registro-nombre">Nombre</label>
        <input
          className="campo"
          type="text"
          id="registro-nombre"
          placeholder="Gabriela"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <label className="etiqueta" htmlFor="registro-apellido">Apellido</label>
        <input
          className="campo"
          type="text"
          id="registro-apellido"
          placeholder="Deoquiz"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
        />

        <label className="etiqueta" htmlFor="registro-correo">Correo electrónico</label>
        <input
          className="campo"
          type="email"
          id="registro-correo"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="etiqueta" htmlFor="registro-clave">Contraseña</label>
        <CampoClave
          id="registro-clave"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="etiqueta" htmlFor="registro-nivel">Nivel</label>
        <select
          className="campo"
          id="registro-nivel"
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          disabled={!NIVELES.length}
        >
          <option value="" disabled hidden>{textoVacio(NIVELES, 'niveles')}</option>
          {NIVELES.map(([v, t]) => (
            <option key={v} value={v}>{t}</option>
          ))}
        </select>

        <label className="etiqueta" htmlFor="registro-plan">Plan asociado</label>
        <select
          className="campo"
          id="registro-plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          disabled={!PLANES.length}
        >
          <option value="" disabled hidden>{textoVacio(PLANES, 'planes')}</option>
          {PLANES.map(([v, t]) => (
            <option key={v} value={v}>{t}</option>
          ))}
        </select>

        {mensaje && <div className="mensaje-error">{mensaje}</div>}

        <button className="boton-primario" type="submit" disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrarse'}
        </button>
        <p className="nota-pie">
          ¿Ya tienes cuenta? <a className="enlace-rojo" onClick={() => irA('login')}>Iniciar sesión</a>
        </p>
      </form>
    </div>
  )
}
export default Registro