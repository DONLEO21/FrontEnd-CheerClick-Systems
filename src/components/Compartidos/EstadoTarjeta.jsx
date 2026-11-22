import EstadoError from "./EstadoError";

/**
 * Cuerpo estándar de una tarjeta que depende de datos: esqueleto mientras carga, error con "Reintentar",
 * mensaje de vacío ("Aún no hay …") o el contenido real. Estilos: .ui-skeleton / .ui-vacio en global.css
 *
 *   <EstadoTarjeta cargando={c} error={e} onReintentar={r} vacio={lista.length === 0} textoVacio="Aún no hay campeonatos.">
 *     …contenido…
 *   </EstadoTarjeta>
 */
export default function EstadoTarjeta({ cargando, error, onReintentar, vacio, textoVacio = "Aún no hay información.", lineas = 3, children }) {
  if (cargando) {
    return (
      <div className="ui-skeleton-grupo" aria-busy="true" aria-label="Cargando">
        {Array.from({ length: lineas }, (_, i) => <span key={i} className="ui-skeleton" />)}
      </div>
    );
  }
  if (error) return <EstadoError mensaje={error} onReintentar={onReintentar} />;
  if (vacio) return <p className="ui-vacio">{textoVacio}</p>;
  return children;
}
