import { useEffect, useState } from 'react'
import { X, User } from 'lucide-react'
import CampoClave from '../../../components/auth/CampoClave'
import { ROLES, ROLES_CREAR, NOMBRE_ROL } from './cuentasData.js'
import { listarNivelesOpciones, listarPlanesOpciones } from '../../../services/catalogos'

const VACIO = {
  rol: ROLES[0], nombre: '', apellido: '', email: '', password: '', nivel: '', plan: '', tambienEntrenador: false,
}

export default function ModalCrearUsuario({ onCerrar, onCrear, creando }) {
  const [datos, setDatos] = useState(VACIO)
  const [mensaje, setMensaje] = useState('')
  // Niveles y planes reales del club (vienen del backend)
  const [niveles, setNiveles] = useState([])
  const [planes, setPlanes] = useState([])
  useEffect(() => {
    listarNivelesOpciones().then(setNiveles).catch((e) => setMensaje(e.message))
    listarPlanesOpciones().then(setPlanes).catch((e) => setMensaje(e.message))
  }, [])

  const cambiar = (campo) => (e) => setDatos((d) => ({ ...d, [campo]: e.target.value }))

  const enviar = async () => {
    setMensaje('')
    const nombre = datos.nombre.trim()
    const apellido = datos.apellido.trim()
    const email = datos.email.trim()

    if (!nombre) return setMensaje('Ingresa el nombre.')
    if (!apellido) return setMensaje('Ingresa el apellido.')
    if (!email) return setMensaje('Ingresa el correo electrónico.')
    // el backend exige nivel a atletas y entrenadores; el administrador no lleva nivel ni plan
    if (datos.rol !== 'administrador' && !datos.nivel) return setMensaje('Selecciona el nivel.')
    // el backend exige plan solo para atletas (el entrenador solo lleva nivel)
    if (datos.rol === 'atleta' && !datos.plan) return setMensaje('Selecciona el plan asociado.')
    if (datos.password.length < 8) return setMensaje('La contraseña debe tener mínimo 8 caracteres.')

    try {
      await onCrear({ ...datos, nivel: datos.rol === 'administrador' ? '' : datos.nivel, plan: datos.rol === 'atleta' ? datos.plan : '', nombre, apellido, email })
    } catch (e) {
      setMensaje(e.message)
    }
  }

  return (
    <div className="modal-overlay modal-overlay--scroll"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal-dialogo modal--detalles" role="dialog" aria-modal="true">
        <div className="modal-cabeza">
          <h2 className="modal-cabeza__titulo">Crear usuario</h2>
          <button className="modal-cerrar" onClick={onCerrar}><X size={20} strokeWidth={2.5} /></button>
        </div>

        <div className="modal-cuerpo">
          <div className="detalle-titulo-seccion detalle-titulo-seccion--inicio">
            <User size={14} strokeWidth={2} />
            Datos del usuario
          </div>
          <div className="detalle-grid">
            <div className="detalle-grupo">
              <label htmlFor="crear-rol">Rol</label>
              <select
                id="crear-rol"
                className={`select-rol-modal select-rol-modal--${datos.rol}`}
                value={datos.rol}
                onChange={cambiar('rol')}
              >
                {ROLES_CREAR.map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
              </select>
            </div>

            <div className="detalle-grupo">
              <label htmlFor="crear-nombre">Nombre</label>
              <input className="campo" id="crear-nombre" type="text" placeholder="Gabriela"
                value={datos.nombre} onChange={cambiar('nombre')} />
            </div>

            <div className="detalle-grupo">
              <label htmlFor="crear-apellido">Apellido</label>
              <input className="campo" id="crear-apellido" type="text" placeholder="Deaquiz"
                value={datos.apellido} onChange={cambiar('apellido')} />
            </div>

            <div className="detalle-grupo detalle-grupo--full">
              <label htmlFor="crear-email">Correo electrónico</label>
              <input className="campo" id="crear-email" type="email" placeholder="correo@ejemplo.com"
                value={datos.email} onChange={cambiar('email')} />
            </div>

            <div className="detalle-grupo detalle-grupo--full">
              <label htmlFor="crear-password">Contraseña</label>
              <CampoClave id="crear-password" placeholder="Mínimo 8 caracteres"
                value={datos.password} onChange={cambiar('password')} />
              <small>Es temporal: la persona deberá cambiarla en su primer inicio de sesión.</small>
            </div>

            <div className="detalle-grupo">
              <label htmlFor="crear-nivel">Nivel</label>
              <select className="campo" id="crear-nivel" value={datos.rol === 'administrador' ? '' : datos.nivel} onChange={cambiar('nivel')} disabled={datos.rol === 'administrador'}>
                <option value="" disabled hidden>Seleccionar...</option>
                {niveles.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>

            <div className="detalle-grupo">
              <label htmlFor="crear-plan">Plan asociado</label>
              <select className="campo" id="crear-plan" value={datos.rol === 'atleta' ? datos.plan : ''} onChange={cambiar('plan')} disabled={datos.rol !== 'atleta'}>
                <option value="" disabled hidden>Seleccionar...</option>
                {planes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
          </div>

          {datos.rol === 'administrador' && (
            <label className="interruptor-fila">
              <span className="interruptor-fila__texto">
                <strong>También actúa como entrenador</strong>
                <small>Podrá dirigir niveles y usar la vista de entrenador.</small>
              </span>
              <span className="toggle">
                <input type="checkbox" checked={datos.tambienEntrenador}
                  onChange={(e) => setDatos((d) => ({ ...d, tambienEntrenador: e.target.checked }))} />
                <span className="toggle__pista" />
              </span>
            </label>
          )}

          {mensaje && <div className="mensaje-error">{mensaje}</div>}
        </div>

        <div className="modal-pie">
          <button className="btn btn-blanco" onClick={onCerrar} disabled={creando}>Cancelar</button>
          <button className="btn btn-verde" onClick={enviar} disabled={creando}>
            {creando ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </div>
  )
}