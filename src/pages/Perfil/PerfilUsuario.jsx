import { useNavigate } from 'react-router-dom';
import AvisoToast from '../../components/Compartidos/AvisoToast';
import useAviso from '../../hooks/useAviso';
import useUsuario from '../../hooks/useUsuario';

import usePerfil from './usePerfil.js';
import { iniciales } from './perfilData.js';
import TarjetaEncabezado from './TarjetaEncabezado.jsx';
import TarjetaSeguridad from './TarjetaSeguridad.jsx';
import TarjetaPreferencias from './TarjetaPreferencias.jsx';
import TarjetaInfoPersonal from './TarjetaInfoPersonal.jsx';
import TarjetaContactos from './TarjetaContactos.jsx';
import ModalFoto from './ModalFoto.jsx';
import ModalConfirmar from './ModalConfirmar.jsx';

import './PerfilUsuario.css';

export default function PerfilUsuario({ rol = 'atleta' }) {
  const esAtleta = rol === 'atleta';

  const navigate = useNavigate();

  const { aviso, mostrarAviso } = useAviso();

  const usuario = useUsuario();
  const nombreCompleto = usuario.nombre || (usuario.cargando ? '' : 'Usuario');
  const apellido = usuario.apellido || '';
  const inicialesUsuario = iniciales(nombreCompleto);

  const {
    datos, vista, bloqueos, editando, guardando, guardandoFoto,
    errorGuardar, cargandoPerfil, modal, setModal,
    cantidadContactos, cambiosUnaVez, errorFecha, errorNombre,
    cambiar, cambiarContacto, cambiarArchivoEps,
    activarEdicion, cancelarEdicion, confirmarGuardar, guardarFoto,
  } = usePerfil({ rol, mostrarAviso });

  return (
    <div className="perfil-pagina">
      <div className="perfil-main ui-contenido">
          <div className="perfil-contenedor">

            <section className="pagina-encabezado">
              <h1>Mi perfil</h1>
              <p className="pagina-encabezado__sub">
                Gestiona tu información personal y preferencias de cuenta.
              </p>
            </section>

            {cargandoPerfil ? (
              <p className="perfil-cargando">Cargando tu información…</p>
            ) : (
              <div className="perfil-layout">

                {/* Foto y nombre */}
                <TarjetaEncabezado
                  rol={rol}
                  esAtleta={esAtleta}
                  fotoUrl={datos.fotoUrl}
                  inicialesUsuario={inicialesUsuario}
                  nombre={vista.nombre || nombreCompleto}
                  apellido={vista.nombre ? vista.apellido : apellido}
                  editando={editando}
                  onCambiarFoto={() => setModal('foto')}
                  onEditar={activarEdicion}
                  onGuardar={() => (errorNombre || errorFecha ? mostrarAviso(errorNombre || errorFecha, 'error') : setModal('confirmar'))}
                  onCancelar={cancelarEdicion}
                />

                {/* Seguridad + Preferencias, lado a lado */}
                <div className="perfil-fila-doble">
                  <TarjetaSeguridad
                    onCambiarContrasena={() => navigate('/acceso?view=recuperar')}
                  />
                  <TarjetaPreferencias />
                </div>

                {/* Información personal */}
                <TarjetaInfoPersonal
                  vista={vista}
                  editando={editando}
                  bloqueos={bloqueos}
                  onCambiar={cambiar}
                  onCambiarArchivoEps={cambiarArchivoEps}
                  rol={rol}
                  errorFecha={errorFecha}
                  errorNombre={errorNombre}
                />

                {/* Contactos de emergencia: 2 para atleta, 1 para entrenador/admin */}
                <TarjetaContactos
                  contactos={vista.contactos}
                  editando={editando}
                  onCambio={cambiarContacto}
                  cantidad={cantidadContactos}
                />
              </div>
            )}
          </div>

          {/* ===== Modales ===== */}

          <ModalFoto
            abierto={modal === 'foto'}
            fotoActual={datos.fotoUrl}
            iniciales={inicialesUsuario}
            guardando={guardandoFoto}
            onCerrar={() => setModal(null)}
            onGuardar={guardarFoto}
          />

          <ModalConfirmar
            abierto={modal === 'confirmar'}
            onCerrar={() => setModal(null)}
            cambiosUnaVez={cambiosUnaVez}
            errorGuardar={errorGuardar}
            guardando={guardando}
            onConfirmar={confirmarGuardar}
          />
      </div>

      <AvisoToast aviso={aviso} />
    </div>
  );
}