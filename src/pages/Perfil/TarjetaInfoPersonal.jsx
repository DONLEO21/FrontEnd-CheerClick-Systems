import {
  User, CreditCard, Mail, Phone, Heart, File, Calendar, VenusAndMars,
} from 'lucide-react';
import Campo from './Campo.jsx';
import { TIPOS_DOCUMENTO, GENEROS, EPS } from './perfilData.js';
import { fechaMaximaPermitida } from '../../utils/fechaNacimiento.js';
import { campoPerfilVacio } from '../../utils/perfilFaltantes.js';

export default function TarjetaInfoPersonal({
  vista, editando, bloqueos, onCambiar, onCambiarArchivoEps, rol, errorFecha, errorNombre, faltantes = [],
}) {
  // Perfil incompleto (obligatorio): el campo que el backend dice que falta lleva asterisco y, mientras siga vacío, borde de acento
  // y el mensaje «Obligatorio…» debajo
  const requerido = (campo) => editando && faltantes.includes(campo);
  const sinLlenar = (campo) => requerido(campo) && campoPerfilVacio(campo, vista);
  const marca = (campo) => (sinLlenar(campo) ? 'Obligatorio para completar tu perfil.' : undefined);
  const aria = (campo) => (sinLlenar(campo) ? { 'aria-invalid': true } : {});
  const editable = (campo) => editando && !bloqueos[campo];

  const avisoUnaVez = (campo) =>
    bloqueos[campo]
      ? 'Ya no se puede modificar.'
      : editando
        ? 'Solo se puede editar una vez.'
        : null;

  return (
    <div className="tarjeta-p">
      <div className="seccion-titulo">
        <span className="seccion-titulo__icono"><User size={17} /></span>
        <div>
          <h3>Información personal</h3>
          <p className="seccion-titulo__sub">Actualiza tus datos personales y de contacto</p>
        </div>
      </div>
      <div className="divisor" />

      <div className="campos-grid">

        <Campo id="perfil-nombre" label="Nombre" icono={User} error={errorNombre && !vista.nombre?.trim() ? errorNombre : undefined}>
          <input
            type="text" id="perfil-nombre" autoComplete="given-name" maxLength={60} placeholder="—"
            value={vista.nombre} disabled={!editando}
            onChange={(e) => onCambiar('nombre', e.target.value)}
          />
        </Campo>

        <Campo id="perfil-apellido" label="Apellido" icono={User} error={errorNombre && vista.nombre?.trim() && !vista.apellido?.trim() ? errorNombre : undefined}>
          <input
            type="text" id="perfil-apellido" autoComplete="family-name" maxLength={60} placeholder="—"
            value={vista.apellido} disabled={!editando}
            onChange={(e) => onCambiar('apellido', e.target.value)}
          />
        </Campo>

        <Campo id="tipo-documento" label="Tipo de documento" icono={User}>
          <select
            id="tipo-documento" value={vista.tipoDocumento} disabled={!editando}
            onChange={(e) => onCambiar('tipoDocumento', e.target.value)}
          >
            {TIPOS_DOCUMENTO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Campo>

        <Campo
          id="numero-doc" label="Número de documento" icono={CreditCard}
          aviso={avisoUnaVez('numeroDocumento')} error={marca('numDocumento')} requerido={requerido('numDocumento')} faltante={sinLlenar('numDocumento')}
        >
          <input
            type="text" id="numero-doc" inputMode="numeric" {...aria('numDocumento')} placeholder="—"
            value={vista.numeroDocumento} disabled={!editable('numeroDocumento')}
            onChange={(e) => onCambiar('numeroDocumento', e.target.value.replace(/\D/g, ''))}
          />
        </Campo>

        <Campo id="genero" label="Género" icono={VenusAndMars} aviso={avisoUnaVez('genero')} error={marca('genero')} requerido={requerido('genero')} faltante={sinLlenar('genero')}>
          <select
            id="genero" value={vista.genero} disabled={!editable('genero')}
            onChange={(e) => onCambiar('genero', e.target.value)}
          >
            <option value="" disabled>Selecciona una opción</option>
            {GENEROS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Campo>

        <Campo
          id="fecha-nacimiento" label="Fecha de nacimiento" icono={Calendar}
          aviso={avisoUnaVez('fechaNacimiento')} error={errorFecha || marca('fechaNacimiento')} requerido={requerido('fechaNacimiento')} faltante={sinLlenar('fechaNacimiento')}
        >
          <input
            type="date" id="fecha-nacimiento"
            max={fechaMaximaPermitida(rol)}
            value={vista.fechaNacimiento} disabled={!editable('fechaNacimiento')}
            onChange={(e) => onCambiar('fechaNacimiento', e.target.value)}
          />
        </Campo>

        <Campo id="registro-correo" label="Correo electrónico" icono={Mail}>
          <input
            type="email" id="registro-correo" value={vista.correo} disabled={!editando}
            onChange={(e) => onCambiar('correo', e.target.value)}
          />
        </Campo>

        <Campo id="telefono-personal" label="Teléfono" icono={Phone} error={marca('telefono')} requerido={requerido('telefono')} faltante={sinLlenar('telefono')}>
          <input
            type="tel" id="telefono-personal" {...aria('telefono')} placeholder="—" value={vista.telefono} disabled={!editando}
            onChange={(e) => onCambiar('telefono', e.target.value)}
          />
        </Campo>

        <Campo id="eps-nombre" label="Nombre de EPS" icono={Heart} error={marca('eps')} requerido={requerido('eps')} faltante={sinLlenar('eps')}>
          <select
            id="eps-nombre" value={vista.eps} disabled={!editando}
            onChange={(e) => onCambiar('eps', e.target.value)}
          >
            <option value="" disabled>Selecciona una opción</option>
            {EPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Campo>

        <div className={`form-grupo${sinLlenar('certificadoEps') ? ' perfil-campo--faltante' : ''}`} data-campo-perfil="certificadoEps">
          <label>Certificado de EPS{requerido('certificadoEps') && <span className="perfil-asterisco" aria-hidden="true">*</span>}</label>
          <div className="campo-archivo-visualizacion">
            <File size={16} />
            {vista.certificadoEpsUrl ? (
              <a
                className="nombre-archivo nombre-archivo--enlace"
                href={vista.certificadoEpsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {vista.certificadoEpsNombre || 'Ver certificado'}
              </a>
            ) : (
              <span className="nombre-archivo">{vista.certificadoEpsNombre || 'Sin certificado'}</span>
            )}
            {editando && (
              <label className="boton-archivo--perfil" htmlFor="eps-certificado-perfil">
                Cambiar archivo
                <input
                  type="file" id="eps-certificado-perfil" hidden
                  accept=".pdf,.jpg,.jpeg,.png" onChange={onCambiarArchivoEps}
                />
              </label>
            )}
          </div>
          {marca('certificadoEps') && (
            <small className="perfil-campo-error" role="alert">{marca('certificadoEps')}</small>
          )}
        </div>

      </div>
    </div>
  );
}