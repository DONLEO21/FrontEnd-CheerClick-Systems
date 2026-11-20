import { createPortal } from "react-dom";
import { TriangleAlert, CircleCheck, CircleX } from "lucide-react";

// Aviso/toast ÚNICO de la aplicación. Estilos: .ui-toast en src/styles/global.css
// aviso = { visible: boolean, mensaje: string, tipo: "ok" | "advertencia" | "error" }
const ICONOS = {
  ok: CircleCheck,
  advertencia: TriangleAlert,
  error: CircleX,
};

export default function AvisoToast({ aviso }) {
  const Icono = ICONOS[aviso.tipo] ?? TriangleAlert;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`ui-toast ui-toast--${aviso.tipo} ${aviso.visible ? "ui-toast--visible" : ""}`}
    >
      <Icono size={20} strokeWidth={2.2} aria-hidden="true" />
      <span>{aviso.mensaje}</span>
    </div>,
    document.body
  );
}
