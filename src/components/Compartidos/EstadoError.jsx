import { AlertCircle, RotateCw } from "lucide-react";

/**
 * Estado de error ÚNICO para vistas que cargan datos: muestra el mensaje real del backend y un botón
 * "Reintentar". Estilos: .ui-estado-error en src/styles/global.css
 *   <EstadoError mensaje={error} onReintentar={cargar} />
 */
export default function EstadoError({ mensaje, onReintentar }) {
  return (
    <div className="ui-estado-error" role="alert">
      <AlertCircle size={28} aria-hidden="true" />
      <p>{mensaje || "No se pudo cargar la información."}</p>
      {onReintentar && (
        <button type="button" className="ui-estado-error__btn" onClick={onReintentar}>
          <RotateCw size={15} aria-hidden="true" /> Reintentar
        </button>
      )}
    </div>
  );
}
