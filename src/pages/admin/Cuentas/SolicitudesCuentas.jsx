import { useEffect, useState } from 'react'
import { Search, Users, UserPlus } from 'lucide-react'

import AvisoToast from '../../../components/Compartidos/AvisoToast'
import useAviso from '../../../hooks/useAviso'

import useCuentas from './useCuentas.js'
import VistaSolicitudes from './VistaSolicitudes.jsx'
import VistaGestion from './VistaGestion.jsx'
import ModalDetalle from './ModalDetalle.jsx'
import ModalConfirmar from '../../../components/Compartidos/ModalConfirmar'
import { ACCIONES } from './cuentasData.js'
import ModalCrearUsuario from './ModalCrearUsuario.jsx'

import './SolicitudCuentas.css'

export default function SolicitudesCuentas() {
  const { aviso, mostrarAviso } = useAviso()
  const c = useCuentas(mostrarAviso)

  const [busqueda, setBusqueda] = useState('')
  useEffect(() => { setBusqueda('') }, [c.esGestion])

  const accionDesdeDetalle = (usuario, accion, extra = {}) => {
    if (accion === 'cambiar-rol' && usuario.estado === 'pendiente') {
      c.setDetalle({ ...usuario, rol: extra.rol })
      return
    }
    if (accion === 'aprobar') {
      c.pedirConfirmacion(usuario, 'aprobar', { rol: usuario.rol })
    } else {
      c.pedirConfirmacion(usuario, accion, extra)
    }
    c.cerrarDetalle()
  }

  return (
    <div className="adm-cuentas">
      <div className="contenedor">
        <section className="pagina-encabezado">
          <h1>{c.esGestion ? 'Gestión de cuentas' : 'Solicitudes de nuevas cuentas'}</h1>
          <p className="pagina-subtitulo">
            {c.esGestion
              ? 'Activa o desactiva el acceso y define el rol de los miembros registrados en el club.'
              : 'Gestiona las solicitudes de ingreso de nuevos miembros del club.'}
          </p>
        </section>

        <div className="acciones-barra">
          <div className="buscar-wrap">
            <Search size={15} strokeWidth={2} />
            <input
              type="text"
              placeholder={c.esGestion ? 'Buscar usuario' : 'Buscar solicitud'}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="acciones-btns">
            {c.esGestion && (
              <button className="btn-crear-usuario" onClick={c.abrirCrear}>
                <UserPlus size={16} strokeWidth={2.2} /> Crear usuario
              </button>
            )}
            <button className={`btn ${c.esGestion ? 'btn-azul' : 'btn-amarillo'}`} onClick={c.alternarVista}>
              <Users size={15} strokeWidth={2} /> {c.esGestion ? 'Validar cuentas' : 'Gestionar cuentas'}
            </button>
          </div>
        </div>

        {c.esGestion ? (
          <VistaGestion
            usuarios={c.usuarios}
            cargando={c.cargando}
            busqueda={busqueda}
            onToggle={(u) => c.pedirConfirmacion(u, u.activo ? 'desactivar' : 'activar')}
            onCambiarRol={(u, rol) => c.pedirConfirmacion(u, 'cambiar-rol', { rol })}
          />
        ) : (
          <VistaSolicitudes
            usuarios={c.usuarios}
            cargando={c.cargando}
            tab={c.tab}
            onTab={c.setTab}
            busqueda={busqueda}
            onVer={c.abrirDetalle}
            onAccion={c.pedirConfirmacion}
          />
        )}
      </div>

      {c.detalle && (
        <ModalDetalle
          detalle={c.detalle}
          perfil={c.perfilDetalle}
          registro={c.registroDetalle}
          cargandoPerfil={c.cargandoDetalle}
          onCerrar={c.cerrarDetalle}
          onAccion={accionDesdeDetalle}
        />
      )}

      {c.crearAbierto && (
        <ModalCrearUsuario
          onCerrar={c.cerrarCrear}
          onCrear={c.crearUsuario}
          creando={c.creando}
        />
      )}

      {c.confirmar && (
        <ModalConfirmar
          abierto
          titulo={ACCIONES[c.confirmar.accion].titulo}
          mensaje={ACCIONES[c.confirmar.accion].desc(c.confirmar.usuario.nombre, c.confirmar.rol)}
          tipo={ACCIONES[c.confirmar.accion].clase === 'btn-verde' ? 'ok' : 'peligro'}
          textoConfirmar={ACCIONES[c.confirmar.accion].boton}
          onConfirmar={c.ejecutar}
          onCancelar={c.cancelarConfirmacion}
        />
      )}

      <AvisoToast aviso={aviso} />
    </div>
  )
}