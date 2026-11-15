import { useState } from 'react'
import { X, User } from 'lucide-react'
import CampoClave from '../../../components/auth/CampoClave'
import { ROLES, NOMBRE_ROL, NIVELES, PLANES } from './cuentasData.js'

const VACIO = {
  rol: ROLES[0], nombre: '', apellido: '', email: '', password: '', nivel: '', plan: '',
}

export default function ModalCrearUsuario({ onCerrar, onCrear, creando }) {
  const [datos, setDatos] = useState(VACIO)
  const [mensaje, setMensaje] = useState('')

  const cambiar = (campo) => (e) => setDatos((d) => ({ ...d, [campo]: e.target.value }))

  const enviar = async () => {
    setMensaje('')
    const nombre = datos.nombre.trim()
    const apellido = datos.apellido.trim()
    const email = datos.email.trim()

    if (!nombre) return setMensaje('Ingresa el nombre.')
    if (!apellido) return setMensaje('Ingresa el apellido.')
    if (!email) return setMensaje('Ingresa el correo electrónico.')
    if (!datos.nivel) return setMensaje('Selecciona el nivel.')
    if (!datos.plan) return setMensaje('Selecciona el plan asociado.')
    if (datos.password.length < 6) return setMensaje('La contraseña debe tener mínimo 6 caracteres.')

    try {
      await onCrear({ ...datos, nombre, apellido, email })
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
                {ROLES.map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
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
              <CampoClave id="crear-password" placeholder="Mínimo 6 caracteres"
                value={datos.password} onChange={cambiar('password')} />
            </div>

            <div className="detalle-grupo">
              <label htmlFor="crear-nivel">Nivel</label>
              <select className="campo" id="crear-nivel" value={datos.nivel} onChange={cambiar('nivel')}>
                <option value="" disabled hidden>Seleccionar...</option>
                {NIVELES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>

            <div className="detalle-grupo">
              <label htmlFor="crear-plan">Plan asociado</label>
              <select className="campo" id="crear-plan" value={datos.plan} onChange={cambiar('plan')}>
                <option value="" disabled hidden>Seleccionar...</option>
                {PLANES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
          </div>

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