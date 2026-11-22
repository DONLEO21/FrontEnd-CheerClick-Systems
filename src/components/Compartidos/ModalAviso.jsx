import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

/**
 * Aviso de resultado ÚNICO (éxito, error, advertencia, información): una sola variante compacta con un botón "Aceptar".
 * Para preguntar algo al usuario (dos botones) se usa <ModalConfirmar>. Estilos: .ui-aviso* en global.css.
 *
 *   <ModalAviso abierto={!!aviso} tipo="ok" titulo="Asistencia registrada correctamente"
 *     mensaje="La lista de Nivel 3 del 20 de noviembre quedó guardada." onCerrar={() => setAviso(null)} />
 */
const ICONOS = { ok: CheckCircle2, error: XCircle, advertencia: AlertTriangle, info: Info };

export default function ModalAviso({ abierto, tipo = "ok", titulo, mensaje, textoBoton = "Aceptar", onCerrar }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  const Icono = ICONOS[tipo] ?? Info;

  return createPortal(
    <dialog
      ref={ref}
      className="ui-aviso"
      aria-labelledby="ui-aviso-titulo"
      onCancel={(e) => { e.preventDefault(); onCerrar?.(); }}
      onClick={(e) => { if (e.target === ref.current) onCerrar?.(); }}
    >
      <span className={`ui-aviso__icono ui-aviso__icono--${tipo}`} aria-hidden="true"><Icono size={30} strokeWidth={2.2} /></span>
      <h2 id="ui-aviso-titulo" className="ui-aviso__titulo">{titulo}</h2>
      {mensaje && <p className="ui-aviso__mensaje">{mensaje}</p>}
      <button type="button" className={`ui-aviso__btn ui-aviso__btn--${tipo}`} onClick={onCerrar}>{textoBoton}</button>
    </dialog>,
    document.body
  );
}
