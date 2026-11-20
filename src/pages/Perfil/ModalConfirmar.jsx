import { Lock } from 'lucide-react';
import ModalConfirmarBase from '../../components/Compartidos/ModalConfirmar.jsx';
import { ETIQUETA_CAMPO } from './perfilData.js';

// Confirmación de "Guardar cambios" del perfil: usa el modal compartido y agrega el aviso de campos de un solo cambio
export default function ModalConfirmar({ abierto, onCerrar, cambiosUnaVez, errorGuardar, guardando, onConfirmar }) {
  return (
    <ModalConfirmarBase
      abierto={abierto}
      titulo="¿Guardar cambios?"
      mensaje="Se actualizará tu información personal. ¿Confirmas los cambios realizados?"
      tipo="normal"
      textoConfirmar="Sí, guardar"
      cargando={guardando}
      error={errorGuardar}
      onConfirmar={async () => { await onConfirmar(); }}
      onCancelar={onCerrar}
    >
      {cambiosUnaVez.length > 0 && (
        <p className="perfil-modal-advertencia" role="alert">
          <Lock size={14} />
          <span>
            Vas a modificar{' '}
            <strong>{cambiosUnaVez.map((c) => ETIQUETA_CAMPO[c].toLowerCase()).join(', ')}</strong>.
            Después de guardar no podrás volver a cambiarlo.
          </span>
        </p>
      )}
    </ModalConfirmarBase>
  );
}
