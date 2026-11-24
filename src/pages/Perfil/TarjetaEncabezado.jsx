import Avatar from "../../components/Compartidos/Avatar";
import { Pencil, Save, FileText } from 'lucide-react';
import { ETIQUETA_ROL } from './perfilData.js';
import { URL_POLIZA } from '../../config/enlaces.js';

export default function TarjetaEncabezado({
  rol, esAtleta, fotoUrl, nombre, apellido,
  editando, onCambiarFoto, onEditar, onGuardar, onCancelar,
}) {
  return (
    <div className="tarjeta-p tarjeta-p--fila">
      <div className="perfil-encabezado-foto">
        <div className="foto-contenedor">
          <figure className="foto-circulo">
            <Avatar foto={fotoUrl} nombre={nombre} apellido={apellido} alt="Foto de perfil" claseIniciales="foto-circulo__vacia" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
          </figure>
          <button
            className="foto-lapiz" type="button"
            title="Cambiar foto de perfil" aria-label="Cambiar foto de perfil"
            onClick={onCambiarFoto}
          >
            <Pencil size={13} strokeWidth={2.5} />
          </button>
        </div>

        <div className="perfil-encabezado-info">
          {/* "Nombre Apellido" completo, con salto de línea si es largo (nunca se trunca) */}
          <h2 className="perfil-nombre">{[nombre, apellido].filter(Boolean).join(' ') || '—'}</h2>
          <div className="perfil-insignias">
            <span className="insignia-rol">{ETIQUETA_ROL[rol]}</span>

            {esAtleta && (
              URL_POLIZA ? (
                <a
                  href={URL_POLIZA} target="_blank" rel="noopener noreferrer"
                  className="poliza-link" title="Ver mi póliza (se abre en una pestaña nueva)"
                >
                  <FileText size={13} />
                  Mi póliza
                </a>
              ) : (
                <span className="poliza-link poliza-link--inactivo" title="El enlace de la póliza aún no está configurado">
                  <FileText size={13} />
                  Mi póliza
                </span>
              )
            )}
          </div>
        </div>
      </div>

      <div className="perfil-encabezado-acciones">
        {!editando ? (
          <button type="button" className="btn btn-secundario" onClick={onEditar}>
            <Pencil size={15} />
            Editar información
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primario" onClick={onGuardar}>
              <Save size={15} />
              Guardar cambios
            </button>
            <button type="button" className="btn-texto" onClick={onCancelar}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}