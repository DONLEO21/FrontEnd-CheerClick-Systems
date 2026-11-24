import { MessageSquare } from 'lucide-react';
import BloqueContacto from './BloqueContacto.jsx';

export default function TarjetaContactos({ contactos, editando, onCambio, cantidad = 2, falta = false }) {
  const sinContacto = editando && falta && !contactos[0]?.nombre?.trim();
  return (
    <div className="tarjeta-p" data-campo-perfil="contactoEmergencia">
      <div className="seccion-titulo">
        <span className="seccion-titulo__icono"><MessageSquare size={17} /></span>
        <div>
          <h3>Contactos de emergencia</h3>
          <p className="seccion-titulo__sub">
            {cantidad === 1
              ? '1 contacto a quien avisar en caso de emergencia'
              : 'Hasta 2 contactos a quienes avisar en caso de emergencia'}
          </p>
        </div>
      </div>
      <div className="divisor" />
      {sinContacto && <small className="perfil-campo-error" role="alert">Agrega al menos un contacto de emergencia para completar tu perfil.</small>}
      <div className="contactos-grid">
        {contactos.slice(0, cantidad).map((c, i) => (
          <BloqueContacto
            key={i}
            numero={i + 1}
            contacto={c}
            editando={editando}
            onCambio={(campo, valor) => onCambio(i, campo, valor)}
          />
        ))}
      </div>
    </div>
  );
}