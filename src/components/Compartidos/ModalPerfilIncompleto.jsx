import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Lock, X } from 'lucide-react';
import { resumirFaltantes } from '../../utils/perfilFaltantes';

/**
 * Modal informativo al intentar abrir un módulo con el perfil incompleto. NO es una barrera: se puede cerrar con «Ahora no», la X,
 * Escape o un clic en el fondo, y la persona se queda donde estaba. «Completar mi perfil» la lleva al perfil.
 * Es un <dialog> nativo en un portal a document.body (foco atrapado, Escape y `aria-modal` nativos). Estilos: .ui-perfil-* en global.css
 *
 * Props: abierto, modulo (nombre del módulo que quiso abrir), faltantes [{ campo, etiqueta }], onCompletar(), onCerrar().
 */
export default function ModalPerfilIncompleto({ abierto, modulo, faltantes = [], onCompletar, onCerrar }) {
  const ref = useRef(null);
  const idTitulo = useId();
  const idTexto = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  const { visibles, extra } = resumirFaltantes(faltantes, 5);

  return createPortal(
    <dialog
      ref={ref}
      className="ui-perfil-dialogo ui-anim-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
      aria-describedby={idTexto}
      onCancel={(e) => { e.preventDefault(); onCerrar?.(); }}
      onClick={(e) => { if (e.target === ref.current) onCerrar?.(); }}
    >
      <button type="button" className="ui-perfil-dialogo__cerrar" onClick={onCerrar} aria-label="Cerrar">
        <X size={18} aria-hidden="true" />
      </button>
      <span className="ui-perfil-dialogo__icono" aria-hidden="true"><Lock size={28} strokeWidth={2} /></span>
      <h2 id={idTitulo} className="ui-perfil-dialogo__titulo">Completa tu perfil para continuar</h2>
      <p id={idTexto} className="ui-perfil-dialogo__texto">
        Para acceder a <strong>{modulo || 'este módulo'}</strong> necesitamos que primero completes tu perfil. Solo te tomará unos minutos.
      </p>
      {visibles.length > 0 && (
        <div className="ui-perfil-faltantes">
          <span className="ui-perfil-faltantes__titulo">Te falta:</span>
          <ul className="ui-perfil-chips" aria-label="Datos que faltan">
            {visibles.map((f) => <li key={f.campo} className="ui-perfil-chip">{f.etiqueta}</li>)}
            {extra > 0 && <li className="ui-perfil-chip ui-perfil-chip--mas">+{extra} más</li>}
          </ul>
        </div>
      )}
      <div className="ui-perfil-dialogo__acciones">
        <button type="button" className="ui-confirmar__btn ui-confirmar__btn--peligro" onClick={onCompletar} autoFocus>
          Completar mi perfil
        </button>
        <button type="button" className="ui-confirmar__btn ui-confirmar__btn--sec" onClick={onCerrar}>
          Ahora no
        </button>
      </div>
    </dialog>,
    document.body
  );
}
