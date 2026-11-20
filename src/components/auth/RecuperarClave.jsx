import { useState } from 'react'
import CampoClave from './CampoClave'
import { restablecerClave } from '../../services/sesion'

function RecuperarClave({ irA, correo, codigo }) {
  const [clave, setClave] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mensaje, setMensaje] = useState('')

  const guardarClave = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!clave || clave.length < 8) return setMensaje('La contraseña debe tener mínimo 8 caracteres.')
    if (clave !== confirmar) return setMensaje('Las contraseñas no coinciden.')

    try {
      await restablecerClave(correo, codigo, clave, confirmar)
    } catch (err) {
      return setMensaje(err.message)
    }
    irA('recuperar-exito')
  }

  return (
    <div className="tarjeta">
      <img src="src/assets/icons/Logo-Club.png" alt="Logo BTC" className="logo-imagen" />
      <h2>Nueva contraseña</h2>
      <p className="subtitulo">Crea una contraseña segura<br />para tu cuenta</p>

      <div className="puntos-paso">
        <div className="punto-paso completado"></div>
        <div className="punto-paso completado"></div>
        <div className="punto-paso activo"></div>
      </div>

      <form onSubmit={guardarClave}>
        <label className="etiqueta" htmlFor="clave-nueva">Nueva contraseña</label>
        <CampoClave
          id="clave-nueva"
          placeholder="Mínimo 8 caracteres"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
        />

        <label className="etiqueta" htmlFor="confirmar-clave">Confirmar contraseña</label>
        <CampoClave
          id="confirmar-clave"
          placeholder="Repite la contraseña"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />

        {mensaje && <div className="mensaje-error">{mensaje}</div>}

        <button className="boton-primario" type="submit">Guardar contraseña</button>
        <button
          className="boton-secundario boton-bloque"
          type="button"
          style={{ marginTop: '8px' }}
          onClick={() => irA('recuperar-codigo')}
        >
          &#8592; Volver
        </button>
      </form>
    </div>
  )
}

export default RecuperarClave