import { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

/**
 * Modal de confirmación ÚNICO de la aplicación (sustituye a window.confirm, SweetAlert y a las copias
 * por módulo). Usa <dialog>: el centrado, el scroll interno y el límite de tamaño vienen de global.css.
 * Estilos: .ui-confirmar* en src/styles/global.css
 *
 *   <ModalConfirmar
 *     abierto={!!pendiente}
 *     titulo="¿Eliminar?"
 *     mensaje="Esta acción no se puede deshacer."
 *     tipo="peligro"                 // "peligro" (rojo) | "ok" (verde) | "normal"
 *     textoConfirmar="Sí, eliminar"
 *     cargando={guardando}
 *     onConfirmar={...} onCancelar={...}
 *   >contenido extra opcional</ModalConfirmar>
 */
export default function ModalConfirmar({
  abierto,
  titulo,
  mensaje,
  children,
  tipo = "normal",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  cargando = false,
  error = "",
  onConfirmar,
  onCancelar,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  const Icono = tipo === "ok" ? CheckCircle2 : AlertTriangle;

  return (
    <dialog
      ref={ref}
      className="ui-confirmar"
      aria-labelledby="ui-confirmar-titulo"
      onCancel={(e) => { e.preventDefault(); if (!cargando) onCancelar?.(); }}
      onClick={(e) => { if (e.target === ref.current && !cargando) onCancelar?.(); }}
    >
      <div className="ui-confirmar__cabeza">
        <span className={`ui-confirmar__icono ui-confirmar__icono--${tipo}`} aria-hidden="true"><Icono size={22} /></span>
        <h2 id="ui-confirmar-titulo" className="ui-confirmar__titulo">{titulo}</h2>
        <button type="button" className="ui-confirmar__cerrar" aria-label="Cerrar" onClick={onCancelar} disabled={cargando}>
          <X size={18} />
        </button>
      </div>

      {mensaje && <p className="ui-confirmar__mensaje">{mensaje}</p>}
      {children}
      {error && <p className="ui-confirmar__error" role="alert">{error}</p>}

      <div className="ui-confirmar__pie">
        <button type="button" className="ui-confirmar__btn ui-confirmar__btn--sec" onClick={onCancelar} disabled={cargando}>
          {textoCancelar}
        </button>
        <button
          type="button"
          className={`ui-confirmar__btn ui-confirmar__btn--${tipo === "ok" ? "ok" : "peligro"}`}
          onClick={onConfirmar}
          disabled={cargando}
        >
          {cargando ? "Procesando…" : textoConfirmar}
        </button>
      </div>
    </dialog>
  );
}
